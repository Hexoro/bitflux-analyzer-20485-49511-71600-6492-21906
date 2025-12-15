/**
 * Python Executor - Pyodide-based Python execution for AI strategies
 */

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
  async sandboxTest(pythonCode: string, context: PythonContext): Promise<PythonExecutionResult> {
    const startTime = performance.now();
    const logs: string[] = [];

    try {
      if (!this.isLoaded) {
        await this.loadPyodide();
      }

      // Set up the context
      this.pyodide.globals.set('bits', context.bits);
      this.pyodide.globals.set('budget', context.budget);
      this.pyodide.globals.set('bits_length', context.bits.length);

      // Mock bitwise_api module
      await this.pyodide.runPythonAsync(`
import sys
from types import ModuleType

bitwise_api = ModuleType('bitwise_api')
bitwise_api.bits = '${context.bits}'
bitwise_api.budget = ${context.budget}
bitwise_api.OPERATIONS = ${JSON.stringify(context.operations)}

def apply_operation(op_name, params=None):
    return bits

def get_cost(op_name):
    return 5

def get_metric(metric_name):
    return 0.5

def is_operation_allowed(op_name):
    return op_name in ${JSON.stringify(context.operations)}

def deduct_budget(amount):
    global budget
    if budget >= amount:
        budget -= amount
        return True
    return False

def log(msg):
    print(msg)

def halt():
    pass

bitwise_api.apply_operation = apply_operation
bitwise_api.get_cost = get_cost
bitwise_api.get_metric = get_metric
bitwise_api.is_operation_allowed = is_operation_allowed
bitwise_api.deduct_budget = deduct_budget
bitwise_api.log = log
bitwise_api.halt = halt

sys.modules['bitwise_api'] = bitwise_api
      `);

      // Run the code
      const result = await this.pyodide.runPythonAsync(pythonCode);

      // Try to call execute() if it exists
      try {
        await this.pyodide.runPythonAsync(`
if 'execute' in dir():
    execute()
        `);
      } catch (e) {
        // execute() might not exist, that's ok for validation
      }

      return {
        success: true,
        output: result,
        logs,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        output: null,
        logs,
        error: error instanceof Error ? error.message : String(error),
        duration: performance.now() - startTime,
      };
    }
  }
}

export const pythonExecutor = new PythonExecutor();
