/**
 * Anomalies Manager - Manages custom anomaly definitions
 * Allows adding custom anomaly detection code via Backend mode
 */

export interface AnomalyDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  minLength: number;
  enabled: boolean;
  detectFn: string; // JavaScript function code as string
}

const STORAGE_KEY = 'bsee_anomaly_definitions';

const DEFAULT_ANOMALIES: AnomalyDefinition[] = [
  {
    id: 'palindrome',
    name: 'Palindrome',
    description: 'Detects palindromic bit sequences',
    category: 'Pattern',
    severity: 'medium',
    minLength: 5,
    enabled: true,
    detectFn: `function detect(bits, minLength) {
  const results = [];
  for (let i = 0; i < bits.length; i++) {
    let len = 1;
    while (i - len >= 0 && i + len < bits.length && bits[i - len] === bits[i + len]) {
      len++;
    }
    if (len * 2 - 1 >= minLength) {
      results.push({ position: i - len + 1, length: len * 2 - 1 });
    }
  }
  return results;
}`,
  },
  {
    id: 'repeating_pattern',
    name: 'Repeating Pattern',
    description: 'Detects sequences that repeat consecutively',
    category: 'Pattern',
    severity: 'medium',
    minLength: 4,
    enabled: true,
    detectFn: `function detect(bits, minLength) {
  const results = [];
  for (let patternLen = minLength; patternLen <= 20; patternLen++) {
    for (let i = 0; i <= bits.length - patternLen * 3; i++) {
      const pattern = bits.substring(i, i + patternLen);
      let repeats = 1;
      let pos = i + patternLen;
      while (pos + patternLen <= bits.length && bits.substring(pos, pos + patternLen) === pattern) {
        repeats++;
        pos += patternLen;
      }
      if (repeats >= 3) {
        results.push({ position: i, length: patternLen * repeats, pattern, repeats });
      }
    }
  }
  return results;
}`,
  },
  {
    id: 'alternating',
    name: 'Alternating Sequence',
    description: 'Detects alternating 0101... or 1010... patterns',
    category: 'Pattern',
    severity: 'low',
    minLength: 8,
    enabled: true,
    detectFn: `function detect(bits, minLength) {
  const results = [];
  let start = 0;
  let length = 1;
  for (let i = 1; i < bits.length; i++) {
    if (bits[i] !== bits[i - 1]) {
      length++;
    } else {
      if (length >= minLength) {
        results.push({ position: start, length });
      }
      start = i;
      length = 1;
    }
  }
  if (length >= minLength) {
    results.push({ position: start, length });
  }
  return results;
}`,
  },
  {
    id: 'long_run',
    name: 'Long Run',
    description: 'Detects long sequences of consecutive identical bits',
    category: 'Run',
    severity: 'high',
    minLength: 10,
    enabled: true,
    detectFn: `function detect(bits, minLength) {
  const results = [];
  let currentBit = bits[0];
  let start = 0;
  let length = 1;
  for (let i = 1; i < bits.length; i++) {
    if (bits[i] === currentBit) {
      length++;
    } else {
      if (length >= minLength) {
        results.push({ position: start, length, bit: currentBit });
      }
      currentBit = bits[i];
      start = i;
      length = 1;
    }
  }
  if (length >= minLength) {
    results.push({ position: start, length, bit: currentBit });
  }
  return results;
}`,
  },
  {
    id: 'sparse_region',
    name: 'Sparse Region',
    description: 'Detects regions with extremely low or high bit density',
    category: 'Density',
    severity: 'medium',
    minLength: 64,
    enabled: true,
    detectFn: `function detect(bits, windowSize) {
  const results = [];
  for (let i = 0; i <= bits.length - windowSize; i += windowSize / 2) {
    const window = bits.substring(i, i + windowSize);
    const ones = (window.match(/1/g) || []).length;
    const onesPercent = (ones / windowSize) * 100;
    if (onesPercent < 15 || onesPercent > 85) {
      results.push({ position: i, length: windowSize, density: onesPercent });
    }
  }
  return results;
}`,
  },
  {
    id: 'byte_misalignment',
    name: 'Byte Misalignment',
    description: 'Detects when data is not aligned to byte boundaries',
    category: 'Structure',
    severity: 'low',
    minLength: 1,
    enabled: true,
    detectFn: `function detect(bits, minLength) {
  const results = [];
  if (bits.length % 8 !== 0) {
    results.push({ position: bits.length - (bits.length % 8), length: bits.length % 8 });
  }
  return results;
}`,
  },
];

class AnomaliesManager {
  private definitions: AnomalyDefinition[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.definitions = JSON.parse(data);
      } else {
        this.definitions = [...DEFAULT_ANOMALIES];
        this.saveToStorage();
      }
    } catch (e) {
      console.error('Failed to load anomaly definitions:', e);
      this.definitions = [...DEFAULT_ANOMALIES];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.definitions));
    } catch (e) {
      console.error('Failed to save anomaly definitions:', e);
    }
  }

  getAllDefinitions(): AnomalyDefinition[] {
    return [...this.definitions];
  }

  getEnabledDefinitions(): AnomalyDefinition[] {
    return this.definitions.filter(d => d.enabled);
  }

  getDefinition(id: string): AnomalyDefinition | undefined {
    return this.definitions.find(d => d.id === id);
  }

  addDefinition(definition: Omit<AnomalyDefinition, 'id'>): AnomalyDefinition {
    const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newDef: AnomalyDefinition = { ...definition, id };
    this.definitions.push(newDef);
    this.saveToStorage();
    this.notifyListeners();
    return newDef;
  }

  updateDefinition(id: string, updates: Partial<AnomalyDefinition>): void {
    const index = this.definitions.findIndex(d => d.id === id);
    if (index !== -1) {
      this.definitions[index] = { ...this.definitions[index], ...updates };
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  deleteDefinition(id: string): void {
    this.definitions = this.definitions.filter(d => d.id !== id);
    this.saveToStorage();
    this.notifyListeners();
  }

  toggleEnabled(id: string): void {
    const def = this.definitions.find(d => d.id === id);
    if (def) {
      def.enabled = !def.enabled;
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  resetToDefaults(): void {
    this.definitions = [...DEFAULT_ANOMALIES];
    this.saveToStorage();
    this.notifyListeners();
  }

  getCategories(): string[] {
    return [...new Set(this.definitions.map(d => d.category))];
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(l => l());
  }

  /**
   * Execute an anomaly detection function on binary data
   */
  executeDetection(id: string, bits: string): Array<{ position: number; length: number; [key: string]: any }> {
    const def = this.definitions.find(d => d.id === id);
    if (!def || !def.enabled) return [];

    try {
      // Create a safe function from the stored code
      const detectFn = new Function('bits', 'minLength', `
        ${def.detectFn}
        return detect(bits, minLength);
      `);
      return detectFn(bits, def.minLength) || [];
    } catch (e) {
      console.error(`Error executing anomaly detection "${def.name}":`, e);
      return [];
    }
  }
}

export const anomaliesManager = new AnomaliesManager();
