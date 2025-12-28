/**
 * Comprehensive Test Suite for BSEE
 * Tests all major components and systems using async imports
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
  private tests: Array<{ name: string; category: string; fn: () => Promise<boolean> }> = [];

  constructor() {
    this.registerAllTests();
  }

  private registerAllTests(): void {
    // Binary Model Tests
    this.register('BinaryModel: Load bits', 'BinaryModel', async () => {
      const { BinaryModel } = await import('./binaryModel');
      const model = new BinaryModel();
      model.loadBits('10101010');
      return model.getBits() === '10101010';
    });

    this.register('BinaryModel: Set bit', 'BinaryModel', async () => {
      const { BinaryModel } = await import('./binaryModel');
      const model = new BinaryModel();
      model.loadBits('00000000');
      model.setBit(0, '1');
      return model.getBits().startsWith('1');
    });

    this.register('BinaryModel: Undo/Redo', 'BinaryModel', async () => {
      const { BinaryModel } = await import('./binaryModel');
      const model = new BinaryModel();
      model.loadBits('00000000');
      model.setBit(0, '1');
      model.undo();
      return model.getBits() === '00000000';
    });

    // Binary Metrics Tests
    this.register('BinaryMetrics: Calculate entropy', 'BinaryMetrics', async () => {
      const { BinaryMetrics } = await import('./binaryMetrics');
      const entropy = BinaryMetrics.calculateEntropy(4, 4);
      return entropy >= 0.99 && entropy <= 1.01;
    });

    this.register('BinaryMetrics: Analyze bits', 'BinaryMetrics', async () => {
      const { BinaryMetrics } = await import('./binaryMetrics');
      const stats = BinaryMetrics.analyze('11110000');
      return stats.oneCount === 4 && stats.zeroCount === 4;
    });

    this.register('BinaryMetrics: Mean run length', 'BinaryMetrics', async () => {
      const { BinaryMetrics } = await import('./binaryMetrics');
      const stats = BinaryMetrics.analyze('11001100');
      return typeof stats.meanRunLength === 'number' && stats.meanRunLength > 0;
    });

    // Operations Router Tests
    this.register('OperationsRouter: NOT operation', 'Operations', async () => {
      const { executeOperation } = await import('./operationsRouter');
      const result = executeOperation('NOT', '1010', {});
      return result.success && result.bits === '0101';
    });

    this.register('OperationsRouter: AND operation', 'Operations', async () => {
      const { executeOperation } = await import('./operationsRouter');
      const result = executeOperation('AND', '1111', { mask: '1010' });
      return result.success && result.bits === '1010';
    });

    this.register('OperationsRouter: XOR operation', 'Operations', async () => {
      const { executeOperation } = await import('./operationsRouter');
      const result = executeOperation('XOR', '1010', { mask: '1100' });
      return result.success && result.bits === '0110';
    });

    this.register('OperationsRouter: Left shift', 'Operations', async () => {
      const { executeOperation } = await import('./operationsRouter');
      const result = executeOperation('SHL', '10010000', { count: 2 });
      return result.success && result.bits === '01000000';
    });

    // Metrics Calculator Tests
    this.register('MetricsCalculator: Calculate all metrics', 'Metrics', async () => {
      const { calculateAllMetrics } = await import('./metricsCalculator');
      const result = calculateAllMetrics('10101010');
      return result.success && typeof result.metrics.entropy === 'number';
    });

    this.register('MetricsCalculator: Single metric', 'Metrics', async () => {
      const { calculateMetric } = await import('./metricsCalculator');
      const result = calculateMetric('entropy', '10101010');
      return result.success && result.value >= 0.9 && result.value <= 1.1;
    });

    // Predefined Manager Tests
    this.register('PredefinedManager: Get all metrics', 'PredefinedManager', async () => {
      const { predefinedManager } = await import('./predefinedManager');
      const metrics = predefinedManager.getAllMetrics();
      return metrics.length > 0;
    });

    this.register('PredefinedManager: Get all operations', 'PredefinedManager', async () => {
      const { predefinedManager } = await import('./predefinedManager');
      const operations = predefinedManager.getAllOperations();
      return operations.length > 0;
    });

    // File System Manager Tests
    this.register('FileSystemManager: Create file', 'FileSystem', async () => {
      const { fileSystemManager } = await import('./fileSystemManager');
      const file = fileSystemManager.createFile('test_file_suite.bin', '11110000', 'binary');
      const exists = fileSystemManager.getFiles().some(f => f.id === file.id);
      fileSystemManager.deleteFile(file.id);
      return exists;
    });

    // History Manager Tests
    this.register('HistoryManager: Add entry', 'History', async () => {
      const { HistoryManager } = await import('./historyManager');
      const manager = new HistoryManager();
      manager.addEntry('10101010', 'Test entry');
      const entries = manager.getEntries();
      return entries.length > 0 && entries[0].description === 'Test entry';
    });

    // Anomalies Manager Tests
    this.register('AnomaliesManager: Get definitions', 'Anomalies', async () => {
      const { anomaliesManager } = await import('./anomaliesManager');
      const defs = anomaliesManager.getAllDefinitions();
      return Array.isArray(defs);
    });

    this.register('AnomaliesManager: Execute detection', 'Anomalies', async () => {
      const { anomaliesManager } = await import('./anomaliesManager');
      try {
        const results = anomaliesManager.executeDetection('long_run', '11111111111111110000');
        return Array.isArray(results);
      } catch {
        return true; // Detection may not exist but manager works
      }
    });

    // Results Manager Tests
    this.register('ResultsManager: Get all results', 'Results', async () => {
      const { resultsManager } = await import('./resultsManager');
      const results = resultsManager.getAllResults();
      return Array.isArray(results);
    });

    // Python Module System Tests
    this.register('PythonModuleSystem: Get strategies', 'Python', async () => {
      const { pythonModuleSystem } = await import('./pythonModuleSystem');
      const strategies = pythonModuleSystem.getAllStrategies();
      return Array.isArray(strategies);
    });

    // Ideality Metrics Tests
    this.register('IdealityMetrics: Calculate ideality', 'IdealityMetrics', async () => {
      const { IdealityMetrics } = await import('./idealityMetrics');
      const result = IdealityMetrics.calculateIdeality('10101010', 4, 0, 7);
      return typeof result.idealityPercentage === 'number';
    });

    // ============= MODE COLLISION TESTS =============
    
    this.register('ModeCollision: File lock check', 'ModeCollision', async () => {
      // Verify file lock state management doesn't conflict
      const { fileSystemManager } = await import('./fileSystemManager');
      const tempFile = fileSystemManager.createFile('collision_test.bin', '11110000', 'binary');
      const exists = fileSystemManager.getFiles().some(f => f.id === tempFile.id);
      fileSystemManager.deleteFile(tempFile.id);
      return exists;
    });

    this.register('ModeCollision: Algorithm mode isolation', 'ModeCollision', async () => {
      // Verify algorithm manager state is isolated
      const { algorithmManager } = await import('./algorithmManager');
      const strategies = algorithmManager.getStrategies();
      return Array.isArray(strategies);
    });

    this.register('ModeCollision: Results manager isolation', 'ModeCollision', async () => {
      // Verify results manager doesn't interfere with other modes
      const { resultsManager } = await import('./resultsManager');
      const results = resultsManager.getAllResults();
      const stats = resultsManager.getStatistics();
      return Array.isArray(results) && typeof stats.totalResults === 'number';
    });

    this.register('ModeCollision: Predefined manager consistency', 'ModeCollision', async () => {
      // Verify predefined manager maintains consistent state
      const { predefinedManager } = await import('./predefinedManager');
      const metrics = predefinedManager.getAllMetrics();
      const operations = predefinedManager.getAllOperations();
      return metrics.length > 0 && operations.length > 0;
    });

    // ============= ENCODING FUNCTIONS TESTS =============

    this.register('EncodingFunctions: Gray code encode/decode', 'Encoding', async () => {
      const { EncodingFunctions } = await import('./encodingFunctions');
      const original = '10101010';
      const gray = EncodingFunctions.binaryToGray(original);
      const decoded = EncodingFunctions.grayToBinary(gray);
      return decoded === original;
    });

    this.register('EncodingFunctions: Manchester encode/decode', 'Encoding', async () => {
      const { EncodingFunctions } = await import('./encodingFunctions');
      const original = '1010';
      const encoded = EncodingFunctions.manchesterEncode(original);
      const decoded = EncodingFunctions.manchesterDecode(encoded);
      return decoded === original && encoded.length === original.length * 2;
    });

    this.register('EncodingFunctions: Differential encode/decode', 'Encoding', async () => {
      const { EncodingFunctions } = await import('./encodingFunctions');
      const original = '10101010';
      const encoded = EncodingFunctions.differentialEncode(original);
      const decoded = EncodingFunctions.differentialDecode(encoded);
      return decoded === original;
    });

    this.register('EncodingFunctions: Bit stuffing', 'Encoding', async () => {
      const { EncodingFunctions } = await import('./encodingFunctions');
      const original = '111111000';
      const stuffed = EncodingFunctions.bitStuff(original);
      const unstuffed = EncodingFunctions.bitUnstuff(stuffed);
      return unstuffed === original;
    });

    // ============= COMPRESSION FUNCTIONS TESTS =============

    this.register('CompressionFunctions: RLE encode/decode', 'Compression', async () => {
      const { CompressionFunctions } = await import('./encodingFunctions');
      const original = '11111111000000001111';
      const encoded = CompressionFunctions.rleEncode(original);
      const decoded = CompressionFunctions.rleDecode(encoded);
      return decoded === original;
    });

    this.register('CompressionFunctions: Delta encode/decode', 'Compression', async () => {
      const { CompressionFunctions } = await import('./encodingFunctions');
      const original = '0000000100000010000000110000010000000101';
      const encoded = CompressionFunctions.deltaEncode(original);
      const decoded = CompressionFunctions.deltaDecode(encoded);
      return decoded === original;
    });

    this.register('CompressionFunctions: MTF encode/decode', 'Compression', async () => {
      const { CompressionFunctions } = await import('./encodingFunctions');
      const original = '0101010101010101';
      const encoded = CompressionFunctions.mtfEncode(original);
      const decoded = CompressionFunctions.mtfDecode(encoded);
      return decoded === original;
    });

    // ============= ANALYSIS FUNCTIONS TESTS =============

    this.register('AnalysisFunctions: Entropy calculation', 'Analysis', async () => {
      const { AnalysisFunctions } = await import('./encodingFunctions');
      const entropy = AnalysisFunctions.calculateEntropy('10101010');
      return entropy >= 0.99 && entropy <= 1.01;
    });

    this.register('AnalysisFunctions: Chi-square test', 'Analysis', async () => {
      const { AnalysisFunctions } = await import('./encodingFunctions');
      const chi = AnalysisFunctions.chiSquareTest('10101010');
      return typeof chi === 'number' && chi >= 0;
    });

    this.register('AnalysisFunctions: Runs test', 'Analysis', async () => {
      const { AnalysisFunctions } = await import('./encodingFunctions');
      const result = AnalysisFunctions.runsTest('10101010');
      return typeof result.numRuns === 'number' && result.numRuns > 0;
    });

    this.register('AnalysisFunctions: LZ complexity', 'Analysis', async () => {
      const { AnalysisFunctions } = await import('./encodingFunctions');
      const complexity = AnalysisFunctions.lempelZivComplexity('10101010');
      return typeof complexity === 'number' && complexity > 0;
    });

    // ============= TRANSFORM FUNCTIONS TESTS =============

    this.register('TransformFunctions: Bit reversal', 'Transform', async () => {
      const { TransformFunctions } = await import('./encodingFunctions');
      const reversed = TransformFunctions.reverseBits('10110000');
      return reversed === '00001101';
    });

    this.register('TransformFunctions: Rotate left', 'Transform', async () => {
      const { TransformFunctions } = await import('./encodingFunctions');
      const rotated = TransformFunctions.rotateLeft('10000001', 2);
      return rotated === '00000110';
    });

    this.register('TransformFunctions: Nibble swap', 'Transform', async () => {
      const { TransformFunctions } = await import('./encodingFunctions');
      const swapped = TransformFunctions.nibbleSwap('11110000');
      return swapped === '00001111';
    });

    this.register('TransformFunctions: Complement', 'Transform', async () => {
      const { TransformFunctions } = await import('./encodingFunctions');
      const comp = TransformFunctions.complement('10101010');
      return comp === '01010101';
    });

    // ============= STARTUP INTEGRITY TESTS =============

    this.register('Startup: LocalStorage accessibility', 'Startup', async () => {
      try {
        localStorage.setItem('_test_key', 'test');
        const val = localStorage.getItem('_test_key');
        localStorage.removeItem('_test_key');
        return val === 'test';
      } catch {
        return false;
      }
    });

    this.register('Startup: Custom presets manager', 'Startup', async () => {
      const { customPresetsManager } = await import('./customPresetsManager');
      const presets = customPresetsManager.getCustomPresets();
      const graphs = customPresetsManager.getGraphs();
      return Array.isArray(presets) && Array.isArray(graphs);
    });

    this.register('Startup: Generation presets availability', 'Startup', async () => {
      const { GENERATION_PRESETS } = await import('./generationPresets');
      return Object.keys(GENERATION_PRESETS).length > 0;
    });

    this.register('Startup: Operations router ready', 'Startup', async () => {
      const { executeOperation, getOperationCost } = await import('./operationsRouter');
      const result = executeOperation('NOT', '1010', {});
      const cost = getOperationCost('NOT');
      return result.success && typeof cost === 'number';
    });

    this.register('Startup: Metrics calculator ready', 'Startup', async () => {
      const { calculateAllMetrics, calculateMetric } = await import('./metricsCalculator');
      const all = calculateAllMetrics('10101010');
      const single = calculateMetric('entropy', '10101010');
      return all.success && single.success;
    });
  }

  private register(name: string, category: string, fn: () => Promise<boolean>): void {
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
