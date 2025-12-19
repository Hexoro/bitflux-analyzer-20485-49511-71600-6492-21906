/**
 * Python Executor - Pyodide-based Python execution for AI strategies
 * Connected to real operations and metrics via routers
 */

import { executeOperation, getOperationCost, getAvailableOperations, hasImplementation as hasOpImpl } from './operationsRouter';
import { calculateMetric, calculateAllMetrics, getAvailableMetrics, hasImplementation as hasMetricImpl } from './metricsCalculator';

interface PythonContext {
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

interface PythonExecutionResult {
  success: boolean;
  output: any;
  logs: string[];
  error?: string;
  duration: number;
}

class PythonExecutor {
  private pyodide: any = null;
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;
  private loadProgress = 0;
  private listeners: Set<(progress: number) => void> = new Set();

  /**
   * Load Pyodide on-demand
   */
  async loadPyodide(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      try {
        this.notifyProgress(10);
        
        // Load Pyodide from CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
        
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Pyodide script'));
          document.head.appendChild(script);
        });

        this.notifyProgress(30);

        // Initialize Pyodide
        // @ts-ignore - Pyodide is loaded globally
        this.pyodide = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
        });

        this.notifyProgress(70);

        // Install numpy (commonly needed for AI)
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

  /**
   * Validate Python code syntax and structure
   */
  async validateSyntax(pythonCode: string): Promise<PythonValidationResult> {
    const result: PythonValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      hasTensorflow: false,
      hasKeras: false,
    };

    try {
      // Check for TensorFlow/Keras imports
      result.hasTensorflow = pythonCode.includes('tensorflow') || pythonCode.includes('import tf');
      result.hasKeras = pythonCode.includes('keras');

      if (result.hasTensorflow) {
        result.warnings.push('TensorFlow detected - ensure model file is accessible');
      }

      // Check for required execute function
      if (!pythonCode.includes('def execute')) {
        result.warnings.push('Strategy should define an "execute()" function');
      }

      // Check for API imports
      if (!pythonCode.includes('from bitwise_api import') && !pythonCode.includes('import bitwise_api')) {
        result.warnings.push('Consider importing bitwise_api for access to operations');
      }

      // Basic syntax checks
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

      // Check indentation (basic)
      const lines = pythonCode.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('\t') && line.match(/^ +/)) {
          result.warnings.push(`Line ${i + 1}: Mixed tabs and spaces`);
        }
      }

      // If Pyodide is loaded, do actual syntax check
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

  /**
   * Run sandbox test of Python script
   */
  /**
   * Create the JavaScript bridge for Python to call real operations/metrics
   */
  private createBitwiseApiBridge(context: PythonContext) {
    let currentBits = context.bits;
    let currentBudget = context.budget;
    const logs: string[] = [];

    return {
      bridge: {
        // Execute real operations via operationsRouter
        apply_operation: (opName: string, bits: string, params?: any) => {
          try {
            const result = executeOperation(opName, bits, params || {});
            if (result.success) {
              return result.bits;
            }
            logs.push(`[ERROR] Operation ${opName} failed: ${result.error}`);
            return bits; // Return unchanged on error
          } catch (e) {
            logs.push(`[ERROR] Operation ${opName} exception: ${e}`);
            return bits;
          }
        },

        // Get real metrics via metricsCalculator
        get_metric: (metricName: string, bits: string) => {
          try {
            const result = calculateMetric(metricName, bits);
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

        // Get all metrics at once
        get_all_metrics: (bits: string) => {
          try {
            const result = calculateAllMetrics(bits);
            return result.metrics;
          } catch (e) {
            logs.push(`[WARN] get_all_metrics exception: ${e}`);
            return {};
          }
        },

        // Get real operation costs
        get_cost: (opName: string) => {
          return getOperationCost(opName);
        },

        // Check if operation exists
        has_operation: (opName: string) => {
          return hasOpImpl(opName);
        },

        // Check if metric exists
        has_metric: (metricName: string) => {
          return hasMetricImpl(metricName);
        },

        // Get available operations
        get_available_operations: () => {
          return getAvailableOperations();
        },

        // Get available metrics
        get_available_metrics: () => {
          return getAvailableMetrics();
        },

        // Budget management
        get_budget: () => currentBudget,
        
        deduct_budget: (amount: number) => {
          if (currentBudget >= amount) {
            currentBudget -= amount;
            return true;
          }
          return false;
        },

        // Logging
        log: (msg: string) => {
          logs.push(msg);
        },

        // Get current bits
        get_bits: () => currentBits,
        
        // Update bits
        set_bits: (newBits: string) => {
          currentBits = newBits;
        },
      },
      getLogs: () => logs,
      getCurrentBits: () => currentBits,
      getCurrentBudget: () => currentBudget,
    };
  }

  /**
   * Run sandbox test of Python script with REAL operations and metrics
   */
  async sandboxTest(pythonCode: string, context: PythonContext): Promise<PythonExecutionResult> {
    const startTime = performance.now();

    try {
      if (!this.isLoaded) {
        await this.loadPyodide();
      }

      // Create the bridge with real implementations
      const bridgeObj = this.createBitwiseApiBridge(context);

      // Register the JavaScript bridge module
      this.pyodide.registerJsModule('bitwise_bridge', bridgeObj.bridge);

      // Set up Python globals
      this.pyodide.globals.set('bits', context.bits);
      this.pyodide.globals.set('budget', context.budget);
      this.pyodide.globals.set('bits_length', context.bits.length);

      // Create the Python bitwise_api module that wraps the JS bridge
      await this.pyodide.runPythonAsync(`
import sys
from types import ModuleType
import bitwise_bridge

bitwise_api = ModuleType('bitwise_api')

# Initial state
bitwise_api.bits = '${context.bits}'
bitwise_api.budget = ${context.budget}
bitwise_api.OPERATIONS = ${JSON.stringify(context.operations)}

def apply_operation(op_name, bits=None, params=None):
    """Apply a real operation via the router"""
    if bits is None:
        bits = bitwise_api.bits
    result = bitwise_bridge.apply_operation(op_name, bits, params)
    return result

def get_metric(metric_name, bits=None):
    """Get a real metric value via the calculator"""
    if bits is None:
        bits = bitwise_api.bits
    return bitwise_bridge.get_metric(metric_name, bits)

def get_all_metrics(bits=None):
    """Get all metrics at once"""
    if bits is None:
        bits = bitwise_api.bits
    result = bitwise_bridge.get_all_metrics(bits)
    # Convert JS object to Python dict
    return dict(result.to_py()) if hasattr(result, 'to_py') else dict(result)

def get_cost(op_name):
    """Get the cost of an operation"""
    return bitwise_bridge.get_cost(op_name)

def has_operation(op_name):
    """Check if operation is implemented"""
    return bitwise_bridge.has_operation(op_name)

def has_metric(metric_name):
    """Check if metric is implemented"""
    return bitwise_bridge.has_metric(metric_name)

def get_available_operations():
    """Get list of available operations"""
    result = bitwise_bridge.get_available_operations()
    return list(result.to_py()) if hasattr(result, 'to_py') else list(result)

def get_available_metrics():
    """Get list of available metrics"""
    result = bitwise_bridge.get_available_metrics()
    return list(result.to_py()) if hasattr(result, 'to_py') else list(result)

def is_operation_allowed(op_name):
    """Check if operation is in allowed list"""
    return op_name in bitwise_api.OPERATIONS

def deduct_budget(amount):
    """Deduct from budget, returns True if successful"""
    return bitwise_bridge.deduct_budget(amount)

def get_budget():
    """Get current remaining budget"""
    return bitwise_bridge.get_budget()

def log(msg):
    """Log a message"""
    bitwise_bridge.log(str(msg))

def halt():
    """Stop execution (placeholder)"""
    pass

# Attach all functions to the module
bitwise_api.apply_operation = apply_operation
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
bitwise_api.log = log
bitwise_api.halt = halt

sys.modules['bitwise_api'] = bitwise_api
      `);

      // Run the user's code
      const result = await this.pyodide.runPythonAsync(pythonCode);

      // Try to call execute() if it exists
      let executeResult = null;
      try {
        executeResult = await this.pyodide.runPythonAsync(`
result = None
if 'execute' in dir():
    result = execute()
result
        `);
      } catch (e) {
        // execute() might not exist or might fail
        bridgeObj.bridge.log(`execute() error: ${e}`);
      }

      return {
        success: true,
        output: executeResult || result,
        logs: bridgeObj.getLogs(),
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        output: null,
        logs: [],
        error: error instanceof Error ? error.message : String(error),
        duration: performance.now() - startTime,
      };
    }
  }
}

export const pythonExecutor = new PythonExecutor();
