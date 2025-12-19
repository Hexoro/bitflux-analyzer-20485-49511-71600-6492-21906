/**
 * Python Module System - Auto-injects all uploaded scripts as modules
 * Supports: auto-inject, standard imports, API-based loading
 * V2 - Added scheduler group and multiple file selection
 */

export interface PythonFile {
  id: string;
  name: string;
  content: string;
  group: 'scheduler' | 'algorithm' | 'scoring' | 'policies';
  created: Date;
  modified: Date;
}

export interface StrategyConfig {
  id: string;
  name: string;
  schedulerFile: string;    // Required - 1 file
  algorithmFiles: string[]; // Multiple allowed
  scoringFiles: string[];   // Multiple allowed
  policyFiles: string[];    // Multiple allowed
  created: Date;
}

export interface ExecutionContext {
  bits: string;
  metrics: Record<string, number>;
  operations: string[];
  allFiles: PythonFile[];
}

export interface PlayerState {
  isPlaying: boolean;
  currentStep: number;
  highlightedTransformations: string[];
  binaryHighlights: { start: number; end: number; color: string }[];
}

const STORAGE_KEY = 'bitwise_python_files_v2';
const STRATEGY_KEY = 'bitwise_strategies_v3';

// Example strategy Python templates
export const EXAMPLE_STRATEGIES = {
  greedy: {
    scheduler: `# Greedy Scheduler - Runs algorithm once with full data
from bitwise_api import get_bits, set_bits, log

def schedule():
    """Simple greedy scheduler - process all bits at once"""
    log("Greedy scheduler: Processing full bitstream")
    # Return single batch with all bits
    return [{"start": 0, "end": len(get_bits())}]
`,
    algorithm: `# Greedy Algorithm - Finds and applies best operation
from bitwise_api import get_bits, apply_operation, get_metric, log, OPERATIONS

def run_greedy():
    """Apply operations greedily to minimize entropy"""
    bits = get_bits()
    best_entropy = get_metric("entropy")
    
    for op in OPERATIONS[:5]:  # Try first 5 operations
        log(f"Trying operation: {op}")
        apply_operation(op)
        new_entropy = get_metric("entropy")
        if new_entropy < best_entropy:
            best_entropy = new_entropy
            log(f"Improved entropy to {new_entropy}")
    
    return get_bits()
`,
    scoring: `# Entropy Scoring - Evaluates compression quality
from bitwise_api import get_metric, log

def score():
    """Score based on entropy reduction"""
    entropy = get_metric("entropy")
    compression = get_metric("compression_ratio")
    
    # Lower entropy = better compression potential
    score = (1.0 - entropy) * 100 + compression * 50
    log(f"Score: {score:.2f}")
    return score
`,
    policies: `# Basic Policies - Constraints for algorithm
from bitwise_api import get_bits, log

def check_policies():
    """Check if current state meets policies"""
    bits = get_bits()
    
    # Policy 1: Don't let data grow too much
    if len(bits) > 10000000:
        log("Policy violation: Data too large")
        return False
    
    # Policy 2: Maintain some structure
    if len(set(bits)) < 2:
        log("Policy violation: Data became uniform")
        return False
    
    return True
`
  },
  hillClimbing: {
    scheduler: `# Hill Climbing Scheduler - Iterative improvement
from bitwise_api import get_bits, log

def schedule():
    """Schedule multiple iterations for hill climbing"""
    bits = get_bits()
    chunk_size = len(bits) // 4
    
    batches = []
    for i in range(4):
        batches.append({
            "start": i * chunk_size,
            "end": min((i + 1) * chunk_size, len(bits)),
            "iterations": 10
        })
    
    log(f"Hill climbing: {len(batches)} batches")
    return batches
`,
    algorithm: `# Hill Climbing Algorithm - Local search optimization
from bitwise_api import get_bits, set_bits, apply_operation, get_metric, log, OPERATIONS
import random

def climb():
    """Perform hill climbing optimization"""
    current_score = get_metric("entropy")
    improved = True
    iterations = 0
    
    while improved and iterations < 100:
        improved = False
        iterations += 1
        
        # Try random neighbor
        op = random.choice(OPERATIONS)
        apply_operation(op)
        new_score = get_metric("entropy")
        
        if new_score < current_score:
            current_score = new_score
            improved = True
            log(f"Iteration {iterations}: Improved to {new_score:.4f}")
    
    return get_bits()
`,
    scoring: `# Multi-objective Scoring
from bitwise_api import get_metric, log

def score():
    """Multi-objective evaluation"""
    entropy = get_metric("entropy")
    balance = get_metric("bit_balance")
    runs = get_metric("longest_run")
    
    # Weighted combination
    score = (
        (1.0 - entropy) * 40 +
        abs(0.5 - balance) * 30 +
        (1.0 / (runs + 1)) * 30
    )
    
    log(f"Entropy: {entropy:.4f}, Balance: {balance:.4f}")
    return score
`,
    policies: `# Strict Policies - More constraints
from bitwise_api import get_bits, get_metric, log

def check_policies():
    """Stricter policy enforcement"""
    bits = get_bits()
    entropy = get_metric("entropy")
    
    # Size constraint
    if len(bits) > len(bits) * 1.5:
        return False
    
    # Entropy shouldn't increase too much
    if entropy > 0.99:
        log("Warning: Maximum entropy reached")
    
    # Minimum data integrity
    if len(bits) < 8:
        return False
    
    return True
`
  },
  geneticAlgorithm: {
    scheduler: `# Genetic Algorithm Scheduler - Population management
from bitwise_api import get_bits, log

def schedule():
    """Schedule for genetic algorithm generations"""
    population_size = 10
    generations = 5
    
    batches = []
    for gen in range(generations):
        for ind in range(population_size):
            batches.append({
                "generation": gen,
                "individual": ind,
                "type": "evaluate"
            })
        batches.append({
            "generation": gen,
            "type": "selection"
        })
    
    log(f"GA: {generations} generations, pop size {population_size}")
    return batches
`,
    algorithm: `# Genetic Algorithm - Evolution-based optimization
from bitwise_api import get_bits, set_bits, apply_operation, log, OPERATIONS
import random

def evolve():
    """Apply genetic operations"""
    bits = get_bits()
    
    # Crossover: swap bit segments
    if len(bits) > 16:
        point = random.randint(4, len(bits) - 4)
        bits = bits[point:] + bits[:point]
        set_bits(bits)
    
    # Mutation: apply random operation
    if random.random() < 0.3:
        op = random.choice(OPERATIONS)
        apply_operation(op)
        log(f"Mutation applied: {op}")
    
    return get_bits()
`,
    scoring: `# Fitness Function for GA
from bitwise_api import get_metric, log

def fitness():
    """Calculate fitness for genetic algorithm"""
    entropy = get_metric("entropy")
    pattern_count = get_metric("pattern_count")
    
    # Fitness: lower entropy, more patterns
    fit = (1.0 - entropy) * 60 + pattern_count * 0.5
    
    log(f"Fitness: {fit:.2f}")
    return fit
`,
    policies: `# GA Policies - Evolution constraints
from bitwise_api import get_bits, log

def check():
    """Ensure valid individuals"""
    bits = get_bits()
    
    # Must have valid binary data
    if not all(b in '01' for b in bits):
        return False
    
    # Minimum viable size
    if len(bits) < 4:
        return False
    
    return True
`
  }
};

class PythonModuleSystem {
  private files: Map<string, PythonFile> = new Map();
  private strategies: Map<string, StrategyConfig> = new Map();
  private listeners: Set<() => void> = new Set();
  private playerState: PlayerState = {
    isPlaying: false,
    currentStep: 0,
    highlightedTransformations: [],
    binaryHighlights: []
  };

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

  updateFile(id: string, updates: Partial<Pick<PythonFile, 'content' | 'name' | 'group'>>): void {
    const file = this.files.get(id);
    if (file) {
      if (updates.content !== undefined) file.content = updates.content;
      if (updates.name !== undefined) file.name = updates.name;
      if (updates.group !== undefined) file.group = updates.group;
      file.modified = new Date();
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  deleteFile(id: string): void {
    this.files.delete(id);
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
  createStrategy(
    name: string, 
    schedulerFile: string, 
    algorithmFiles: string[], 
    scoringFiles: string[], 
    policyFiles: string[]
  ): StrategyConfig {
    // Validate scheduler exists (required)
    if (!this.getFileByName(schedulerFile)) {
      throw new Error(`Scheduler file "${schedulerFile}" not found`);
    }
    
    // Validate at least one of each type
    if (algorithmFiles.length === 0) {
      throw new Error('At least one algorithm file is required');
    }
    if (scoringFiles.length === 0) {
      throw new Error('At least one scoring file is required');
    }

    const id = `strat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const strategy: StrategyConfig = {
      id,
      name,
      schedulerFile,
      algorithmFiles,
      scoringFiles,
      policyFiles,
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
    
    // Check scheduler (required)
    if (!this.getFileByName(strategy.schedulerFile)) {
      errors.push(`Scheduler file "${strategy.schedulerFile}" not found`);
    }
    
    // Check algorithms
    strategy.algorithmFiles.forEach(f => {
      if (!this.getFileByName(f)) {
        errors.push(`Algorithm file "${f}" not found`);
      }
    });
    
    // Check scoring
    strategy.scoringFiles.forEach(f => {
      if (!this.getFileByName(f)) {
        errors.push(`Scoring file "${f}" not found`);
      }
    });
    
    // Check policies (optional but validate if specified)
    strategy.policyFiles.forEach(f => {
      if (!this.getFileByName(f)) {
        errors.push(`Policy file "${f}" not found`);
      }
    });

    return { valid: errors.length === 0, errors };
  }

  // Add example strategies
  addExampleStrategy(type: keyof typeof EXAMPLE_STRATEGIES): void {
    const example = EXAMPLE_STRATEGIES[type];
    const prefix = type.charAt(0).toUpperCase() + type.slice(1);
    
    // Add files
    this.addFile(`${prefix}_scheduler.py`, example.scheduler, 'scheduler');
    this.addFile(`${prefix}_algorithm.py`, example.algorithm, 'algorithm');
    this.addFile(`${prefix}_scoring.py`, example.scoring, 'scoring');
    this.addFile(`${prefix}_policies.py`, example.policies, 'policies');
    
    // Create strategy
    this.createStrategy(
      `${prefix} Strategy`,
      `${prefix}_scheduler.py`,
      [`${prefix}_algorithm.py`],
      [`${prefix}_scoring.py`],
      [`${prefix}_policies.py`]
    );
  }

  /**
   * Generate Python code that auto-injects all files as modules
   */
  generateModuleInjectionCode(context: ExecutionContext): string {
    const modules: string[] = [];

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

  // Player state management
  getPlayerState(): PlayerState {
    return { ...this.playerState };
  }

  setPlayerState(state: Partial<PlayerState>): void {
    this.playerState = { ...this.playerState, ...state };
    this.notifyListeners();
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
