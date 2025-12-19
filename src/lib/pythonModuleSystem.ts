/**
 * Python Module System - Auto-injects all uploaded scripts as modules
 * Supports: auto-inject, standard imports, API-based loading
 */

export interface PythonFile {
  id: string;
  name: string;
  content: string;
  group: 'algorithm' | 'scoring' | 'policies';
  created: Date;
  modified: Date;
}

export interface StrategyConfig {
  id: string;
  name: string;
  algorithmFile: string; // filename
  scoringFile: string;   // filename
  policyFile: string;    // filename
  created: Date;
}

export interface ExecutionContext {
  bits: string;
  metrics: Record<string, number>;
  operations: string[];
  allFiles: PythonFile[];
}

const STORAGE_KEY = 'bitwise_python_files';
const STRATEGY_KEY = 'bitwise_strategies_v2';

class PythonModuleSystem {
  private files: Map<string, PythonFile> = new Map();
  private strategies: Map<string, StrategyConfig> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        parsed.forEach((f: any) => {
          this.files.set(f.id, {
            ...f,
            created: new Date(f.created),
            modified: new Date(f.modified),
          });
        });
      }

      const stratData = localStorage.getItem(STRATEGY_KEY);
      if (stratData) {
        const parsed = JSON.parse(stratData);
        parsed.forEach((s: any) => {
          this.strategies.set(s.id, {
            ...s,
            created: new Date(s.created),
          });
        });
      }
    } catch (error) {
      console.error('Failed to load Python files:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(this.files.values())));
      localStorage.setItem(STRATEGY_KEY, JSON.stringify(Array.from(this.strategies.values())));
    } catch (error) {
      console.error('Failed to save Python files:', error);
    }
  }

  // File management
  addFile(name: string, content: string, group: PythonFile['group']): PythonFile {
    // Only allow .py files
    if (!name.endsWith('.py')) {
      throw new Error('Only Python (.py) files are allowed');
    }

    const id = `py_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const file: PythonFile = {
      id,
      name,
      content,
      group,
      created: new Date(),
      modified: new Date(),
    };
    this.files.set(id, file);
    this.saveToStorage();
    this.notifyListeners();
    return file;
  }

  updateFile(id: string, content: string): void {
    const file = this.files.get(id);
    if (file) {
      file.content = content;
      file.modified = new Date();
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  deleteFile(id: string): void {
    this.files.delete(id);
    // Check if any strategy references this file
    const fileToDelete = this.files.get(id);
    if (fileToDelete) {
      this.strategies.forEach((strat, stratId) => {
        if (strat.algorithmFile === fileToDelete.name ||
            strat.scoringFile === fileToDelete.name ||
            strat.policyFile === fileToDelete.name) {
          // Mark strategy as broken or delete it
          console.warn(`Strategy "${strat.name}" references deleted file "${fileToDelete.name}"`);
        }
      });
    }
    this.saveToStorage();
    this.notifyListeners();
  }

  getFile(id: string): PythonFile | undefined {
    return this.files.get(id);
  }

  getFileByName(name: string): PythonFile | undefined {
    return Array.from(this.files.values()).find(f => f.name === name);
  }

  getFilesByGroup(group: PythonFile['group']): PythonFile[] {
    return Array.from(this.files.values())
      .filter(f => f.group === group)
      .sort((a, b) => b.created.getTime() - a.created.getTime());
  }

  getAllFiles(): PythonFile[] {
    return Array.from(this.files.values())
      .sort((a, b) => b.created.getTime() - a.created.getTime());
  }

  // Strategy management
  createStrategy(name: string, algorithmFile: string, scoringFile: string, policyFile: string): StrategyConfig {
    // Validate files exist
    if (!this.getFileByName(algorithmFile)) {
      throw new Error(`Algorithm file "${algorithmFile}" not found`);
    }
    if (!this.getFileByName(scoringFile)) {
      throw new Error(`Scoring file "${scoringFile}" not found`);
    }
    if (!this.getFileByName(policyFile)) {
      throw new Error(`Policy file "${policyFile}" not found`);
    }

    const id = `strat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const strategy: StrategyConfig = {
      id,
      name,
      algorithmFile,
      scoringFile,
      policyFile,
      created: new Date(),
    };
    this.strategies.set(id, strategy);
    this.saveToStorage();
    this.notifyListeners();
    return strategy;
  }

  deleteStrategy(id: string): void {
    this.strategies.delete(id);
    this.saveToStorage();
    this.notifyListeners();
  }

  getStrategy(id: string): StrategyConfig | undefined {
    return this.strategies.get(id);
  }

  getAllStrategies(): StrategyConfig[] {
    return Array.from(this.strategies.values())
      .sort((a, b) => b.created.getTime() - a.created.getTime());
  }

  validateStrategy(id: string): { valid: boolean; errors: string[] } {
    const strategy = this.strategies.get(id);
    if (!strategy) {
      return { valid: false, errors: ['Strategy not found'] };
    }

    const errors: string[] = [];
    if (!this.getFileByName(strategy.algorithmFile)) {
      errors.push(`Algorithm file "${strategy.algorithmFile}" not found`);
    }
    if (!this.getFileByName(strategy.scoringFile)) {
      errors.push(`Scoring file "${strategy.scoringFile}" not found`);
    }
    if (!this.getFileByName(strategy.policyFile)) {
      errors.push(`Policy file "${strategy.policyFile}" not found`);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Generate Python code that auto-injects all files as modules
   * This creates a virtual module system where all files can import each other
   */
  generateModuleInjectionCode(context: ExecutionContext): string {
    const modules: string[] = [];

    // Create module for each file
    context.allFiles.forEach(file => {
      const moduleName = file.name.replace('.py', '');
      const escapedContent = file.content
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\n/g, '\\n');
      
      modules.push(`
# Auto-inject: ${file.name}
${moduleName}_code = '''${escapedContent}'''
${moduleName}_module = ModuleType('${moduleName}')
exec(${moduleName}_code, ${moduleName}_module.__dict__)
sys.modules['${moduleName}'] = ${moduleName}_module
`);
    });

    return `
import sys
from types import ModuleType

# === Bitwise API ===
bitwise_api = ModuleType('bitwise_api')
bitwise_api.bits = '${context.bits}'
bitwise_api.OPERATIONS = ${JSON.stringify(context.operations)}
bitwise_api.METRICS = ${JSON.stringify(context.metrics)}

_current_bits = '${context.bits}'
_operation_log = []

def get_bits():
    return _current_bits

def set_bits(new_bits):
    global _current_bits
    _current_bits = new_bits

def apply_operation(op_name, params=None):
    global _current_bits
    _operation_log.append({'operation': op_name, 'params': params, 'before': _current_bits})
    # Operations are applied by the executor
    return _current_bits

def get_metric(metric_name):
    return bitwise_api.METRICS.get(metric_name, 0.0)

def log(msg):
    print(f"[LOG] {msg}")

def get_operation_log():
    return _operation_log

bitwise_api.get_bits = get_bits
bitwise_api.set_bits = set_bits
bitwise_api.apply_operation = apply_operation
bitwise_api.get_metric = get_metric
bitwise_api.log = log
bitwise_api.get_operation_log = get_operation_log

sys.modules['bitwise_api'] = bitwise_api

# === Auto-injected modules ===
${modules.join('\n')}
`;
  }

  // Subscribe to changes
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(l => l());
  }
}

export const pythonModuleSystem = new PythonModuleSystem();
