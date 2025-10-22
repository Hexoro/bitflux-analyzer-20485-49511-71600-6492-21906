/**
 * Preset Manager for saving and loading visualization settings
 */

export interface Preset {
  id: string;
  name: string;
  description: string;
  category: 'audio' | 'graph' | 'analysis';
  settings: Record<string, any>;
  created: Date;
}

export const BUILT_IN_PRESETS: Preset[] = [
  {
    id: 'crypto-analysis',
    name: 'Cryptography Analysis',
    description: 'Optimized for analyzing encrypted data and random number generators',
    category: 'analysis',
    settings: {
      metrics: ['shannonEntropy', 'chiSquared', 'frequencyTestResult', 'runsTestResult'],
      visualizations: ['entropy-heatmap', 'byte-distribution', 'autocorrelation'],
    },
    created: new Date(),
  },
  {
    id: 'audio-inspection',
    name: 'Audio File Inspection',
    description: 'For analyzing audio file formats and PCM data',
    category: 'audio',
    settings: {
      audioMode: 'pcm',
      visualizationMode: 'waveform',
      showSpectrogram: true,
    },
    created: new Date(),
  },
  {
    id: 'random-testing',
    name: 'Random Data Testing',
    description: 'Statistical tests for randomness validation',
    category: 'analysis',
    settings: {
      metrics: ['shannonEntropy', 'kolmogorovComplexityEstimate', 'serialCorrelation', 'birthdaySpacings'],
      tests: ['frequency', 'runs', 'longestRun', 'serial'],
    },
    created: new Date(),
  },
  {
    id: 'compressed-analysis',
    name: 'Compressed Data Analysis',
    description: 'Analyze compression efficiency and patterns',
    category: 'analysis',
    settings: {
      metrics: ['lempelZivComplexity', 'compressionRatioEstimate', 'redundancyPercentage'],
      visualizations: ['pattern-frequency', 'ngram-diversity'],
    },
    created: new Date(),
  },
  {
    id: 'executable-analysis',
    name: 'Executable Analysis',
    description: 'For analyzing binary executables and machine code',
    category: 'analysis',
    settings: {
      metrics: ['asciiPrintablePercentage', 'nullByteCount', 'byteDistributionSkewness'],
      visualizations: ['byte-heatmap', 'partition-entropy', 'boundary-detection'],
    },
    created: new Date(),
  },
  {
    id: 'network-packet',
    name: 'Network Packet Analysis',
    description: 'Analyze network traffic and packet patterns',
    category: 'analysis',
    settings: {
      metrics: ['patternRegularityIndex', 'periodicityStrength', 'transitionDensity'],
      visualizations: ['pattern-timeline', 'periodicity-spectrum'],
    },
    created: new Date(),
  },
];

export class PresetManager {
  private static STORAGE_KEY = 'binary-analyzer-presets';

  static getAll(): Preset[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    const custom = stored ? JSON.parse(stored) : [];
    return [...BUILT_IN_PRESETS, ...custom];
  }

  static getById(id: string): Preset | null {
    return this.getAll().find(p => p.id === id) || null;
  }

  static getByCategory(category: Preset['category']): Preset[] {
    return this.getAll().filter(p => p.category === category);
  }

  static save(preset: Omit<Preset, 'id' | 'created'>): Preset {
    const newPreset: Preset = {
      ...preset,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created: new Date(),
    };

    const stored = localStorage.getItem(this.STORAGE_KEY);
    const custom = stored ? JSON.parse(stored) : [];
    custom.push(newPreset);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(custom));

    return newPreset;
  }

  static delete(id: string): boolean {
    // Can't delete built-in presets
    if (BUILT_IN_PRESETS.find(p => p.id === id)) {
      return false;
    }

    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return false;

    const custom = JSON.parse(stored);
    const filtered = custom.filter((p: Preset) => p.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));

    return true;
  }

  static export(preset: Preset): void {
    const json = JSON.stringify(preset, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `preset-${preset.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  static async import(file: File): Promise<Preset> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const preset = JSON.parse(e.target?.result as string);
          const saved = this.save({
            name: preset.name,
            description: preset.description,
            category: preset.category,
            settings: preset.settings,
          });
          resolve(saved);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
}
