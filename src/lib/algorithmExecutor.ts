/**
 * Algorithm Executor - Manages algorithm execution with real-time feedback
 */

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
}

export interface ExecutionResult {
  id: string;
  strategyId: string;
  strategyName: string;
  startTime: Date;
  endTime: Date;
  duration: number; // ms
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
}

export type ExecutionState = 'idle' | 'running' | 'paused' | 'completed' | 'error';

export interface ExecutorCallbacks {
  onStep?: (step: ExecutionStep) => void;
  onComplete?: (result: ExecutionResult) => void;
  onError?: (error: string) => void;
  onStateChange?: (state: ExecutionState) => void;
}

const STORAGE_KEY = 'bitwise_execution_results';

class AlgorithmExecutor {
  private state: ExecutionState = 'idle';
  private currentResult: ExecutionResult | null = null;
  private currentStepIndex = 0;
  private isPaused = false;
  private callbacks: ExecutorCallbacks = {};
  private results: ExecutionResult[] = [];
  private listeners: Set<() => void> = new Set();
  private abortController: AbortController | null = null;

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

  async startExecution(
    strategyId: string,
    strategyName: string,
    bits: string,
    initialBudget: number = 1000
  ): Promise<void> {
    if (this.state === 'running') {
      throw new Error('Execution already in progress');
    }

    this.abortController = new AbortController();
    this.isPaused = false;
    this.currentStepIndex = 0;

    const startTime = new Date();
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

    this.currentResult = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      strategyId,
      strategyName,
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
    };

    this.setState('running');

    try {
      // Simulate algorithm execution with mock steps
      await this.executeSimulation(bits, initialBudget, startMemory);
      
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
      }
      this.setState('error');
      this.callbacks.onError?.(errorMsg);
    }
  }

  private async executeSimulation(bits: string, budget: number, startMemory: number): Promise<void> {
    const operations = ['XOR', 'AND', 'OR', 'SHL', 'ROR', 'NOT'];
    const stepCount = Math.floor(Math.random() * 8) + 3;
    let currentBits = bits;
    let currentBudget = budget;

    for (let i = 0; i < stepCount; i++) {
      // Check for abort/pause
      if (this.abortController?.signal.aborted) {
        throw new Error('Execution aborted');
      }

      while (this.isPaused) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (this.abortController?.signal.aborted) {
          throw new Error('Execution aborted');
        }
      }

      const operation = operations[Math.floor(Math.random() * operations.length)];
      const cost = Math.floor(Math.random() * 10) + 1;
      
      // Simulate operation
      const newBits = this.simulateOperation(currentBits, operation);
      
      const step: ExecutionStep = {
        stepNumber: i + 1,
        operation,
        parameters: { mask: '10101010', shift: 1 },
        bitsBefore: currentBits.slice(0, 32) + (currentBits.length > 32 ? '...' : ''),
        bitsAfter: newBits.slice(0, 32) + (newBits.length > 32 ? '...' : ''),
        metricsBefore: this.calculateMetrics(currentBits),
        metricsAfter: this.calculateMetrics(newBits),
        cost,
        budgetRemaining: currentBudget - cost,
        timestamp: new Date(),
        sizeBefore: currentBits.length,
        sizeAfter: newBits.length,
      };

      currentBits = newBits;
      currentBudget -= cost;

      if (this.currentResult) {
        this.currentResult.steps.push(step);
        this.currentResult.finalBits = currentBits;
        this.currentResult.finalSize = currentBits.length;
        this.currentResult.finalBudget = currentBudget;
        this.currentResult.totalCost = budget - currentBudget;
        this.currentResult.compressionRatio = bits.length / currentBits.length;
        
        const currentMemory = (performance as any).memory?.usedJSHeapSize || 0;
        this.currentResult.peakMemoryMB = Math.max(
          this.currentResult.peakMemoryMB,
          (currentMemory - startMemory) / (1024 * 1024)
        );
      }

      this.callbacks.onStep?.(step);
      this.notifyListeners();

      // Delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  private simulateOperation(bits: string, operation: string): string {
    // Simplified simulation
    switch (operation) {
      case 'NOT':
        return bits.split('').map(b => b === '0' ? '1' : '0').join('');
      case 'SHL':
        return bits.slice(1) + '0';
      case 'ROR':
        return bits.charAt(bits.length - 1) + bits.slice(0, -1);
      default:
        // Just return same bits for other operations in simulation
        return bits;
    }
  }

  private calculateMetrics(bits: string): Record<string, number> {
    const ones = bits.split('1').length - 1;
    const zeros = bits.length - ones;
    const p0 = bits.length > 0 ? zeros / bits.length : 0;
    const p1 = bits.length > 0 ? ones / bits.length : 0;
    let entropy = 0;
    if (p0 > 0) entropy -= p0 * Math.log2(p0);
    if (p1 > 0) entropy -= p1 * Math.log2(p1);

    return {
      entropy: parseFloat(entropy.toFixed(4)),
      hammingWeight: ones,
      bitBalance: parseFloat((ones / bits.length).toFixed(4)),
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
    // For step-by-step, we pause after each step
    if (this.state === 'paused') {
      this.isPaused = false;
      // Will pause again after next step in execution loop
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
      'Step',
      'Operation',
      'Size Before',
      'Size After',
      'Cost',
      'Budget Remaining',
      'Entropy Before',
      'Entropy After',
      'Hamming Weight Before',
      'Hamming Weight After',
      'Timestamp',
    ];

    const rows = result.steps.map(step => [
      step.stepNumber,
      step.operation,
      step.sizeBefore,
      step.sizeAfter,
      step.cost,
      step.budgetRemaining,
      step.metricsBefore.entropy,
      step.metricsAfter.entropy,
      step.metricsBefore.hammingWeight,
      step.metricsAfter.hammingWeight,
      step.timestamp.toISOString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      '',
      '# Summary',
      `Strategy,${result.strategyName}`,
      `Duration (ms),${result.duration}`,
      `Total Cost,${result.totalCost}`,
      `Initial Size,${result.initialSize}`,
      `Final Size,${result.finalSize}`,
      `Compression Ratio,${result.compressionRatio.toFixed(4)}`,
      `Peak Memory (MB),${result.peakMemoryMB.toFixed(2)}`,
      `CPU Time (ms),${result.cpuTimeMs}`,
    ].join('\n');

    return csvContent;
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
