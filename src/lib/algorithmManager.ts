/**
 * Algorithm Manager - Manages algorithm files (C++) and scoring configurations (JSON)
 * Persists data to localStorage for permanent storage
 */

export interface AlgorithmFile {
  id: string;
  name: string;
  content: string;
  created: Date;
  modified: Date;
}

export interface OperationCost {
  operation: string;
  cost: number;
}

export interface CombinedOperationCost {
  operations: string[];
  cost: number;
}

export interface ScoringConfig {
  id: string;
  name: string;
  initialBudget: number;
  operations: OperationCost[];
  combinedOperations: CombinedOperationCost[];
  created: Date;
  modified: Date;
}

export interface ScoringState {
  configId: string | null;
  currentBudget: number;
  operationsApplied: { operation: string; cost: number; timestamp: Date }[];
}

const ALGORITHMS_STORAGE_KEY = 'bitwise_algorithms';
const SCORING_STORAGE_KEY = 'bitwise_scoring_configs';
const SCORING_STATE_KEY = 'bitwise_scoring_state';

export class AlgorithmManager {
  private algorithms: Map<string, AlgorithmFile> = new Map();
  private scoringConfigs: Map<string, ScoringConfig> = new Map();
  private scoringState: ScoringState = {
    configId: null,
    currentBudget: 0,
    operationsApplied: [],
  };
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  // Load from localStorage
  private loadFromStorage(): void {
    try {
      const algorithmsData = localStorage.getItem(ALGORITHMS_STORAGE_KEY);
      if (algorithmsData) {
        const parsed = JSON.parse(algorithmsData);
        parsed.forEach((alg: any) => {
          this.algorithms.set(alg.id, {
            ...alg,
            created: new Date(alg.created),
            modified: new Date(alg.modified),
          });
        });
      }

      const scoringData = localStorage.getItem(SCORING_STORAGE_KEY);
      if (scoringData) {
        const parsed = JSON.parse(scoringData);
        parsed.forEach((cfg: any) => {
          this.scoringConfigs.set(cfg.id, {
            ...cfg,
            created: new Date(cfg.created),
            modified: new Date(cfg.modified),
          });
        });
      }

      const stateData = localStorage.getItem(SCORING_STATE_KEY);
      if (stateData) {
        const parsed = JSON.parse(stateData);
        this.scoringState = {
          ...parsed,
          operationsApplied: parsed.operationsApplied.map((op: any) => ({
            ...op,
            timestamp: new Date(op.timestamp),
          })),
        };
      }
    } catch (error) {
      console.error('Failed to load algorithm data from storage:', error);
    }
  }

  // Save to localStorage
  private saveToStorage(): void {
    try {
      const algorithmsData = Array.from(this.algorithms.values());
      localStorage.setItem(ALGORITHMS_STORAGE_KEY, JSON.stringify(algorithmsData));

      const scoringData = Array.from(this.scoringConfigs.values());
      localStorage.setItem(SCORING_STORAGE_KEY, JSON.stringify(scoringData));

      localStorage.setItem(SCORING_STATE_KEY, JSON.stringify(this.scoringState));
    } catch (error) {
      console.error('Failed to save algorithm data to storage:', error);
    }
  }

  // Algorithm CRUD operations
  addAlgorithm(name: string, content: string): AlgorithmFile {
    const id = `alg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const algorithm: AlgorithmFile = {
      id,
      name,
      content,
      created: new Date(),
      modified: new Date(),
    };
    this.algorithms.set(id, algorithm);
    this.saveToStorage();
    this.notifyListeners();
    return algorithm;
  }

  getAlgorithms(): AlgorithmFile[] {
    return Array.from(this.algorithms.values()).sort((a, b) => 
      a.created.getTime() - b.created.getTime()
    );
  }

  getAlgorithm(id: string): AlgorithmFile | undefined {
    return this.algorithms.get(id);
  }

  updateAlgorithm(id: string, content: string): void {
    const alg = this.algorithms.get(id);
    if (alg) {
      alg.content = content;
      alg.modified = new Date();
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  deleteAlgorithm(id: string): void {
    this.algorithms.delete(id);
    this.saveToStorage();
    this.notifyListeners();
  }

  // Scoring Config CRUD operations
  addScoringConfig(name: string, config: Omit<ScoringConfig, 'id' | 'name' | 'created' | 'modified'>): ScoringConfig {
    const id = `scoring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const scoringConfig: ScoringConfig = {
      id,
      name,
      ...config,
      created: new Date(),
      modified: new Date(),
    };
    this.scoringConfigs.set(id, scoringConfig);
    this.saveToStorage();
    this.notifyListeners();
    return scoringConfig;
  }

  getScoringConfigs(): ScoringConfig[] {
    return Array.from(this.scoringConfigs.values()).sort((a, b) => 
      a.created.getTime() - b.created.getTime()
    );
  }

  getScoringConfig(id: string): ScoringConfig | undefined {
    return this.scoringConfigs.get(id);
  }

  deleteScoringConfig(id: string): void {
    this.scoringConfigs.delete(id);
    if (this.scoringState.configId === id) {
      this.scoringState = {
        configId: null,
        currentBudget: 0,
        operationsApplied: [],
      };
    }
    this.saveToStorage();
    this.notifyListeners();
  }

  // Scoring State operations
  activateScoringConfig(id: string): void {
    const config = this.scoringConfigs.get(id);
    if (config) {
      this.scoringState = {
        configId: id,
        currentBudget: config.initialBudget,
        operationsApplied: [],
      };
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  getScoringState(): ScoringState {
    return this.scoringState;
  }

  getActiveScoringConfig(): ScoringConfig | null {
    if (!this.scoringState.configId) return null;
    return this.scoringConfigs.get(this.scoringState.configId) || null;
  }

  // Calculate cost for an operation (considering combined operations)
  calculateOperationCost(operation: string): number {
    const config = this.getActiveScoringConfig();
    if (!config) return 0;

    // Check for combined operation discounts
    const recentOps = this.scoringState.operationsApplied.slice(-5).map(op => op.operation);
    
    for (const combo of config.combinedOperations) {
      const comboOps = [...combo.operations];
      const testOps = [...recentOps, operation];
      
      // Check if the combination matches
      let allMatch = true;
      for (const comboOp of comboOps) {
        const idx = testOps.indexOf(comboOp);
        if (idx === -1) {
          allMatch = false;
          break;
        }
        testOps.splice(idx, 1);
      }
      
      if (allMatch) {
        // Return the combined cost divided by number of operations
        return combo.cost / combo.operations.length;
      }
    }

    // Find base cost
    const opConfig = config.operations.find(op => op.operation === operation);
    return opConfig?.cost ?? 0;
  }

  // Apply an operation and deduct cost
  applyOperation(operation: string): { success: boolean; cost: number; remainingBudget: number } {
    const cost = this.calculateOperationCost(operation);
    
    if (this.scoringState.currentBudget < cost) {
      return {
        success: false,
        cost,
        remainingBudget: this.scoringState.currentBudget,
      };
    }

    this.scoringState.currentBudget -= cost;
    this.scoringState.operationsApplied.push({
      operation,
      cost,
      timestamp: new Date(),
    });
    this.saveToStorage();
    this.notifyListeners();

    return {
      success: true,
      cost,
      remainingBudget: this.scoringState.currentBudget,
    };
  }

  // Reset scoring state
  resetScoringState(): void {
    const config = this.getActiveScoringConfig();
    if (config) {
      this.scoringState = {
        configId: config.id,
        currentBudget: config.initialBudget,
        operationsApplied: [],
      };
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  // Subscribe to changes
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

// Singleton instance
export const algorithmManager = new AlgorithmManager();
