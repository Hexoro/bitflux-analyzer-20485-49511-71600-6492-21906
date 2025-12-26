/**
 * Comprehensive Test Suite for BSEE
 * Tests all major components and systems
 */

export interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  message: string;
  duration: number;
}

export interface TestSuiteResults {
  totalTests: number;
  passed: number;
  failed: number;
  duration: number;
  results: TestResult[];
  timestamp: Date;
}

class TestSuite {
  private tests: Array<{ name: string; category: string; fn: () => Promise<boolean> | boolean }> = [];

  constructor() {
    this.registerAllTests();
  }

  private registerAllTests(): void {
    // Binary Model Tests
    this.register('BinaryModel: Load bits', 'BinaryModel', () => {
      const { BinaryModel } = require('./binaryModel');
      const model = new BinaryModel();
      model.loadBits('10101010');
      return model.getBits() === '10101010';
    });

    this.register('BinaryModel: Set bit', 'BinaryModel', () => {
      const { BinaryModel } = require('./binaryModel');
      const model = new BinaryModel();
      model.loadBits('00000000');
      model.setBit(0, '1');
      return model.getBits().startsWith('1');
    });

    this.register('BinaryModel: Undo/Redo', 'BinaryModel', () => {
      const { BinaryModel } = require('./binaryModel');
      const model = new BinaryModel();
      model.loadBits('00000000');
      model.setBit(0, '1');
      model.undo();
      return model.getBits() === '00000000';
    });

    // Binary Metrics Tests
    this.register('BinaryMetrics: Calculate entropy', 'BinaryMetrics', () => {
      const { BinaryMetrics } = require('./binaryMetrics');
      const entropy = BinaryMetrics.calculateEntropy(4, 4);
      return entropy >= 0.99 && entropy <= 1.01;
    });

    this.register('BinaryMetrics: Analyze bits', 'BinaryMetrics', () => {
      const { BinaryMetrics } = require('./binaryMetrics');
      const stats = BinaryMetrics.analyze('11110000');
      return stats.oneCount === 4 && stats.zeroCount === 4;
    });

    this.register('BinaryMetrics: Count runs', 'BinaryMetrics', () => {
      const { BinaryMetrics } = require('./binaryMetrics');
      const stats = BinaryMetrics.analyze('11001100');
      return stats.runCount === 4;
    });

    // Operations Router Tests
    this.register('OperationsRouter: NOT operation', 'Operations', () => {
      const { executeOperation } = require('./operationsRouter');
      const result = executeOperation('NOT', '1010', {});
      return result.success && result.bits === '0101';
    });

    this.register('OperationsRouter: AND operation', 'Operations', () => {
      const { executeOperation } = require('./operationsRouter');
      const result = executeOperation('AND', '1111', { mask: '1010' });
      return result.success && result.bits === '1010';
    });

    this.register('OperationsRouter: XOR operation', 'Operations', () => {
      const { executeOperation } = require('./operationsRouter');
      const result = executeOperation('XOR', '1010', { mask: '1100' });
      return result.success && result.bits === '0110';
    });

    this.register('OperationsRouter: Left shift', 'Operations', () => {
      const { executeOperation } = require('./operationsRouter');
      const result = executeOperation('SHL', '10010000', { count: 2 });
      return result.success && result.bits === '01000000';
    });

    // Metrics Calculator Tests
    this.register('MetricsCalculator: Calculate all metrics', 'Metrics', () => {
      const { calculateAllMetrics } = require('./metricsCalculator');
      const result = calculateAllMetrics('10101010');
      return result.success && typeof result.metrics.entropy === 'number';
    });

    this.register('MetricsCalculator: Single metric', 'Metrics', () => {
      const { calculateMetric } = require('./metricsCalculator');
      const result = calculateMetric('entropy', '10101010');
      return result.success && result.value >= 0.9 && result.value <= 1.1;
    });

    // Predefined Manager Tests
    this.register('PredefinedManager: Get all metrics', 'PredefinedManager', () => {
      const { predefinedManager } = require('./predefinedManager');
      const metrics = predefinedManager.getAllMetrics();
      return metrics.length > 0;
    });

    this.register('PredefinedManager: Get all operations', 'PredefinedManager', () => {
      const { predefinedManager } = require('./predefinedManager');
      const operations = predefinedManager.getAllOperations();
      return operations.length > 0;
    });

    // File System Manager Tests
    this.register('FileSystemManager: Create file', 'FileSystem', () => {
      const { fileSystemManager } = require('./fileSystemManager');
      const file = fileSystemManager.createFile('test_file.bin', '11110000', 'binary');
      const exists = fileSystemManager.getFiles().some(f => f.id === file.id);
      fileSystemManager.deleteFile(file.id);
      return exists;
    });

    // History Manager Tests
    this.register('HistoryManager: Add entry', 'History', () => {
      const { HistoryManager } = require('./historyManager');
      const manager = new HistoryManager();
      manager.addEntry('10101010', 'Test entry');
      const entries = manager.getEntries();
      return entries.length > 0 && entries[0].description === 'Test entry';
    });

    // Anomalies Manager Tests
    this.register('AnomaliesManager: Get definitions', 'Anomalies', () => {
      const { anomaliesManager } = require('./anomaliesManager');
      const defs = anomaliesManager.getAllDefinitions();
      return defs.length > 0;
    });

    this.register('AnomaliesManager: Execute detection', 'Anomalies', () => {
      const { anomaliesManager } = require('./anomaliesManager');
      const results = anomaliesManager.executeDetection('long_run', '11111111111111110000');
      return Array.isArray(results);
    });

    // Results Manager Tests
    this.register('ResultsManager: Get all results', 'Results', () => {
      const { resultsManager } = require('./resultsManager');
      const results = resultsManager.getAllResults();
      return Array.isArray(results);
    });

    // Python Module System Tests
    this.register('PythonModuleSystem: Get strategies', 'Python', () => {
      const { pythonModuleSystem } = require('./pythonModuleSystem');
      const strategies = pythonModuleSystem.getAllStrategies();
      return Array.isArray(strategies);
    });

    // Ideality Metrics Tests
    this.register('IdealityMetrics: Calculate ideality', 'IdealityMetrics', () => {
      const { IdealityMetrics } = require('./idealityMetrics');
      const result = IdealityMetrics.calculateIdeality('10101010', 4, 0, 7);
      return typeof result.idealityPercentage === 'number';
    });
  }

  private register(name: string, category: string, fn: () => Promise<boolean> | boolean): void {
    this.tests.push({ name, category, fn });
  }

  async runAll(): Promise<TestSuiteResults> {
    const startTime = performance.now();
    const results: TestResult[] = [];

    for (const test of this.tests) {
      const testStart = performance.now();
      let passed = false;
      let message = '';

      try {
        const result = await test.fn();
        passed = result === true;
        message = passed ? 'Passed' : 'Test returned false';
      } catch (error) {
        passed = false;
        message = (error as Error).message || 'Unknown error';
      }

      results.push({
        name: test.name,
        category: test.category,
        passed,
        message,
        duration: performance.now() - testStart,
      });
    }

    return {
      totalTests: this.tests.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      duration: performance.now() - startTime,
      results,
      timestamp: new Date(),
    };
  }

  getCategories(): string[] {
    return [...new Set(this.tests.map(t => t.category))];
  }
}

export const testSuite = new TestSuite();
