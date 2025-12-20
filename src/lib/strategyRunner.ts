/**
 * Strategy Runner - Executes Python strategies on selected binary files
 * Creates temp player files for analysis mode integration
 * Exports results to CSV with full transformation tracking
 */

import { pythonExecutor, PythonContext, PythonExecutionResult, TransformationRecord } from './pythonExecutor';
import { fileSystemManager, BinaryFile } from './fileSystemManager';
import { pythonModuleSystem, PythonFile } from './pythonModuleSystem';
import { calculateAllMetrics } from './metricsCalculator';
import { getAvailableOperations } from './operationsRouter';

export interface StrategyRunConfig {
  strategyCode: string;
  sourceFileId: string;
  budget: number;
  maxIterations?: number;
  parallelRanges?: { start: number; end: number }[];
}

export interface StrategyRunResult {
  success: boolean;
  error?: string;
  
  // Source info
  sourceFileName: string;
  sourceFileId: string;
  
  // Execution data
  startTime: Date;
  endTime: Date;
  duration: number;
  
  // Bits
  initialBits: string;
  finalBits: string;
  
  // Transformations
  transformations: TransformationRecord[];
  totalOperations: number;
  totalBitsChanged: number;
  
  // Metrics
  initialMetrics: Record<string, number>;
  finalMetrics: Record<string, number>;
  metricsImprovement: Record<string, number>;
  
  // Budget
  budgetUsed: number;
  budgetRemaining: number;
  
  // Output
  logs: string[];
  pythonOutput: any;
  
  // Temp file
  tempFileId: string;
  tempFileName: string;
}

class StrategyRunner {
  private listeners: Set<(result: StrategyRunResult | null, status: string) => void> = new Set();
  private currentResult: StrategyRunResult | null = null;
  private isRunning = false;
  private runCounter = 0;

  /**
   * Run a strategy on a selected binary file
   */
  async runStrategy(config: StrategyRunConfig): Promise<StrategyRunResult> {
    if (this.isRunning) {
      throw new Error('A strategy is already running');
    }

    this.isRunning = true;
    this.runCounter++;
    const runId = this.runCounter;
    this.notify(null, 'starting');

    const startTime = new Date();
    
    try {
      // Get source file
      const sourceFile = fileSystemManager.getFile(config.sourceFileId);
      if (!sourceFile) {
        throw new Error('Source file not found');
      }

      const initialBits = sourceFile.state.model.getBits();
      if (!initialBits || initialBits.length === 0) {
        throw new Error('Source file is empty');
      }

      this.notify(null, 'calculating initial metrics');

      // Calculate initial metrics
      const initialMetricsResult = calculateAllMetrics(initialBits);
      const initialMetrics = initialMetricsResult.metrics;

      // Get available operations
      const operations = getAvailableOperations();

      // Create execution context
      const context: PythonContext = {
        bits: initialBits,
        budget: config.budget,
        metrics: initialMetrics,
        operations,
      };

      this.notify(null, 'executing strategy');

      // Execute Python strategy
      const execResult = await pythonExecutor.sandboxTest(config.strategyCode, context);

      const endTime = new Date();

      // Calculate final metrics
      const finalMetricsResult = calculateAllMetrics(execResult.finalBits);
      const finalMetrics = finalMetricsResult.metrics;

      // Calculate improvement
      const metricsImprovement: Record<string, number> = {};
      Object.keys(initialMetrics).forEach(key => {
        if (finalMetrics[key] !== undefined) {
          metricsImprovement[key] = finalMetrics[key] - initialMetrics[key];
        }
      });

      // Create temp file for analysis
      const tempFileName = `tempplayer_${sourceFile.name.replace(/\.[^/.]+$/, '')}_${runId}.txt`;
      const tempFile = fileSystemManager.createFile(tempFileName, execResult.finalBits, 'binary');
      tempFile.group = 'Strategy Results';

      // Build result
      const result: StrategyRunResult = {
        success: execResult.success,
        error: execResult.error,
        
        sourceFileName: sourceFile.name,
        sourceFileId: sourceFile.id,
        
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        
        initialBits,
        finalBits: execResult.finalBits,
        
        transformations: execResult.transformations,
        totalOperations: execResult.stats.totalOperations,
        totalBitsChanged: execResult.stats.totalBitsChanged,
        
        initialMetrics,
        finalMetrics,
        metricsImprovement,
        
        budgetUsed: execResult.stats.budgetUsed,
        budgetRemaining: execResult.stats.budgetRemaining,
        
        logs: execResult.logs,
        pythonOutput: execResult.output,
        
        tempFileId: tempFile.id,
        tempFileName,
      };

      this.currentResult = result;
      this.notify(result, 'completed');
      
      return result;
    } catch (error) {
      const endTime = new Date();
      const result: StrategyRunResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        
        sourceFileName: '',
        sourceFileId: config.sourceFileId,
        
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        
        initialBits: '',
        finalBits: '',
        
        transformations: [],
        totalOperations: 0,
        totalBitsChanged: 0,
        
        initialMetrics: {},
        finalMetrics: {},
        metricsImprovement: {},
        
        budgetUsed: 0,
        budgetRemaining: config.budget,
        
        logs: [],
        pythonOutput: null,
        
        tempFileId: '',
        tempFileName: '',
      };

      this.currentResult = result;
      this.notify(result, 'failed');
      
      return result;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Export results to CSV
   */
  exportToCSV(result: StrategyRunResult): string {
    const lines: string[] = [];
    
    // Header section
    lines.push('# Strategy Execution Report');
    lines.push(`# Generated: ${new Date().toISOString()}`);
    lines.push('');
    
    // Summary
    lines.push('## Summary');
    lines.push(`Source File,${result.sourceFileName}`);
    lines.push(`Status,${result.success ? 'Success' : 'Failed'}`);
    lines.push(`Duration,${result.duration}ms`);
    lines.push(`Total Operations,${result.totalOperations}`);
    lines.push(`Total Bits Changed,${result.totalBitsChanged}`);
    lines.push(`Initial Size,${result.initialBits.length} bits`);
    lines.push(`Final Size,${result.finalBits.length} bits`);
    lines.push(`Budget Used,${result.budgetUsed}`);
    lines.push(`Budget Remaining,${result.budgetRemaining}`);
    lines.push('');
    
    // Transformations
    lines.push('## Transformations');
    lines.push('Step,Operation,Params,Bit Ranges,Bits Changed,Duration (ms)');
    result.transformations.forEach((t, i) => {
      const ranges = t.bitRanges.map(r => `${r.start}-${r.end}`).join('; ');
      lines.push(`${i + 1},${t.operation},"${JSON.stringify(t.params)}","${ranges}",${t.bitsChanged},${t.duration.toFixed(2)}`);
    });
    lines.push('');
    
    // Metrics Comparison
    lines.push('## Metrics Comparison');
    lines.push('Metric,Initial,Final,Change');
    Object.keys(result.initialMetrics).forEach(key => {
      const initial = result.initialMetrics[key];
      const final = result.finalMetrics[key] ?? initial;
      const change = result.metricsImprovement[key] ?? 0;
      lines.push(`${key},${initial.toFixed(6)},${final.toFixed(6)},${change >= 0 ? '+' : ''}${change.toFixed(6)}`);
    });
    lines.push('');
    
    // Logs
    if (result.logs.length > 0) {
      lines.push('## Execution Logs');
      result.logs.forEach(log => {
        lines.push(`"${log.replace(/"/g, '""')}"`);
      });
    }
    
    return lines.join('\n');
  }

  /**
   * Export full JSON report
   */
  exportToJSON(result: StrategyRunResult): string {
    return JSON.stringify({
      ...result,
      exportedAt: new Date().toISOString(),
      // Don't include full bits in JSON export - too large
      initialBits: `[${result.initialBits.length} bits]`,
      finalBits: `[${result.finalBits.length} bits]`,
      transformations: result.transformations.map(t => ({
        ...t,
        beforeBits: `[${t.beforeBits.length} bits]`,
        afterBits: `[${t.afterBits.length} bits]`,
      })),
    }, null, 2);
  }

  /**
   * Get current result
   */
  getCurrentResult(): StrategyRunResult | null {
    return this.currentResult;
  }

  /**
   * Check if running
   */
  isExecuting(): boolean {
    return this.isRunning;
  }

  /**
   * Subscribe to updates
   */
  subscribe(listener: (result: StrategyRunResult | null, status: string) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(result: StrategyRunResult | null, status: string): void {
    this.listeners.forEach(l => l(result, status));
  }
}

export const strategyRunner = new StrategyRunner();

// Real working test strategy code
export const REAL_TEST_STRATEGY = `"""
Real Working Test Strategy
Analyzes and transforms binary data using actual operations and metrics
"""

from bitwise_api import (
    apply_operation, apply_operation_range, get_metric, get_all_metrics,
    get_available_operations, get_bits, set_bits, deduct_budget, get_budget, log
)

def analyze_initial_state():
    """Analyze the initial state of the bits"""
    bits = get_bits()
    log(f"=== Initial Analysis ===")
    log(f"Total bits: {len(bits)}")
    
    # Count ones and zeros
    ones = bits.count('1')
    zeros = bits.count('0')
    log(f"Ones: {ones} ({100*ones/len(bits):.1f}%)")
    log(f"Zeros: {zeros} ({100*zeros/len(bits):.1f}%)")
    
    # Get key metrics
    entropy = get_metric("entropy")
    log(f"Entropy: {entropy:.4f}")
    
    return entropy

def find_best_operation(bits_segment, target_metric="entropy"):
    """Find the best operation for a segment"""
    ops = get_available_operations()
    current_value = get_metric(target_metric, bits_segment)
    
    best_op = None
    best_improvement = 0
    
    for op in ops[:10]:  # Test first 10 operations
        if not deduct_budget(1):  # Check budget
            break
            
        try:
            result = apply_operation(op, bits_segment)
            new_value = get_metric(target_metric, result)
            improvement = current_value - new_value  # Lower entropy is better
            
            if improvement > best_improvement:
                best_improvement = improvement
                best_op = op
        except:
            pass
    
    return best_op, best_improvement

def optimize_segment(start, end):
    """Optimize a segment of bits"""
    bits = get_bits()
    segment = bits[start:end]
    
    if len(segment) < 4:
        return
    
    log(f"Optimizing segment [{start}:{end}] ({len(segment)} bits)")
    
    # Find best operation
    best_op, improvement = find_best_operation(segment)
    
    if best_op and improvement > 0:
        log(f"  Applying {best_op} (improvement: {improvement:.4f})")
        apply_operation_range(best_op, start, end)
    else:
        log(f"  No improvement found")

def execute():
    """Main strategy execution"""
    log("Starting Real Test Strategy")
    log("=" * 40)
    
    # Analyze initial state
    initial_entropy = analyze_initial_state()
    bits = get_bits()
    
    log("")
    log("=== Optimization Phase ===")
    
    # Divide into segments and optimize each
    segment_size = max(8, len(bits) // 8)
    segments_optimized = 0
    
    for i in range(0, len(bits), segment_size):
        if get_budget() < 5:
            log("Budget exhausted, stopping optimization")
            break
            
        end = min(i + segment_size, len(bits))
        optimize_segment(i, end)
        segments_optimized += 1
    
    log("")
    log("=== Final Analysis ===")
    final_bits = get_bits()
    final_entropy = get_metric("entropy")
    
    log(f"Segments optimized: {segments_optimized}")
    log(f"Final entropy: {final_entropy:.4f}")
    log(f"Entropy change: {final_entropy - initial_entropy:+.4f}")
    log(f"Budget remaining: {get_budget()}")
    
    # Count changes
    changes = sum(1 for a, b in zip(bits, final_bits) if a != b)
    log(f"Bits changed: {changes}")
    
    log("")
    log("Strategy execution complete!")
    
    return {
        "initial_entropy": initial_entropy,
        "final_entropy": final_entropy,
        "improvement": initial_entropy - final_entropy,
        "bits_changed": changes,
        "segments_optimized": segments_optimized
    }
`;
