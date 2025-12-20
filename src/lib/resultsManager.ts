/**
 * Results Manager - LocalStorage-based results database with bookmarking
 */

export interface TransformationStep {
  index: number;
  operation: string;
  params?: Record<string, any>;
  beforeBits: string;
  afterBits: string;
  metrics: Record<string, number>;
  timestamp: number;
  duration: number;

  // Optional richer info (for Player/highlights)
  bitRanges?: { start: number; end: number }[];
  cost?: number;
}

export interface ExecutionResultV2 {
  id: string;
  strategyId: string;
  strategyName: string;
  startTime: number;
  endTime: number;
  duration: number;

  // Optional file linkage (backwards compatible with old stored results)
  sourceFileId?: string;
  sourceFileName?: string;
  resultFileId?: string;

  // Data snapshots
  initialBits: string;
  finalBits: string;
  initialMetrics: Record<string, number>;
  finalMetrics: Record<string, number>;

  // Transformations
  steps: TransformationStep[];

  // Benchmarks
  benchmarks: {
    cpuTime: number;
    peakMemory: number;
    operationCount: number;
    avgStepDuration: number;
    totalCost: number;
  };

  // Files used
  filesUsed: {
    algorithm: string;
    scoring: string;
    policy: string;
  };

  // Status
  status: 'completed' | 'failed' | 'cancelled';
  error?: string;

  // Bookmarking
  bookmarked: boolean;
  tags: string[];
  notes: string;
}

const STORAGE_KEY = 'bitwise_results_v2';
const MAX_RESULTS = 100; // Limit to prevent localStorage overflow

class ResultsManager {
  private results: Map<string, ExecutionResultV2> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        parsed.forEach((r: ExecutionResultV2) => {
          this.results.set(r.id, r);
        });
      }
    } catch (error) {
      console.error('Failed to load results:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const results = Array.from(this.results.values())
        .sort((a, b) => b.startTime - a.startTime)
        .slice(0, MAX_RESULTS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
    } catch (error) {
      console.error('Failed to save results:', error);
    }
  }

  createResult(partial: Omit<ExecutionResultV2, 'id' | 'bookmarked' | 'tags' | 'notes'>): ExecutionResultV2 {
    const id = `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const result: ExecutionResultV2 = {
      ...partial,
      id,
      bookmarked: false,
      tags: [],
      notes: '',
    };
    this.results.set(id, result);
    this.saveToStorage();
    this.notifyListeners();
    return result;
  }

  getResult(id: string): ExecutionResultV2 | undefined {
    return this.results.get(id);
  }

  getAllResults(): ExecutionResultV2[] {
    return Array.from(this.results.values())
      .sort((a, b) => b.startTime - a.startTime);
  }

  getBookmarkedResults(): ExecutionResultV2[] {
    return this.getAllResults().filter(r => r.bookmarked);
  }

  getResultsByDate(startDate: Date, endDate: Date): ExecutionResultV2[] {
    const start = startDate.getTime();
    const end = endDate.getTime();
    return this.getAllResults().filter(r => r.startTime >= start && r.startTime <= end);
  }

  getResultsByTag(tag: string): ExecutionResultV2[] {
    return this.getAllResults().filter(r => r.tags.includes(tag));
  }

  // Bookmarking
  toggleBookmark(id: string): void {
    const result = this.results.get(id);
    if (result) {
      result.bookmarked = !result.bookmarked;
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  addTag(id: string, tag: string): void {
    const result = this.results.get(id);
    if (result && !result.tags.includes(tag)) {
      result.tags.push(tag);
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  removeTag(id: string, tag: string): void {
    const result = this.results.get(id);
    if (result) {
      result.tags = result.tags.filter(t => t !== tag);
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  updateNotes(id: string, notes: string): void {
    const result = this.results.get(id);
    if (result) {
      result.notes = notes;
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  deleteResult(id: string): void {
    this.results.delete(id);
    this.saveToStorage();
    this.notifyListeners();
  }

  clearAll(): void {
    this.results.clear();
    this.saveToStorage();
    this.notifyListeners();
  }

  // Export
  exportToCSV(result: ExecutionResultV2): string {
    const lines: string[] = [];
    
    // Header
    lines.push('Step,Operation,Parameters,Before Size,After Size,Duration (ms),Metrics');
    
    // Steps
    result.steps.forEach(step => {
      const metricsStr = Object.entries(step.metrics)
        .map(([k, v]) => `${k}=${v.toFixed(4)}`)
        .join('; ');
      lines.push([
        step.index,
        step.operation,
        JSON.stringify(step.params || {}),
        step.beforeBits.length,
        step.afterBits.length,
        step.duration.toFixed(2),
        `"${metricsStr}"`,
      ].join(','));
    });
    
    // Summary
    lines.push('');
    lines.push('Summary');
    lines.push(`Strategy,${result.strategyName}`);
    lines.push(`Duration,${result.duration}ms`);
    lines.push(`Operations,${result.benchmarks.operationCount}`);
    lines.push(`Initial Size,${result.initialBits.length} bits`);
    lines.push(`Final Size,${result.finalBits.length} bits`);
    lines.push(`Status,${result.status}`);
    
    return lines.join('\n');
  }

  exportFullReport(result: ExecutionResultV2): string {
    return JSON.stringify({
      ...result,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  // Statistics
  getStatistics(): {
    totalResults: number;
    bookmarkedCount: number;
    avgDuration: number;
    successRate: number;
    uniqueTags: string[];
  } {
    const results = this.getAllResults();
    const completed = results.filter(r => r.status === 'completed');
    const allTags = new Set<string>();
    results.forEach(r => r.tags.forEach(t => allTags.add(t)));

    return {
      totalResults: results.length,
      bookmarkedCount: results.filter(r => r.bookmarked).length,
      avgDuration: completed.length > 0 
        ? completed.reduce((sum, r) => sum + r.duration, 0) / completed.length 
        : 0,
      successRate: results.length > 0 
        ? (completed.length / results.length) * 100 
        : 0,
      uniqueTags: Array.from(allTags),
    };
  }

  // Subscribe
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(l => l());
  }
}

export const resultsManager = new ResultsManager();
