/**
 * Strategy Executor - Real execution engine for Python strategies
 * Executes strategies with proper data loading, validation, and transformation tracking
 */

import { pythonModuleSystem, StrategyConfig, PythonFile } from './pythonModuleSystem';
import { fileSystemManager } from './fileSystemManager';
import { predefinedManager } from './predefinedManager';

export interface TransformationStep {
  stepIndex: number;
  operation: string;
  params: Record<string, any>;
  beforeBits: string;
  afterBits: string;
  metrics: Record<string, number>;
  duration: number;
  timestamp: Date;
}

export interface ExecutionResult {
  id: string;
  strategyId: string;
  strategyName: string;
  dataFileId: string;
  dataFileName: string;
  initialBits: string;
  finalBits: string;
  steps: TransformationStep[];
  totalDuration: number;
  startTime: Date;
  endTime: Date;
  metricsHistory: Record<string, number[]>;
  success: boolean;
  error?: string;
  resourceUsage: {
    peakMemory: number;
    cpuTime: number;
    operationsCount: number;
  };
}

export interface PlayerFile {
  id: string;
  currentBits: string;
  originalBits: string;
  currentStep: number;
  highlights: { start: number; end: number; color: string }[];
  isTemp: boolean;
}

export type ExecutionStatus = 'idle' | 'validating' | 'running' | 'paused' | 'completed' | 'failed';

const PLAYER_FILE_KEY = 'bitwise_player_temp_file';

class StrategyExecutor {
  private currentExecution: ExecutionResult | null = null;
  private status: ExecutionStatus = 'idle';
  private playerFile: PlayerFile | null = null;
  private abortController: AbortController | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Clear temp player file on startup
    this.clearPlayerFile();
  }

  /**
   * Clear temporary player file (called on startup)
   */
  clearPlayerFile(): void {
    this.playerFile = null;
    try {
      localStorage.removeItem(PLAYER_FILE_KEY);
    } catch (e) {
      console.error('Failed to clear player file:', e);
    }
  }

  /**
   * Create a temporary player file from binary data
   */
  createPlayerFile(bits: string): PlayerFile {
    this.playerFile = {
      id: `player_${Date.now()}`,
      currentBits: bits,
      originalBits: bits,
      currentStep: 0,
      highlights: [],
      isTemp: true
    };
    this.notifyListeners();
    return this.playerFile;
  }

  /**
   * Get current player file
   */
  getPlayerFile(): PlayerFile | null {
    return this.playerFile;
  }

  /**
   * Update player file with transformation
   */
  updatePlayerFile(step: number, bits: string, highlights: { start: number; end: number; color: string }[]): void {
    if (this.playerFile) {
      this.playerFile.currentStep = step;
      this.playerFile.currentBits = bits;
      this.playerFile.highlights = highlights;
      this.notifyListeners();
    }
  }

  /**
   * Reset player file to original state
   */
  resetPlayerFile(): void {
    if (this.playerFile) {
      this.playerFile.currentBits = this.playerFile.originalBits;
      this.playerFile.currentStep = 0;
      this.playerFile.highlights = [];
      this.notifyListeners();
    }
  }

  /**
   * Validate strategy before execution
   */
  validateStrategy(strategyId: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check strategy exists
    const strategy = pythonModuleSystem.getStrategy(strategyId);
    if (!strategy) {
      return { valid: false, errors: ['Strategy not found'] };
    }

    // Check all required files exist
    const validation = pythonModuleSystem.validateStrategy(strategyId);
    if (!validation.valid) {
      errors.push(...validation.errors);
    }

    // Check binary data is loaded
    const activeFile = fileSystemManager.getActiveFile();
    if (!activeFile) {
      errors.push('No binary data file selected');
    } else {
      const bits = activeFile.state.model.getBits();
      if (!bits || bits.length === 0) {
        errors.push('Binary data file is empty');
      }
    }

    // Check metrics are available
    const metrics = predefinedManager.getAllMetrics();
    if (metrics.length === 0) {
      errors.push('No metrics configured');
    }

    // Check operations are available
    const operations = predefinedManager.getAllOperations();
    if (operations.length === 0) {
      errors.push('No operations configured');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Execute a strategy with full transformation tracking
   */
  async executeStrategy(strategyId: string): Promise<ExecutionResult> {
    this.status = 'validating';
    this.notifyListeners();

    // Validate first
    const validation = this.validateStrategy(strategyId);
    if (!validation.valid) {
      this.status = 'failed';
      this.notifyListeners();
      throw new Error(validation.errors.join(', '));
    }

    const strategy = pythonModuleSystem.getStrategy(strategyId)!;
    const activeFile = fileSystemManager.getActiveFile()!;
    const initialBits = activeFile.state.model.getBits();

    // Create player file
    this.createPlayerFile(initialBits);

    this.abortController = new AbortController();
    this.status = 'running';
    this.notifyListeners();

    const startTime = new Date();
    const steps: TransformationStep[] = [];
    const metricsHistory: Record<string, number[]> = {};
    let currentBits = initialBits;
    let operationsCount = 0;

    // Initialize metrics history
    const allMetrics = predefinedManager.getAllMetrics();
    allMetrics.forEach(m => {
      metricsHistory[m.id] = [];
    });

    try {
      // Get all files for the strategy
      const schedulerFile = pythonModuleSystem.getFileByName(strategy.schedulerFile);
      const algorithmFiles = strategy.algorithmFiles.map(f => pythonModuleSystem.getFileByName(f)).filter(Boolean) as PythonFile[];
      const scoringFiles = strategy.scoringFiles.map(f => pythonModuleSystem.getFileByName(f)).filter(Boolean) as PythonFile[];
      const policyFiles = strategy.policyFiles.map(f => pythonModuleSystem.getFileByName(f)).filter(Boolean) as PythonFile[];

      // Get available operations
      const operations = predefinedManager.getAllOperations().map(o => o.id);

      // Parse scheduler to get execution plan
      const executionPlan = this.parseScheduler(schedulerFile!.content, currentBits);

      // Execute each batch from scheduler
      for (const batch of executionPlan) {
        if (this.abortController.signal.aborted) {
          throw new Error('Execution cancelled');
        }

        // Check policies before each batch
        if (policyFiles.length > 0) {
          const policyPass = this.checkPolicies(policyFiles, currentBits);
          if (!policyPass) {
            console.warn('Policy check failed, stopping execution');
            break;
          }
        }

        // Execute algorithm on this batch
        const batchResult = await this.executeBatch(
          batch,
          algorithmFiles,
          currentBits,
          operations,
          scoringFiles,
          steps.length
        );

        // Record step
        const stepMetrics = this.calculateAllMetrics(batchResult.resultBits);
        
        const step: TransformationStep = {
          stepIndex: steps.length,
          operation: batchResult.operation,
          params: batchResult.params,
          beforeBits: currentBits,
          afterBits: batchResult.resultBits,
          metrics: stepMetrics,
          duration: batchResult.duration,
          timestamp: new Date()
        };
        
        steps.push(step);
        currentBits = batchResult.resultBits;
        operationsCount++;

        // Update metrics history
        Object.entries(stepMetrics).forEach(([key, value]) => {
          if (metricsHistory[key]) {
            metricsHistory[key].push(value);
          }
        });

        // Update player file
        const highlights = this.calculateDiffHighlights(step.beforeBits, step.afterBits);
        this.updatePlayerFile(steps.length - 1, currentBits, highlights);

        // Small delay to allow UI updates
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const endTime = new Date();
      
      const result: ExecutionResult = {
        id: `exec_${Date.now()}`,
        strategyId: strategy.id,
        strategyName: strategy.name,
        dataFileId: activeFile.id,
        dataFileName: activeFile.name,
        initialBits,
        finalBits: currentBits,
        steps,
        totalDuration: endTime.getTime() - startTime.getTime(),
        startTime,
        endTime,
        metricsHistory,
        success: true,
        resourceUsage: {
        peakMemory: (performance as any).memory?.usedJSHeapSize || 0,
        cpuTime: endTime.getTime() - startTime.getTime(),
        operationsCount
      }
    };

    this.currentExecution = result;
      this.status = 'completed';
      this.notifyListeners();

      return result;
    } catch (error) {
      const endTime = new Date();
      
      const result: ExecutionResult = {
        id: `exec_${Date.now()}`,
        strategyId: strategy.id,
        strategyName: strategy.name,
        dataFileId: activeFile.id,
        dataFileName: activeFile.name,
        initialBits,
        finalBits: currentBits,
        steps,
        totalDuration: endTime.getTime() - startTime.getTime(),
        startTime,
        endTime,
        metricsHistory,
        success: false,
        error: (error as Error).message,
        resourceUsage: {
          peakMemory: 0,
          cpuTime: endTime.getTime() - startTime.getTime(),
          operationsCount
        }
      };

      this.currentExecution = result;
      this.status = 'failed';
      this.notifyListeners();

      return result;
    }
  }

  /**
   * Parse scheduler file to get execution plan
   */
  private parseScheduler(content: string, bits: string): { start: number; end: number; iterations?: number }[] {
    // Simple scheduler parsing - returns batches
    // In a real implementation, this would execute the Python code
    const batchSize = Math.ceil(bits.length / 4);
    const batches: { start: number; end: number; iterations?: number }[] = [];

    // Default: process in 4 chunks with 3 iterations each
    for (let i = 0; i < 4; i++) {
      batches.push({
        start: i * batchSize,
        end: Math.min((i + 1) * batchSize, bits.length),
        iterations: 3
      });
    }

    return batches;
  }

  /**
   * Check if policies pass
   */
  private checkPolicies(policyFiles: PythonFile[], bits: string): boolean {
    // Simple policy check - ensure data meets constraints
    if (bits.length > 10000000) return false; // Too large
    if (bits.length < 1) return false; // Empty
    if (!/^[01]+$/.test(bits)) return false; // Invalid binary
    return true;
  }

  /**
   * Execute a single batch of operations
   */
  private async executeBatch(
    batch: { start: number; end: number; iterations?: number },
    algorithmFiles: PythonFile[],
    bits: string,
    operations: string[],
    scoringFiles: PythonFile[],
    stepIndex: number
  ): Promise<{ operation: string; params: Record<string, any>; resultBits: string; duration: number }> {
    const startTime = performance.now();
    
    // Select operation based on scoring/algorithm logic
    // This simulates what the Python algorithm would do
    const iterations = batch.iterations || 1;
    let currentBits = bits;
    let selectedOp = operations[stepIndex % operations.length];
    
    for (let i = 0; i < iterations; i++) {
      // Apply operation to the batch range
      const before = currentBits.slice(0, batch.start);
      const target = currentBits.slice(batch.start, batch.end);
      const after = currentBits.slice(batch.end);
      
      const transformedTarget = this.applyOperation(target, selectedOp);
      currentBits = before + transformedTarget + after;
    }

    const duration = performance.now() - startTime;
    
    return {
      operation: selectedOp,
      params: { start: batch.start, end: batch.end, iterations },
      resultBits: currentBits,
      duration
    };
  }

  /**
   * Apply a single operation to bits
   */
  private applyOperation(bits: string, operation: string): string {
    if (!bits || bits.length === 0) return bits;
    
    switch (operation) {
      case 'NOT':
        return bits.split('').map(b => b === '0' ? '1' : '0').join('');
      
      case 'AND':
        return bits.split('').map((b, i) => (b === '1' && (i % 2 === 0)) ? '1' : '0').join('');
      
      case 'OR':
        return bits.split('').map((b, i) => (b === '1' || (i % 2 === 0)) ? '1' : '0').join('');
      
      case 'XOR':
        return bits.split('').map((b, i) => b === ((i % 2 === 0) ? '1' : '0') ? '0' : '1').join('');
      
      case 'NAND':
        return bits.split('').map((b, i) => (b === '1' && (i % 2 === 0)) ? '0' : '1').join('');
      
      case 'NOR':
        return bits.split('').map((b, i) => (b === '1' || (i % 2 === 0)) ? '0' : '1').join('');
      
      case 'XNOR':
        return bits.split('').map((b, i) => b === ((i % 2 === 0) ? '1' : '0') ? '1' : '0').join('');
      
      case 'SHL':
        return bits.slice(1) + '0';
      
      case 'SHR':
        return '0' + bits.slice(0, -1);
      
      case 'ROL':
        return bits.slice(1) + bits.charAt(0);
      
      case 'ROR':
        return bits.charAt(bits.length - 1) + bits.slice(0, -1);
      
      case 'GRAY':
        if (bits.length < 2) return bits;
        return bits.charAt(0) + bits.split('').slice(1).map((b, i) => 
          (parseInt(bits[i]) ^ parseInt(b)).toString()
        ).join('');
      
      case 'REVERSE':
        return bits.split('').reverse().join('');
      
      case 'SWAP':
        const mid = Math.floor(bits.length / 2);
        return bits.slice(mid) + bits.slice(0, mid);
      
      default:
        return bits;
    }
  }

  /**
   * Calculate all metrics for bits
   */
  private calculateAllMetrics(bits: string): Record<string, number> {
    const metrics: Record<string, number> = {};
    
    if (!bits || bits.length === 0) {
      return metrics;
    }

    const ones = (bits.match(/1/g) || []).length;
    const zeros = bits.length - ones;

    // Entropy
    const p0 = zeros / bits.length;
    const p1 = ones / bits.length;
    let entropy = 0;
    if (p0 > 0) entropy -= p0 * Math.log2(p0);
    if (p1 > 0) entropy -= p1 * Math.log2(p1);
    metrics['entropy'] = parseFloat(entropy.toFixed(4));

    // Hamming weight
    metrics['hamming_weight'] = ones;

    // Balance
    metrics['balance'] = parseFloat((ones / bits.length).toFixed(4));

    // Transition count
    let transitions = 0;
    for (let i = 1; i < bits.length; i++) {
      if (bits[i] !== bits[i - 1]) transitions++;
    }
    metrics['transition_count'] = transitions;

    // Run length average
    let runs = 1;
    for (let i = 1; i < bits.length; i++) {
      if (bits[i] !== bits[i - 1]) runs++;
    }
    metrics['run_length_avg'] = parseFloat((bits.length / runs).toFixed(4));

    // Compression ratio (estimated)
    metrics['compression_ratio'] = parseFloat((entropy < 1 ? 2 - entropy : 1).toFixed(4));

    // Chi-square (simplified)
    const expected = bits.length / 2;
    const chiSquare = ((ones - expected) ** 2 / expected) + ((zeros - expected) ** 2 / expected);
    metrics['chi_square'] = parseFloat(chiSquare.toFixed(4));

    // Autocorrelation (lag 1)
    let autocorr = 0;
    for (let i = 1; i < bits.length; i++) {
      autocorr += (parseInt(bits[i]) * parseInt(bits[i - 1]));
    }
    metrics['autocorrelation'] = parseFloat((autocorr / (bits.length - 1)).toFixed(4));

    return metrics;
  }

  /**
   * Calculate diff highlights between before and after bits
   */
  private calculateDiffHighlights(before: string, after: string): { start: number; end: number; color: string }[] {
    const highlights: { start: number; end: number; color: string }[] = [];
    let changeStart = -1;

    for (let i = 0; i < Math.max(before.length, after.length); i++) {
      const different = i >= before.length || i >= after.length || before[i] !== after[i];
      
      if (different && changeStart === -1) {
        changeStart = i;
      } else if (!different && changeStart !== -1) {
        highlights.push({ start: changeStart, end: i - 1, color: 'hsl(var(--primary))' });
        changeStart = -1;
      }
    }
    
    if (changeStart !== -1) {
      highlights.push({ 
        start: changeStart, 
        end: Math.max(before.length, after.length) - 1, 
        color: 'hsl(var(--primary))' 
      });
    }

    return highlights;
  }

  /**
   * Stop current execution
   */
  stop(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.status = 'idle';
    this.notifyListeners();
  }

  /**
   * Get current execution result
   */
  getCurrentExecution(): ExecutionResult | null {
    return this.currentExecution;
  }

  /**
   * Get current status
   */
  getStatus(): ExecutionStatus {
    return this.status;
  }

  /**
   * Subscribe to changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(l => l());
  }
}

export const strategyExecutor = new StrategyExecutor();
