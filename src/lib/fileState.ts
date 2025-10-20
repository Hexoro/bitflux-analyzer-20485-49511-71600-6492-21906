/**
 * File State - Manages all state for a single binary file
 */

import { BinaryModel } from './binaryModel';
import { BinaryStats, BinaryMetrics } from './binaryMetrics';
import { HistoryManager, HistoryEntry } from './historyManager';
import { PartitionManager, Partition, Boundary } from './partitionManager';

export interface HistoryGroup {
  id: string;
  type: string;
  count: number;
  firstTimestamp: Date;
  lastTimestamp: Date;
  entries: HistoryEntry[];
  expanded: boolean;
}

export class FileState {
  public model: BinaryModel;
  public historyManager: HistoryManager;
  public partitionManager: PartitionManager;
  public stats: BinaryStats | null = null;
  public sequenceHighlights: Array<{ start: number; end: number; color: string }> = [];
  private listeners: Set<() => void> = new Set();

  constructor(initialBits: string) {
    this.model = new BinaryModel(initialBits);
    this.historyManager = new HistoryManager();
    this.partitionManager = new PartitionManager();
    
    // Subscribe to model changes
    this.model.subscribe(() => {
      this.updateStats();
      this.notifyListeners();
    });

    // Initial stats
    if (initialBits.length > 0) {
      this.updateStats();
      this.historyManager.addEntry(initialBits, 'File created');
    }
  }

  updateStats(): void {
    const bits = this.model.getBits();
    if (bits.length > 0) {
      this.stats = BinaryMetrics.analyze(bits);
    } else {
      this.stats = null;
    }
  }

  addToHistory(description: string): void {
    this.historyManager.addEntry(this.model.getBits(), description);
  }

  getPartitions(): Partition[] {
    const boundaries = this.partitionManager.getBoundaries();
    if (boundaries.length === 0) return [];
    return this.partitionManager.createPartitions(this.model.getBits());
  }

  getBoundaries(): Boundary[] {
    return this.partitionManager.getBoundaries();
  }

  getHighlightRanges(): Array<{ start: number; end: number; color: string }> {
    const boundaryRanges = this.partitionManager.getHighlightRanges();
    return [...this.sequenceHighlights, ...boundaryRanges];
  }

  getHistoryGroups(): HistoryGroup[] {
    const entries = this.historyManager.getEntries();
    const groups: HistoryGroup[] = [];
    let currentGroup: HistoryGroup | null = null;

    for (const entry of entries) {
      const type = this.getHistoryType(entry.description);
      
      if (!currentGroup || currentGroup.type !== type) {
        // Start new group
        currentGroup = {
          id: `group-${groups.length}`,
          type,
          count: 1,
          firstTimestamp: entry.timestamp,
          lastTimestamp: entry.timestamp,
          entries: [entry],
          expanded: false,
        };
        groups.push(currentGroup);
      } else {
        // Add to existing group
        currentGroup.count++;
        currentGroup.lastTimestamp = entry.timestamp;
        currentGroup.entries.push(entry);
      }
    }

    return groups;
  }

  private getHistoryType(description: string): string {
    const lower = description.toLowerCase();
    if (lower.includes('boundary')) return 'Boundary';
    if (lower.includes('transform') || lower.includes('invert') || lower.includes('reverse') || 
        lower.includes('shift') || lower.includes('xor') || lower.includes('pad')) return 'Transformation';
    if (lower.includes('edit')) return 'Edit';
    if (lower.includes('generated')) return 'Generate';
    if (lower.includes('loaded') || lower.includes('file created')) return 'Load';
    return 'Other';
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}
