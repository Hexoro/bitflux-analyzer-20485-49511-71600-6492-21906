/**
 * History Manager - Track all edits to binary data
 */

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  description: string;
  bits: string;
  stats?: {
    totalBits: number;
    zeroCount: number;
    oneCount: number;
    entropy: number;
  };
}

export class HistoryManager {
  private entries: HistoryEntry[] = [];
  private maxEntries = 100;

  addEntry(bits: string, description: string): void {
    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      description,
      bits,
      stats: this.calculateQuickStats(bits),
    };

    this.entries.unshift(entry);
    
    // Limit history size
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(0, this.maxEntries);
    }
  }

  getEntries(): HistoryEntry[] {
    return [...this.entries];
  }

  getEntry(id: string): HistoryEntry | null {
    return this.entries.find(e => e.id === id) || null;
  }

  clear(): void {
    this.entries = [];
  }

  private calculateQuickStats(bits: string) {
    const zeroCount = bits.split('0').length - 1;
    const oneCount = bits.length - zeroCount;
    const p0 = bits.length > 0 ? zeroCount / bits.length : 0;
    const p1 = bits.length > 0 ? oneCount / bits.length : 0;
    
    let entropy = 0;
    if (p0 > 0) entropy -= p0 * Math.log2(p0);
    if (p1 > 0) entropy -= p1 * Math.log2(p1);

    return {
      totalBits: bits.length,
      zeroCount,
      oneCount,
      entropy,
    };
  }
}
