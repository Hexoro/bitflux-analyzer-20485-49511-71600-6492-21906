/**
 * Binary Model - Core data structure for binary file manipulation
 */

export interface BitRange {
  start: number;
  end: number;
}

export interface UndoAction {
  type: 'edit' | 'paste' | 'insert' | 'delete';
  range: BitRange;
  oldBits: string;
  newBits: string;
}

export class BinaryModel {
  private originalBits: string = '';
  private workingBits: string = '';
  private undoStack: UndoAction[] = [];
  private redoStack: UndoAction[] = [];
  private listeners: Set<() => void> = new Set();

  constructor(initialBits: string = '') {
    this.originalBits = initialBits;
    this.workingBits = initialBits;
  }

  // Get current working bits
  getBits(): string {
    return this.workingBits;
  }

  // Get original bits
  getOriginalBits(): string {
    return this.originalBits;
  }

  // Get bit at position
  getBit(index: number): string {
    return this.workingBits[index] || '0';
  }

  // Get length
  getLength(): number {
    return this.workingBits.length;
  }

  // Set bit at position
  setBit(index: number, value: '0' | '1'): void {
    if (index < 0 || index >= this.workingBits.length) return;
    
    const oldBit = this.workingBits[index];
    if (oldBit === value) return;

    this.pushUndo({
      type: 'edit',
      range: { start: index, end: index },
      oldBits: oldBit,
      newBits: value,
    });

    this.workingBits = 
      this.workingBits.substring(0, index) + 
      value + 
      this.workingBits.substring(index + 1);
    
    this.notifyListeners();
  }

  // Set multiple bits
  setBits(start: number, bits: string): void {
    if (start < 0 || start >= this.workingBits.length) return;
    
    const end = Math.min(start + bits.length - 1, this.workingBits.length - 1);
    const oldBits = this.workingBits.substring(start, end + 1);

    this.pushUndo({
      type: 'paste',
      range: { start, end },
      oldBits,
      newBits: bits,
    });

    this.workingBits = 
      this.workingBits.substring(0, start) + 
      bits + 
      this.workingBits.substring(start + bits.length);
    
    this.notifyListeners();
  }

  // Undo last action
  undo(): boolean {
    const action = this.undoStack.pop();
    if (!action) return false;

    this.redoStack.push(action);
    this.workingBits = 
      this.workingBits.substring(0, action.range.start) + 
      action.oldBits + 
      this.workingBits.substring(action.range.start + action.newBits.length);
    
    this.notifyListeners();
    return true;
  }

  // Redo last undone action
  redo(): boolean {
    const action = this.redoStack.pop();
    if (!action) return false;

    this.undoStack.push(action);
    this.workingBits = 
      this.workingBits.substring(0, action.range.start) + 
      action.newBits + 
      this.workingBits.substring(action.range.start + action.oldBits.length);
    
    this.notifyListeners();
    return true;
  }

  // Load new file
  loadBits(bits: string): void {
    this.originalBits = bits;
    this.workingBits = bits;
    this.undoStack = [];
    this.redoStack = [];
    this.notifyListeners();
  }

  // Reset to original
  reset(): void {
    this.workingBits = this.originalBits;
    this.undoStack = [];
    this.redoStack = [];
    this.notifyListeners();
  }

  // Save working as original
  commit(): void {
    this.originalBits = this.workingBits;
    this.undoStack = [];
    this.redoStack = [];
    this.notifyListeners();
  }

  // Subscribe to changes
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Private methods
  private pushUndo(action: UndoAction): void {
    this.undoStack.push(action);
    this.redoStack = []; // Clear redo stack on new action
    
    // Limit undo stack size
    if (this.undoStack.length > 100) {
      this.undoStack.shift();
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Utility: Generate random bits
  static generateRandom(length: number, probability: number = 0.5): string {
    let bits = '';
    for (let i = 0; i < length; i++) {
      bits += Math.random() < probability ? '1' : '0';
    }
    return bits;
  }

  // Utility: Load from file (text format: only 0s and 1s)
  static fromTextFile(content: string): string {
    return content.replace(/[^01]/g, '');
  }

  // Utility: Load from binary file (each byte becomes 8 bits)
  static fromBinaryFile(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let bits = '';
    for (const byte of bytes) {
      bits += byte.toString(2).padStart(8, '0');
    }
    return bits;
  }

  // Utility: Export to binary file
  static toBinaryFile(bits: string): Uint8Array {
    const paddedBits = bits.padEnd(Math.ceil(bits.length / 8) * 8, '0');
    const bytes = new Uint8Array(paddedBits.length / 8);
    
    for (let i = 0; i < bytes.length; i++) {
      const byte = paddedBits.substring(i * 8, i * 8 + 8);
      bytes[i] = parseInt(byte, 2);
    }
    
    return new Uint8Array(bytes);
  }
}
