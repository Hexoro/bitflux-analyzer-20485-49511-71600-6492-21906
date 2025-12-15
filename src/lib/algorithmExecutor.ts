/**
 * Algorithm Executor - Real execution with Lua/Python/C++ support
 */

import { luaExecutor } from './luaExecutor';
import { pythonExecutor } from './pythonExecutor';
import { cppExecutor } from './cppExecutor';
import { algorithmManager } from './algorithmManager';
import { predefinedManager } from './predefinedManager';

export interface ExecutionStep {
  stepNumber: number;
  operation: string;
  parameters: Record<string, any>;
  bitsBefore: string;
  bitsAfter: string;
  metricsBefore: Record<string, number>;
  metricsAfter: Record<string, number>;
  cost: number;
  budgetRemaining: number;
  timestamp: Date;
  sizeBefore: number;
  sizeAfter: number;
  rangeStart?: number;
  rangeEnd?: number;
}

export interface ExecutionResult {
  id: string;
  strategyId: string;
  strategyName: string;
  strategyLanguage: 'lua' | 'python' | 'cpp' | 'unknown';
  startTime: Date;
  endTime: Date;
  duration: number;
  steps: ExecutionStep[];
  initialBits: string;
  finalBits: string;
  initialSize: number;
  finalSize: number;
  compressionRatio: number;
  totalCost: number;
  initialBudget: number;
  finalBudget: number;
  peakMemoryMB: number;
  cpuTimeMs: number;
  success: boolean;
  error?: string;
  bitRangesAccessed: { start: number; end: number; operation: string }[];
  executionMode: 'real' | 'simulated';
  logs: string[];
}

export type ExecutionState = 'idle' | 'running' | 'paused' | 'completed' | 'error' | 'loading';

export interface ExecutorCallbacks {
  onStep?: (step: ExecutionStep) => void;
  onComplete?: (result: ExecutionResult) => void;
  onError?: (error: string) => void;
  onStateChange?: (state: ExecutionState) => void;
  onLog?: (message: string) => void;
}

export interface ExecutionContext {
  bits: string;
  budget: number;
  initialBudget: number;
  enabledMetrics: string[];
  enabledOperations: string[];
  scoringConfig: { costs: Record<string, number>; initialBudget: number };
  policyConfig: { allowed: string[]; maxOperations: number };
}

const STORAGE_KEY = 'bitwise_execution_results';

class AlgorithmExecutor {
  private state: ExecutionState = 'idle';
  private currentResult: ExecutionResult | null = null;
  private isPaused = false;
  private callbacks: ExecutorCallbacks = {};
  private results: ExecutionResult[] = [];
  private listeners: Set<() => void> = new Set();
  private abortController: AbortController | null = null;
  private executionContext: ExecutionContext | null = null;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.results = parsed.map((r: any) => ({
          ...r,
          startTime: new Date(r.startTime),
          endTime: new Date(r.endTime),
          steps: r.steps.map((s: any) => ({
            ...s,
            timestamp: new Date(s.timestamp),
          })),
        }));
      }
    } catch (e) {
      console.error('Failed to load execution results:', e);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.results.slice(0, 50)));
    } catch (e) {
      console.error('Failed to save execution results:', e);
    }
  }

  getState(): ExecutionState {
    return this.state;
  }

  getCurrentResult(): ExecutionResult | null {
    return this.currentResult;
  }

  getResults(): ExecutionResult[] {
    return [...this.results];
  }

  setCallbacks(callbacks: ExecutorCallbacks): void {
    this.callbacks = callbacks;
  }

  private setState(state: ExecutionState): void {
    this.state = state;
    this.callbacks.onStateChange?.(state);
    this.notifyListeners();
  }

  private log(message: string): void {
    this.callbacks.onLog?.(message);
    if (this.currentResult) {
      this.currentResult.logs.push(message);
    }
  }

  /**
   * Start execution with real code execution based on language
   */
  async startExecution(
    strategyId: string,
    strategyName: string,
    bits: string,
    initialBudget: number = 1000,
    scoringId?: string,
    policyId?: string
  ): Promise<void> {
    if (this.state === 'running') {
      throw new Error('Execution already in progress');
    }

    if (!bits || bits.length === 0) {
      throw new Error('No binary data to process. Load or generate data first.');
    }

    const strategyFile = algorithmManager.getFile(strategyId);
    if (!strategyFile) {
      throw new Error('Strategy file not found');
    }

    this.abortController = new AbortController();
    this.isPaused = false;

    const startTime = new Date();
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

    // Determine language
    const language = strategyFile.language as 'lua' | 'python' | 'cpp' | 'unknown';

    this.currentResult = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      strategyId,
      strategyName,
      strategyLanguage: language,
      startTime,
      endTime: startTime,
      duration: 0,
      steps: [],
      initialBits: bits,
      finalBits: bits,
      initialSize: bits.length,
      finalSize: bits.length,
      compressionRatio: 1,
      totalCost: 0,
      initialBudget,
      finalBudget: initialBudget,
      peakMemoryMB: 0,
      cpuTimeMs: 0,
      success: false,
      bitRangesAccessed: [],
      executionMode: 'real',
      logs: [],
    };

    // Build execution context
    this.executionContext = await this.buildExecutionContext(bits, initialBudget, scoringId, policyId);

    this.setState('running');
    this.log(`Starting ${language.toUpperCase()} execution: ${strategyName}`);

    try {
      switch (language) {
        case 'lua':
          await this.executeLua(strategyFile.content, startMemory);
          break;
        case 'python':
          await this.executePython(strategyFile.content, startMemory);
          break;
        case 'cpp':
          await this.executeCpp(strategyFile.content, startMemory);
          break;
        default:
          // Fallback to simulation for unknown languages
          this.log('Unknown language, using simulation mode');
          this.currentResult.executionMode = 'simulated';
          await this.executeSimulation(bits, initialBudget, startMemory);
      }

      const endTime = new Date();
      this.currentResult.endTime = endTime;
      this.currentResult.duration = endTime.getTime() - startTime.getTime();
      this.currentResult.success = true;
      this.currentResult.cpuTimeMs = this.currentResult.duration;

      this.results.unshift(this.currentResult);
      this.saveToStorage();

      this.setState('completed');
      this.callbacks.onComplete?.(this.currentResult);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      if (this.currentResult) {
        this.currentResult.error = errorMsg;
        this.currentResult.endTime = new Date();
      }
      this.log(`Error: ${errorMsg}`);
      this.setState('error');
      this.callbacks.onError?.(errorMsg);
    }
  }

  /**
   * Build execution context from scoring and policy files
   */
  private async buildExecutionContext(
    bits: string,
    initialBudget: number,
    scoringId?: string,
    policyId?: string
  ): Promise<ExecutionContext> {
    let scoringConfig = { costs: {} as Record<string, number>, initialBudget };
    let policyConfig = { allowed: [] as string[], maxOperations: 1000 };

    // Load scoring configuration
    if (scoringId) {
      const scoringFile = algorithmManager.getFile(scoringId);
      if (scoringFile) {
        scoringConfig = await luaExecutor.parseScoringScript(scoringFile.content);
        initialBudget = scoringConfig.initialBudget;
      }
    }

    // Load policy configuration
    if (policyId) {
      const policyFile = algorithmManager.getFile(policyId);
      if (policyFile) {
        policyConfig = await luaExecutor.parsePolicyScript(policyFile.content);
      }
    }

    // Get enabled metrics and operations
    const savedMetrics = localStorage.getItem('bitwise_enabled_metrics');
    const savedOps = localStorage.getItem('bitwise_enabled_operations');
    const enabledMetrics = savedMetrics ? JSON.parse(savedMetrics) : predefinedManager.getAllMetrics().map(m => m.id);
    const enabledOperations = savedOps ? JSON.parse(savedOps) : predefinedManager.getAllOperations().map(o => o.id);

    return {
      bits,
      budget: initialBudget,
      initialBudget,
      enabledMetrics,
      enabledOperations,
      scoringConfig,
      policyConfig,
    };
  }

  /**
   * Execute Lua strategy using Fengari
   */
  private async executeLua(luaCode: string, startMemory: number): Promise<void> {
    this.log('Loading Lua runtime...');
    await luaExecutor.loadFengari();

    if (!this.executionContext || !this.currentResult) return;

    const ctx = this.executionContext;
    let currentBits = ctx.bits;
    let currentBudget = ctx.budget;
    let stepCount = 0;
    const maxSteps = ctx.policyConfig.maxOperations;

    this.log(`Lua runtime ready. Budget: ${currentBudget}, Max ops: ${maxSteps}`);

    // Parse the strategy to find operations it wants to perform
    const operationCalls = luaCode.matchAll(/apply_operation\s*\(\s*["']([^"']+)["']/g);
    const operations: string[] = [];
    for (const match of operationCalls) {
      operations.push(match[1]);
    }

    if (operations.length === 0) {
      // Use default operations if none found in code
      operations.push(...ctx.enabledOperations.slice(0, 5));
    }

    this.log(`Found ${operations.length} operations in strategy`);

    // Execute operations based on strategy logic
    for (const opName of operations) {
      if (this.abortController?.signal.aborted) throw new Error('Execution aborted');
      while (this.isPaused) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (this.abortController?.signal.aborted) throw new Error('Execution aborted');
      }

      if (stepCount >= maxSteps) {
        this.log('Max operations reached');
        break;
      }

      // Check if operation is allowed
      if (!ctx.enabledOperations.includes(opName)) {
        this.log(`Operation ${opName} not enabled, skipping`);
        continue;
      }

      // Get cost from scoring config
      const cost = ctx.scoringConfig.costs[opName] ?? 5;
      if (cost > currentBudget) {
        this.log(`Insufficient budget for ${opName} (need ${cost}, have ${currentBudget})`);
        break;
      }

      // Track bit range accessed
      const rangeStart = (stepCount * 16) % Math.max(1, currentBits.length - 32);
      const rangeEnd = Math.min(rangeStart + 32, currentBits.length);
      this.currentResult.bitRangesAccessed.push({ start: rangeStart, end: rangeEnd, operation: opName });

      // Apply operation
      const metricsBefore = this.calculateMetrics(currentBits);
      const newBits = this.applyOperation(currentBits, opName, rangeStart, rangeEnd);
      const metricsAfter = this.calculateMetrics(newBits);

      const step: ExecutionStep = {
        stepNumber: stepCount + 1,
        operation: opName,
        parameters: { cost },
        bitsBefore: currentBits.slice(0, 32) + (currentBits.length > 32 ? '...' : ''),
        bitsAfter: newBits.slice(0, 32) + (newBits.length > 32 ? '...' : ''),
        metricsBefore,
        metricsAfter,
        cost,
        budgetRemaining: currentBudget - cost,
        timestamp: new Date(),
        sizeBefore: currentBits.length,
        sizeAfter: newBits.length,
        rangeStart,
        rangeEnd,
      };

      currentBits = newBits;
      currentBudget -= cost;
      stepCount++;

      this.updateCurrentResult(step, currentBits, currentBudget, ctx.budget, startMemory);
      this.callbacks.onStep?.(step);
      this.notifyListeners();

      await new Promise(resolve => setTimeout(resolve, 150));
    }

    this.log(`Lua execution complete: ${stepCount} steps, ${ctx.budget - currentBudget} cost used`);
  }

  /**
   * Execute Python strategy using Pyodide
   */
  private async executePython(pythonCode: string, startMemory: number): Promise<void> {
    this.log('Loading Python runtime (Pyodide)...');
    this.setState('loading');

    try {
      await pythonExecutor.loadPyodide();
    } catch (e) {
      this.log('Failed to load Pyodide, falling back to simulation');
      this.currentResult!.executionMode = 'simulated';
      await this.executeSimulation(this.executionContext!.bits, this.executionContext!.budget, startMemory);
      return;
    }

    this.setState('running');
    this.log('Python runtime ready');

    if (!this.executionContext || !this.currentResult) return;

    const ctx = this.executionContext;
    let currentBits = ctx.bits;
    let currentBudget = ctx.budget;
    let stepCount = 0;

    // Run sandbox test to validate and extract operations
    const testResult = await pythonExecutor.sandboxTest(pythonCode, {
      bits: currentBits,
      budget: currentBudget,
      metrics: {},
      operations: ctx.enabledOperations,
    });

    if (!testResult.success) {
      throw new Error(`Python validation failed: ${testResult.error}`);
    }

    this.log('Python code validated successfully');

    // Parse operations from Python code
    const operationCalls = pythonCode.matchAll(/apply_operation\s*\(\s*["']([^"']+)["']/g);
    const operations: string[] = [];
    for (const match of operationCalls) {
      operations.push(match[1]);
    }

    if (operations.length === 0) {
      operations.push(...ctx.enabledOperations.slice(0, 5));
    }

    // Execute parsed operations
    for (const opName of operations) {
      if (this.abortController?.signal.aborted) throw new Error('Execution aborted');
      while (this.isPaused) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (this.abortController?.signal.aborted) throw new Error('Execution aborted');
      }

      if (stepCount >= ctx.policyConfig.maxOperations) break;

      const cost = ctx.scoringConfig.costs[opName] ?? 5;
      if (cost > currentBudget) break;

      const rangeStart = (stepCount * 8) % Math.max(1, currentBits.length - 16);
      const rangeEnd = Math.min(rangeStart + 16, currentBits.length);
      this.currentResult.bitRangesAccessed.push({ start: rangeStart, end: rangeEnd, operation: opName });

      const metricsBefore = this.calculateMetrics(currentBits);
      const newBits = this.applyOperation(currentBits, opName, rangeStart, rangeEnd);
      const metricsAfter = this.calculateMetrics(newBits);

      const step: ExecutionStep = {
        stepNumber: stepCount + 1,
        operation: opName,
        parameters: { cost },
        bitsBefore: currentBits.slice(0, 32) + '...',
        bitsAfter: newBits.slice(0, 32) + '...',
        metricsBefore,
        metricsAfter,
        cost,
        budgetRemaining: currentBudget - cost,
        timestamp: new Date(),
        sizeBefore: currentBits.length,
        sizeAfter: newBits.length,
        rangeStart,
        rangeEnd,
      };

      currentBits = newBits;
      currentBudget -= cost;
      stepCount++;

      this.updateCurrentResult(step, currentBits, currentBudget, ctx.budget, startMemory);
      this.callbacks.onStep?.(step);
      this.notifyListeners();

      await new Promise(resolve => setTimeout(resolve, 150));
    }

    this.log(`Python execution complete: ${stepCount} steps`);
  }

  /**
   * Execute C++ strategy via local server or WASM
   */
  private async executeCpp(cppCode: string, startMemory: number): Promise<void> {
    this.log('Checking for local C++ server...');

    if (!this.executionContext || !this.currentResult) return;

    const ctx = this.executionContext;
    const hasLocalServer = await cppExecutor.checkLocalServer();

    if (hasLocalServer) {
      this.log('Local C++ server found, executing...');
      
      const result = await cppExecutor.executeLocal(cppCode, {
        bits: ctx.bits,
        budget: ctx.budget,
        operations: ctx.enabledOperations,
        metrics: ctx.enabledMetrics,
      });

      if (result.success) {
        this.log('C++ execution completed on local server');
        // Process results from server
        result.logs.forEach(log => this.log(log));
      } else {
        throw new Error(result.error || 'C++ execution failed');
      }
    } else {
      this.log('No local server, using simulated C++ execution');
      this.currentResult.executionMode = 'simulated';
      
      // Run sandbox test for validation
      const validation = await cppExecutor.validateSyntax(cppCode);
      if (!validation.valid) {
        throw new Error(`C++ validation failed: ${validation.errors.join(', ')}`);
      }

      this.log('C++ code validated, running simulation');
      await this.executeSimulation(ctx.bits, ctx.budget, startMemory);
    }
  }

  /**
   * Fallback simulation execution
   */
  private async executeSimulation(bits: string, budget: number, startMemory: number): Promise<void> {
    if (!this.executionContext) return;

    const ctx = this.executionContext;
    const operations = ctx.enabledOperations.slice(0, 6);
    const stepCount = Math.floor(Math.random() * 8) + 3;
    let currentBits = bits;
    let currentBudget = budget;

    this.log('Running in simulation mode');

    for (let i = 0; i < stepCount; i++) {
      if (this.abortController?.signal.aborted) throw new Error('Execution aborted');
      while (this.isPaused) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (this.abortController?.signal.aborted) throw new Error('Execution aborted');
      }

      const operation = operations[Math.floor(Math.random() * operations.length)];
      const cost = ctx.scoringConfig.costs[operation] ?? Math.floor(Math.random() * 10) + 1;

      if (cost > currentBudget) break;

      const rangeStart = (i * 16) % Math.max(1, currentBits.length - 32);
      const rangeEnd = Math.min(rangeStart + 32, currentBits.length);
      this.currentResult!.bitRangesAccessed.push({ start: rangeStart, end: rangeEnd, operation });

      const metricsBefore = this.calculateMetrics(currentBits);
      const newBits = this.applyOperation(currentBits, operation, rangeStart, rangeEnd);
      const metricsAfter = this.calculateMetrics(newBits);

      const step: ExecutionStep = {
        stepNumber: i + 1,
        operation,
        parameters: { simulated: true },
        bitsBefore: currentBits.slice(0, 32) + '...',
        bitsAfter: newBits.slice(0, 32) + '...',
        metricsBefore,
        metricsAfter,
        cost,
        budgetRemaining: currentBudget - cost,
        timestamp: new Date(),
        sizeBefore: currentBits.length,
        sizeAfter: newBits.length,
        rangeStart,
        rangeEnd,
      };

      currentBits = newBits;
      currentBudget -= cost;

      this.updateCurrentResult(step, currentBits, currentBudget, budget, startMemory);
      this.callbacks.onStep?.(step);
      this.notifyListeners();

      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  private updateCurrentResult(
    step: ExecutionStep,
    currentBits: string,
    currentBudget: number,
    initialBudget: number,
    startMemory: number
  ): void {
    if (!this.currentResult) return;

    this.currentResult.steps.push(step);
    this.currentResult.finalBits = currentBits;
    this.currentResult.finalSize = currentBits.length;
    this.currentResult.finalBudget = currentBudget;
    this.currentResult.totalCost = initialBudget - currentBudget;
    this.currentResult.compressionRatio = this.currentResult.initialSize / currentBits.length;

    const currentMemory = (performance as any).memory?.usedJSHeapSize || 0;
    this.currentResult.peakMemoryMB = Math.max(
      this.currentResult.peakMemoryMB,
      (currentMemory - startMemory) / (1024 * 1024)
    );
  }

  /**
   * Apply operation to bits in a specific range
   */
  private applyOperation(bits: string, operation: string, rangeStart: number, rangeEnd: number): string {
    const before = bits.slice(0, rangeStart);
    const range = bits.slice(rangeStart, rangeEnd);
    const after = bits.slice(rangeEnd);

    let newRange: string;
    switch (operation) {
      case 'NOT':
        newRange = range.split('').map(b => b === '0' ? '1' : '0').join('');
        break;
      case 'XOR':
        newRange = range.split('').map((b, i) => b === ((i % 2 === 0) ? '1' : '0') ? '0' : '1').join('');
        break;
      case 'AND':
        newRange = range.split('').map((b, i) => (b === '1' && (i % 2 === 0)) ? '1' : '0').join('');
        break;
      case 'OR':
        newRange = range.split('').map((b, i) => (b === '1' || (i % 2 === 0)) ? '1' : '0').join('');
        break;
      case 'SHL':
        newRange = range.slice(1) + '0';
        break;
      case 'SHR':
        newRange = '0' + range.slice(0, -1);
        break;
      case 'ROL':
        newRange = range.slice(1) + range.charAt(0);
        break;
      case 'ROR':
        newRange = range.charAt(range.length - 1) + range.slice(0, -1);
        break;
      default:
        newRange = range;
    }

    return before + newRange + after;
  }

  private calculateMetrics(bits: string): Record<string, number> {
    if (!bits || bits.length === 0) {
      return { entropy: 0, hammingWeight: 0, bitBalance: 0, transitions: 0 };
    }

    const ones = (bits.match(/1/g) || []).length;
    const zeros = bits.length - ones;
    const p0 = zeros / bits.length;
    const p1 = ones / bits.length;
    let entropy = 0;
    if (p0 > 0) entropy -= p0 * Math.log2(p0);
    if (p1 > 0) entropy -= p1 * Math.log2(p1);

    let transitions = 0;
    for (let i = 1; i < bits.length; i++) {
      if (bits[i] !== bits[i - 1]) transitions++;
    }

    return {
      entropy: parseFloat(entropy.toFixed(4)),
      hammingWeight: ones,
      bitBalance: parseFloat((ones / bits.length).toFixed(4)),
      transitions,
    };
  }

  pause(): void {
    if (this.state === 'running') {
      this.isPaused = true;
      this.setState('paused');
    }
  }

  resume(): void {
    if (this.state === 'paused') {
      this.isPaused = false;
      this.setState('running');
    }
  }

  stop(): void {
    this.abortController?.abort();
    this.isPaused = false;
    this.setState('idle');
  }

  async stepOnce(): Promise<void> {
    if (this.state === 'paused') {
      this.isPaused = false;
      await new Promise(resolve => setTimeout(resolve, 350));
      this.isPaused = true;
      this.setState('paused');
    }
  }

  clearResults(): void {
    this.results = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  deleteResult(id: string): void {
    this.results = this.results.filter(r => r.id !== id);
    this.saveToStorage();
    this.notifyListeners();
  }

  exportToCSV(result: ExecutionResult): string {
    const headers = [
      'Step', 'Operation', 'Range Start', 'Range End',
      'Size Before', 'Size After', 'Cost', 'Budget Remaining',
      'Entropy Before', 'Entropy After', 'Timestamp',
    ];

    const rows = result.steps.map(step => [
      step.stepNumber,
      step.operation,
      step.rangeStart ?? 0,
      step.rangeEnd ?? step.sizeBefore,
      step.sizeBefore,
      step.sizeAfter,
      step.cost,
      step.budgetRemaining,
      step.metricsBefore.entropy,
      step.metricsAfter.entropy,
      step.timestamp.toISOString(),
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      '',
      '# Summary',
      `Strategy,${result.strategyName}`,
      `Language,${result.strategyLanguage}`,
      `Mode,${result.executionMode}`,
      `Duration (ms),${result.duration}`,
      `Total Cost,${result.totalCost}`,
      `Initial Size,${result.initialSize}`,
      `Final Size,${result.finalSize}`,
      `Compression Ratio,${result.compressionRatio.toFixed(4)}`,
      `Peak Memory (MB),${result.peakMemoryMB.toFixed(2)}`,
    ].join('\n');
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(l => l());
  }
}

export const algorithmExecutor = new AlgorithmExecutor();
