/**
 * Python Executor - Pyodide-based Python execution for AI strategies
 * Connected to real operations and metrics via routers
 * V2 - Fixed module state reset between runs
 */

import { executeOperation, getOperationCost, getAvailableOperations, hasImplementation as hasOpImpl } from './operationsRouter';
import { calculateMetric, calculateAllMetrics, getAvailableMetrics, hasImplementation as hasMetricImpl } from './metricsCalculator';

export interface PythonContext {
  bits: string;
  budget: number;
  metrics: Record<string, number>;
  operations: string[];
}

interface PythonValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  hasTensorflow: boolean;
  hasKeras: boolean;
}

export interface TransformationRecord {
  operation: string;
  params: Record<string, any>;
  beforeBits: string;
  afterBits: string;
  bitRanges: { start: number; end: number }[];
  bitsChanged: number;
  duration: number;
}

export interface PythonExecutionResult {
  success: boolean;
  output: any;
  logs: string[];
  error?: string;
  duration: number;
  transformations: TransformationRecord[];
  finalBits: string;
  metrics: Record<string, number>;
  stats: {
    totalOperations: number;
    totalBitsChanged: number;
    budgetUsed: number;
    budgetRemaining: number;
  };
}

class PythonExecutor {
  private pyodide: any = null;
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;
  private loadProgress = 0;
  private listeners: Set<(progress: number) => void> = new Set();
  private executionCounter = 0;

  async loadPyodide(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      try {
        this.notifyProgress(10);
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
        
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Pyodide script'));
          document.head.appendChild(script);
        });

        this.notifyProgress(30);

        // @ts-ignore
        this.pyodide = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
        });

        this.notifyProgress(70);
        await this.pyodide.loadPackage(['numpy']);
        
        this.notifyProgress(100);
        this.isLoaded = true;
        console.log('Pyodide Python loaded successfully');
      } catch (error) {
        console.error('Failed to load Pyodide:', error);
        throw new Error('Failed to load Python runtime');
      }
    })();

    return this.loadPromise;
  }

  private notifyProgress(progress: number): void {
    this.loadProgress = progress;
    this.listeners.forEach(l => l(progress));
  }

  subscribeProgress(listener: (progress: number) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getLoadProgress(): number {
    return this.loadProgress;
  }

  isReady(): boolean {
    return this.isLoaded;
  }

  async validateSyntax(pythonCode: string): Promise<PythonValidationResult> {
    const result: PythonValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      hasTensorflow: false,
      hasKeras: false,
    };

    try {
      result.hasTensorflow = pythonCode.includes('tensorflow') || pythonCode.includes('import tf');
      result.hasKeras = pythonCode.includes('keras');

      if (result.hasTensorflow) {
        result.warnings.push('TensorFlow detected - ensure model file is accessible');
      }

      if (!pythonCode.includes('def execute')) {
        result.warnings.push('Strategy should define an "execute()" function');
      }

      if (!pythonCode.includes('from bitwise_api import') && !pythonCode.includes('import bitwise_api')) {
        result.warnings.push('Consider importing bitwise_api for access to operations');
      }

      const openParens = (pythonCode.match(/\(/g) || []).length;
      const closeParens = (pythonCode.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        result.valid = false;
        result.errors.push(`Mismatched parentheses: ${openParens} open, ${closeParens} close`);
      }

      const openBrackets = (pythonCode.match(/\[/g) || []).length;
      const closeBrackets = (pythonCode.match(/\]/g) || []).length;
      if (openBrackets !== closeBrackets) {
        result.valid = false;
        result.errors.push(`Mismatched brackets: ${openBrackets} open, ${closeBrackets} close`);
      }

      const lines = pythonCode.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('\t') && line.match(/^ +/)) {
          result.warnings.push(`Line ${i + 1}: Mixed tabs and spaces`);
        }
      }

      if (this.isLoaded) {
        try {
          await this.pyodide.runPythonAsync(`
import ast
try:
    ast.parse('''${pythonCode.replace(/'/g, "\\'")}''')
except SyntaxError as e:
    raise e
          `);
        } catch (error: any) {
          result.valid = false;
          result.errors.push(`Python syntax error: ${error.message || error}`);
        }
      }

      return result;
    } catch (error) {
      result.valid = false;
      result.errors.push(`Validation error: ${error}`);
      return result;
    }
  }

  private createBitwiseApiBridge(context: PythonContext) {
    let currentBits = context.bits;
    let currentBudget = context.budget;
    const initialBudget = context.budget;
    const logs: string[] = [];
    const transformations: TransformationRecord[] = [];

    return {
      bridge: {
        apply_operation: (opName: string, bits: string, params?: any, rangeStart?: number, rangeEnd?: number) => {
          const startTime = performance.now();
          const beforeBits = bits || currentBits;
          try {
            const result = executeOperation(opName, beforeBits, params || {});
            if (result.success) {
              // Track transformation
              const bitsChanged = this.countChangedBits(beforeBits, result.bits);
              transformations.push({
                operation: opName,
                params: params || {},
                beforeBits,
                afterBits: result.bits,
                bitRanges: rangeStart !== undefined && rangeEnd !== undefined 
                  ? [{ start: rangeStart, end: rangeEnd }]
                  : [{ start: 0, end: result.bits.length }],
                bitsChanged,
                duration: performance.now() - startTime,
              });
              
              // Update current bits if operating on default
              if (!bits) {
                currentBits = result.bits;
              }
              return result.bits;
            }
            logs.push(`[ERROR] Operation ${opName} failed: ${result.error}`);
            return beforeBits;
          } catch (e) {
            logs.push(`[ERROR] Operation ${opName} exception: ${e}`);
            return beforeBits;
          }
        },

        apply_operation_range: (opName: string, start: number, end: number, params?: any) => {
          const startTime = performance.now();
          const beforeBits = currentBits;
          try {
            const targetBits = currentBits.slice(start, end);
            const result = executeOperation(opName, targetBits, params || {});
            if (result.success) {
              const newBits = currentBits.slice(0, start) + result.bits + currentBits.slice(end);
              const bitsChanged = this.countChangedBits(targetBits, result.bits);
              
              transformations.push({
                operation: opName,
                params: { ...params, range: { start, end } },
                beforeBits,
                afterBits: newBits,
                bitRanges: [{ start, end }],
                bitsChanged,
                duration: performance.now() - startTime,
              });
              
              currentBits = newBits;
              return result.bits;
            }
            logs.push(`[ERROR] Operation ${opName} on range [${start}:${end}] failed: ${result.error}`);
            return targetBits;
          } catch (e) {
            logs.push(`[ERROR] Operation ${opName} exception: ${e}`);
            return currentBits.slice(start, end);
          }
        },

        get_metric: (metricName: string, bits?: string) => {
          try {
            const targetBits = bits || currentBits;
            const result = calculateMetric(metricName, targetBits);
            if (result.success) {
              return result.value;
            }
            logs.push(`[WARN] Metric ${metricName} failed: ${result.error}`);
            return 0;
          } catch (e) {
            logs.push(`[WARN] Metric ${metricName} exception: ${e}`);
            return 0;
          }
        },

        get_all_metrics: (bits?: string) => {
          try {
            const targetBits = bits || currentBits;
            const result = calculateAllMetrics(targetBits);
            return result.metrics;
          } catch (e) {
            logs.push(`[WARN] get_all_metrics exception: ${e}`);
            return {};
          }
        },

        get_cost: (opName: string) => getOperationCost(opName),
        has_operation: (opName: string) => hasOpImpl(opName),
        has_metric: (metricName: string) => hasMetricImpl(metricName),
        get_available_operations: () => getAvailableOperations(),
        get_available_metrics: () => getAvailableMetrics(),
        get_budget: () => currentBudget,
        
        deduct_budget: (amount: number) => {
          if (currentBudget >= amount) {
            currentBudget -= amount;
            return true;
          }
          return false;
        },

        log: (msg: string) => { logs.push(String(msg)); },
        get_bits: () => currentBits,
        set_bits: (newBits: string) => { currentBits = newBits; },
        get_bits_length: () => currentBits.length,
        get_bit: (index: number) => currentBits[index] || '0',
        set_bit: (index: number, value: string) => {
          if (index >= 0 && index < currentBits.length) {
            currentBits = currentBits.slice(0, index) + (value === '1' ? '1' : '0') + currentBits.slice(index + 1);
          }
        },
      },
      getLogs: () => logs,
      getCurrentBits: () => currentBits,
      getCurrentBudget: () => currentBudget,
      getTransformations: () => transformations,
      getStats: () => ({
        totalOperations: transformations.length,
        totalBitsChanged: transformations.reduce((sum, t) => sum + t.bitsChanged, 0),
        budgetUsed: initialBudget - currentBudget,
        budgetRemaining: currentBudget,
      }),
    };
  }

  private countChangedBits(before: string, after: string): number {
    let count = 0;
    const maxLen = Math.max(before.length, after.length);
    for (let i = 0; i < maxLen; i++) {
      if ((before[i] || '0') !== (after[i] || '0')) count++;
    }
    return count;
  }

  async sandboxTest(pythonCode: string, context: PythonContext): Promise<PythonExecutionResult> {
    const startTime = performance.now();
    this.executionCounter++;
    const execId = this.executionCounter;

    try {
      if (!this.isLoaded) {
        await this.loadPyodide();
      }

      const bridgeObj = this.createBitwiseApiBridge(context);
      
      // Use unique module name to avoid state pollution
      const bridgeName = `bitwise_bridge_${execId}`;
      this.pyodide.registerJsModule(bridgeName, bridgeObj.bridge);

      // Reset Python state and create fresh module
      await this.pyodide.runPythonAsync(`
import sys

# Clean up old modules
for mod_name in list(sys.modules.keys()):
    if mod_name.startswith('bitwise_') or mod_name == 'bitwise_api':
        del sys.modules[mod_name]

# Clean up global namespace
for name in list(globals().keys()):
    if not name.startswith('_') and name not in ['sys', 'ast', 'ModuleType']:
        try:
            del globals()[name]
        except:
            pass
      `);

      await this.pyodide.runPythonAsync(`
import sys
from types import ModuleType
import ${bridgeName} as _bridge

# Create fresh bitwise_api module
bitwise_api = ModuleType('bitwise_api')
bitwise_api.bits = '${context.bits}'
bitwise_api.budget = ${context.budget}
bitwise_api.OPERATIONS = ${JSON.stringify(context.operations)}

def apply_operation(op_name, bits=None, params=None):
    if bits is None:
        bits = _bridge.get_bits()
    result = _bridge.apply_operation(op_name, bits, params)
    return result

def apply_operation_range(op_name, start, end, params=None):
    return _bridge.apply_operation_range(op_name, start, end, params)

def get_metric(metric_name, bits=None):
    if bits is None:
        bits = _bridge.get_bits()
    return _bridge.get_metric(metric_name, bits)

def get_all_metrics(bits=None):
    result = _bridge.get_all_metrics(bits)
    return dict(result.to_py()) if hasattr(result, 'to_py') else dict(result)

def get_cost(op_name):
    return _bridge.get_cost(op_name)

def has_operation(op_name):
    return _bridge.has_operation(op_name)

def has_metric(metric_name):
    return _bridge.has_metric(metric_name)

def get_available_operations():
    result = _bridge.get_available_operations()
    return list(result.to_py()) if hasattr(result, 'to_py') else list(result)

def get_available_metrics():
    result = _bridge.get_available_metrics()
    return list(result.to_py()) if hasattr(result, 'to_py') else list(result)

def is_operation_allowed(op_name):
    return op_name in bitwise_api.OPERATIONS

def deduct_budget(amount):
    return _bridge.deduct_budget(amount)

def get_budget():
    return _bridge.get_budget()

def get_bits():
    return _bridge.get_bits()

def set_bits(new_bits):
    _bridge.set_bits(new_bits)

def get_bits_length():
    return _bridge.get_bits_length()

def get_bit(index):
    return _bridge.get_bit(index)

def set_bit(index, value):
    _bridge.set_bit(index, value)

def log(msg):
    _bridge.log(str(msg))

def halt():
    pass

# Attach to module
bitwise_api.apply_operation = apply_operation
bitwise_api.apply_operation_range = apply_operation_range
bitwise_api.get_metric = get_metric
bitwise_api.get_all_metrics = get_all_metrics
bitwise_api.get_cost = get_cost
bitwise_api.has_operation = has_operation
bitwise_api.has_metric = has_metric
bitwise_api.get_available_operations = get_available_operations
bitwise_api.get_available_metrics = get_available_metrics
bitwise_api.is_operation_allowed = is_operation_allowed
bitwise_api.deduct_budget = deduct_budget
bitwise_api.get_budget = get_budget
bitwise_api.get_bits = get_bits
bitwise_api.set_bits = set_bits
bitwise_api.get_bits_length = get_bits_length
bitwise_api.get_bit = get_bit
bitwise_api.set_bit = set_bit
bitwise_api.log = log
bitwise_api.halt = halt

sys.modules['bitwise_api'] = bitwise_api
      `);

      // Run user code
      const result = await this.pyodide.runPythonAsync(pythonCode);

      // Try to call execute() if it exists
      let executeResult = null;
      try {
        executeResult = await this.pyodide.runPythonAsync(`
_result = None
if 'execute' in dir():
    _result = execute()
_result
        `);
      } catch (e) {
        bridgeObj.bridge.log(`execute() error: ${e}`);
      }

      // Get final metrics
      const finalMetrics = bridgeObj.bridge.get_all_metrics();
      const metricsDict = (finalMetrics && typeof finalMetrics === 'object') 
        ? finalMetrics as Record<string, number>
        : {};

      return {
        success: true,
        output: executeResult !== null ? executeResult : result,
        logs: bridgeObj.getLogs(),
        duration: performance.now() - startTime,
        transformations: bridgeObj.getTransformations(),
        finalBits: bridgeObj.getCurrentBits(),
        metrics: metricsDict,
        stats: bridgeObj.getStats(),
      };
    } catch (error) {
      return {
        success: false,
        output: null,
        logs: [],
        error: error instanceof Error ? error.message : String(error),
        duration: performance.now() - startTime,
        transformations: [],
        finalBits: context.bits,
        metrics: {},
        stats: {
          totalOperations: 0,
          totalBitsChanged: 0,
          budgetUsed: 0,
          budgetRemaining: context.budget,
        },
      };
    }
  }

  /**
   * Execute a full strategy with file integration
   */
  async executeStrategy(
    pythonCode: string, 
    context: PythonContext,
    onProgress?: (step: number, total: number, bits: string) => void
  ): Promise<PythonExecutionResult> {
    return this.sandboxTest(pythonCode, context);
  }
}

export const pythonExecutor = new PythonExecutor();
