/**
 * Advanced Binary Metrics - 110+ measurable variables
 */

export interface AdvancedMetrics {
  // Basic Statistics
  totalBits: number;
  totalBytes: number;
  zeroCount: number;
  oneCount: number;
  zeroPercentage: number;
  onePercentage: number;
  bitDensity: number;
  byteAlignment: number;
  paddingBits: number;
  hammingWeight: number;
  populationCount: number;
  parity: 'even' | 'odd';
  checksum8bit: number;
  crc32: number;

  // Entropy & Randomness
  shannonEntropy: number;
  minEntropy: number;
  collisionEntropy: number;
  renyiEntropy: number;
  hartleyEntropy: number;
  kolmogorovComplexityEstimate: number;
  approximateEntropy: number;
  sampleEntropy: number;
  permutationEntropy: number;
  spectralEntropy: number;
  blockEntropy: number;
  conditionalEntropy: number;
  jointEntropy: number;
  mutualInformation: number;
  chiSquared: number;
  frequencyTestResult: number;
  runsTestResult: number;
  longestRunTest: number;
  serialCorrelation: number;
  birthdaySpacings: number;

  // Run Length Analysis
  meanRunLength0: number;
  meanRunLength1: number;
  maxRunLength0: number;
  maxRunLength1: number;
  minRunLength0: number;
  minRunLength1: number;
  medianRunLength0: number;
  medianRunLength1: number;
  runLengthVariance0: number;
  runLengthVariance1: number;

  // Pattern Analysis
  unique4BitPatterns: number;
  unique8BitPatterns: number;
  unique16BitPatterns: number;
  mostFrequentByte: number;
  leastFrequentByte: number;
  byteDistributionSkewness: number;
  byteDistributionKurtosis: number;
  alphabetSize: number;
  patternRegularityIndex: number;
  repetitionFactor: number;
  bigramDiversity: number;
  trigramDiversity: number;
  fourgramDiversity: number;
  lempelZivComplexity: number;
  compressionRatioEstimate: number;
  dictionarySizeEstimate: number;
  redundancyPercentage: number;

  // Transitions & Changes
  totalTransitions: number;
  transitionDensity: number;
  zeroToOneTransitions: number;
  oneToZeroTransitions: number;
  transitionRatio: number;
  transitionEntropy: number;
  edgeDensity: number;
  changeRatePerByte: number;

  // Periodicity & Correlation
  autocorrelationLag1: number;
  autocorrelationLag8: number;
  autocorrelationLag16: number;
  dominantPeriod: number;
  periodicityStrength: number;
  crossCorrelationScore: number;
  serialCorrelationCoefficient: number;
  durbinWatsonStatistic: number;
  spectralFlatness: number;
  spectralCentroid: number;
  spectralRolloff: number;
  spectralFlux: number;

  // Partition-Specific
  partitionCount: number;
  meanPartitionSize: number;
  partitionSizeVariance: number;
  smallestPartition: number;
  largestPartition: number;
  partitionEntropyVariance: number;
  interPartitionSimilarity: number;
  partitionBoundarySharpness: number;
  partitionHomogeneity: number;
  partitionComplexityScore: number;

  // Advanced Metrics
  lyapunovExponent: number;
  hurstExponent: number;
  fractalDimension: number;
  minimumDescriptionLength: number;
  algorithmicInformationContent: number;
  localComplexityMeasure: number;
  noiseLevelEstimate: number;
  signalToNoiseRatio: number;
  predictabilityIndex: number;
  informationDensity: number;

  // Byte-Level Analysis
  asciiPrintablePercentage: number;
  nullByteCount: number;
  highEntropyByteCount: number;
  lowEntropyByteCount: number;
  byteValueRange: number;
  byteValueMean: number;
  byteValueMedian: number;
  byteValueStdDev: number;
  bigramProbability: number;
  trigramProbability: number;
}

export class AdvancedMetricsCalculator {
  static calculate(bits: string, partitions?: Array<{ start: number; end: number; entropy: number }>): AdvancedMetrics {
    const bytes = this.bitsToBytes(bits);
    
    return {
      // Basic Statistics
      ...this.calculateBasicStats(bits, bytes),
      
      // Entropy & Randomness
      ...this.calculateEntropyMetrics(bits, bytes),
      
      // Run Length Analysis
      ...this.calculateRunLengthMetrics(bits),
      
      // Pattern Analysis
      ...this.calculatePatternMetrics(bits, bytes),
      
      // Transitions & Changes
      ...this.calculateTransitionMetrics(bits),
      
      // Periodicity & Correlation
      ...this.calculatePeriodicityMetrics(bits, bytes),
      
      // Partition-Specific
      ...this.calculatePartitionMetrics(partitions || []),
      
      // Advanced Metrics
      ...this.calculateAdvancedMetrics(bits, bytes),
      
      // Byte-Level Analysis
      ...this.calculateByteMetrics(bits, bytes),
    };
  }

  private static bitsToBytes(bits: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < bits.length; i += 8) {
      const byte = bits.substring(i, i + 8);
      if (byte.length === 8) {
        bytes.push(parseInt(byte, 2));
      }
    }
    return bytes;
  }

  private static calculateBasicStats(bits: string, bytes: number[]) {
    const zeroCount = bits.split('0').length - 1;
    const oneCount = bits.length - zeroCount;
    
    return {
      totalBits: bits.length,
      totalBytes: bytes.length,
      zeroCount,
      oneCount,
      zeroPercentage: (zeroCount / bits.length) * 100,
      onePercentage: (oneCount / bits.length) * 100,
      bitDensity: oneCount / bits.length,
      byteAlignment: bits.length % 8,
      paddingBits: bits.length % 8 === 0 ? 0 : 8 - (bits.length % 8),
      hammingWeight: oneCount,
      populationCount: oneCount,
      parity: (oneCount % 2 === 0 ? 'even' : 'odd') as 'even' | 'odd',
      checksum8bit: bytes.reduce((sum, b) => (sum + b) % 256, 0),
      crc32: this.calculateCRC32(bytes),
    };
  }

  private static calculateEntropyMetrics(bits: string, bytes: number[]) {
    const shannonEntropy = this.calculateShannonEntropy(bytes);
    
    return {
      shannonEntropy,
      minEntropy: this.calculateMinEntropy(bytes),
      collisionEntropy: this.calculateCollisionEntropy(bytes),
      renyiEntropy: this.calculateRenyiEntropy(bytes, 2),
      hartleyEntropy: Math.log2(new Set(bytes).size),
      kolmogorovComplexityEstimate: this.estimateKolmogorovComplexity(bits),
      approximateEntropy: this.calculateApproximateEntropy(bits, 2),
      sampleEntropy: this.calculateSampleEntropy(bits, 2, 0.2),
      permutationEntropy: this.calculatePermutationEntropy(bits, 3),
      spectralEntropy: this.calculateSpectralEntropy(bytes),
      blockEntropy: this.calculateBlockEntropy(bytes),
      conditionalEntropy: this.calculateConditionalEntropy(bytes),
      jointEntropy: shannonEntropy,
      mutualInformation: this.calculateMutualInformation(bytes),
      chiSquared: this.calculateChiSquared(bytes),
      frequencyTestResult: this.frequencyTest(bits),
      runsTestResult: this.runsTest(bits),
      longestRunTest: this.longestRunTest(bits),
      serialCorrelation: this.calculateSerialCorrelation(bits),
      birthdaySpacings: this.birthdaySpacingsTest(bytes),
    };
  }

  private static calculateRunLengthMetrics(bits: string) {
    const runs0 = this.getRuns(bits, '0');
    const runs1 = this.getRuns(bits, '1');
    
    return {
      meanRunLength0: runs0.length > 0 ? runs0.reduce((a, b) => a + b, 0) / runs0.length : 0,
      meanRunLength1: runs1.length > 0 ? runs1.reduce((a, b) => a + b, 0) / runs1.length : 0,
      maxRunLength0: runs0.length > 0 ? Math.max(...runs0) : 0,
      maxRunLength1: runs1.length > 0 ? Math.max(...runs1) : 0,
      minRunLength0: runs0.length > 0 ? Math.min(...runs0) : 0,
      minRunLength1: runs1.length > 0 ? Math.min(...runs1) : 0,
      medianRunLength0: this.median(runs0),
      medianRunLength1: this.median(runs1),
      runLengthVariance0: this.variance(runs0),
      runLengthVariance1: this.variance(runs1),
    };
  }

  private static calculatePatternMetrics(bits: string, bytes: number[]) {
    return {
      unique4BitPatterns: this.countUniquePatterns(bits, 4),
      unique8BitPatterns: new Set(bytes).size,
      unique16BitPatterns: this.countUniquePatterns(bits, 16),
      mostFrequentByte: this.mostFrequent(bytes),
      leastFrequentByte: this.leastFrequent(bytes),
      byteDistributionSkewness: this.calculateSkewness(bytes),
      byteDistributionKurtosis: this.calculateKurtosis(bytes),
      alphabetSize: new Set(bytes).size,
      patternRegularityIndex: this.calculatePatternRegularity(bits),
      repetitionFactor: this.calculateRepetitionFactor(bits),
      bigramDiversity: this.calculateNgramDiversity(bytes, 2),
      trigramDiversity: this.calculateNgramDiversity(bytes, 3),
      fourgramDiversity: this.calculateNgramDiversity(bytes, 4),
      lempelZivComplexity: this.calculateLempelZivComplexity(bits),
      compressionRatioEstimate: this.estimateCompressionRatio(bytes),
      dictionarySizeEstimate: this.estimateDictionarySize(bytes),
      redundancyPercentage: this.calculateRedundancy(bytes),
    };
  }

  private static calculateTransitionMetrics(bits: string) {
    let zeroToOne = 0;
    let oneToZero = 0;
    
    for (let i = 1; i < bits.length; i++) {
      if (bits[i - 1] === '0' && bits[i] === '1') zeroToOne++;
      if (bits[i - 1] === '1' && bits[i] === '0') oneToZero++;
    }
    
    const totalTransitions = zeroToOne + oneToZero;
    
    return {
      totalTransitions,
      transitionDensity: totalTransitions / (bits.length - 1),
      zeroToOneTransitions: zeroToOne,
      oneToZeroTransitions: oneToZero,
      transitionRatio: oneToZero > 0 ? zeroToOne / oneToZero : 0,
      transitionEntropy: this.calculateTransitionEntropy(bits),
      edgeDensity: totalTransitions / bits.length,
      changeRatePerByte: totalTransitions / Math.floor(bits.length / 8),
    };
  }

  private static calculatePeriodicityMetrics(bits: string, bytes: number[]) {
    return {
      autocorrelationLag1: this.calculateAutocorrelation(bits, 1),
      autocorrelationLag8: this.calculateAutocorrelation(bits, 8),
      autocorrelationLag16: this.calculateAutocorrelation(bits, 16),
      dominantPeriod: this.findDominantPeriod(bytes),
      periodicityStrength: this.calculatePeriodicityStrength(bytes),
      crossCorrelationScore: this.calculateCrossCorrelation(bits),
      serialCorrelationCoefficient: this.calculateSerialCorrelation(bits),
      durbinWatsonStatistic: this.calculateDurbinWatson(bytes),
      spectralFlatness: this.calculateSpectralFlatness(bytes),
      spectralCentroid: this.calculateSpectralCentroid(bytes),
      spectralRolloff: this.calculateSpectralRolloff(bytes),
      spectralFlux: this.calculateSpectralFlux(bytes),
    };
  }

  private static calculatePartitionMetrics(partitions: Array<{ start: number; end: number; entropy: number }>) {
    if (partitions.length === 0) {
      return {
        partitionCount: 0,
        meanPartitionSize: 0,
        partitionSizeVariance: 0,
        smallestPartition: 0,
        largestPartition: 0,
        partitionEntropyVariance: 0,
        interPartitionSimilarity: 0,
        partitionBoundarySharpness: 0,
        partitionHomogeneity: 0,
        partitionComplexityScore: 0,
      };
    }

    const sizes = partitions.map(p => p.end - p.start);
    const entropies = partitions.map(p => p.entropy);
    
    return {
      partitionCount: partitions.length,
      meanPartitionSize: sizes.reduce((a, b) => a + b, 0) / sizes.length,
      partitionSizeVariance: this.variance(sizes),
      smallestPartition: Math.min(...sizes),
      largestPartition: Math.max(...sizes),
      partitionEntropyVariance: this.variance(entropies),
      interPartitionSimilarity: this.calculatePartitionSimilarity(partitions),
      partitionBoundarySharpness: this.calculateBoundarySharpness(entropies),
      partitionHomogeneity: 1 - (this.variance(entropies) / Math.max(...entropies, 1)),
      partitionComplexityScore: partitions.length * this.variance(entropies),
    };
  }

  private static calculateAdvancedMetrics(bits: string, bytes: number[]) {
    return {
      lyapunovExponent: this.estimateLyapunovExponent(bits),
      hurstExponent: this.calculateHurstExponent(bytes),
      fractalDimension: this.calculateFractalDimension(bits),
      minimumDescriptionLength: this.estimateMDL(bytes),
      algorithmicInformationContent: this.estimateKolmogorovComplexity(bits),
      localComplexityMeasure: this.calculateLocalComplexity(bits),
      noiseLevelEstimate: this.estimateNoiseLevel(bytes),
      signalToNoiseRatio: this.calculateSNR(bytes),
      predictabilityIndex: this.calculatePredictability(bits),
      informationDensity: this.calculateInformationDensity(bytes),
    };
  }

  private static calculateByteMetrics(bits: string, bytes: number[]) {
    const printable = bytes.filter(b => b >= 32 && b <= 126).length;
    const nullBytes = bytes.filter(b => b === 0).length;
    
    return {
      asciiPrintablePercentage: (printable / bytes.length) * 100,
      nullByteCount: nullBytes,
      highEntropyByteCount: bytes.filter(b => this.byteEntropy(b) > 0.9).length,
      lowEntropyByteCount: bytes.filter(b => this.byteEntropy(b) < 0.3).length,
      byteValueRange: Math.max(...bytes) - Math.min(...bytes),
      byteValueMean: bytes.reduce((a, b) => a + b, 0) / bytes.length,
      byteValueMedian: this.median(bytes),
      byteValueStdDev: Math.sqrt(this.variance(bytes)),
      bigramProbability: this.calculateNgramProbability(bytes, 2),
      trigramProbability: this.calculateNgramProbability(bytes, 3),
    };
  }

  // Helper functions
  private static calculateShannonEntropy(bytes: number[]): number {
    const freq = new Map<number, number>();
    bytes.forEach(b => freq.set(b, (freq.get(b) || 0) + 1));
    
    let entropy = 0;
    freq.forEach(count => {
      const p = count / bytes.length;
      entropy -= p * Math.log2(p);
    });
    
    return entropy;
  }

  private static calculateMinEntropy(bytes: number[]): number {
    const freq = new Map<number, number>();
    bytes.forEach(b => freq.set(b, (freq.get(b) || 0) + 1));
    const maxFreq = Math.max(...freq.values());
    return -Math.log2(maxFreq / bytes.length);
  }

  private static calculateCollisionEntropy(bytes: number[]): number {
    const freq = new Map<number, number>();
    bytes.forEach(b => freq.set(b, (freq.get(b) || 0) + 1));
    
    let collisionProb = 0;
    freq.forEach(count => {
      const p = count / bytes.length;
      collisionProb += p * p;
    });
    
    return -Math.log2(collisionProb);
  }

  private static calculateRenyiEntropy(bytes: number[], alpha: number): number {
    const freq = new Map<number, number>();
    bytes.forEach(b => freq.set(b, (freq.get(b) || 0) + 1));
    
    let sum = 0;
    freq.forEach(count => {
      const p = count / bytes.length;
      sum += Math.pow(p, alpha);
    });
    
    return (1 / (1 - alpha)) * Math.log2(sum);
  }

  private static estimateKolmogorovComplexity(bits: string): number {
    // Simplified LZ77-based estimate
    const compressed = this.lz77Compress(bits);
    return compressed.length / bits.length;
  }

  private static lz77Compress(data: string): string {
    // Simplified LZ77 compression
    let result = '';
    let i = 0;
    while (i < data.length) {
      let matchLength = 0;
      let matchDistance = 0;
      
      for (let j = Math.max(0, i - 4096); j < i; j++) {
        let len = 0;
        while (len < 258 && i + len < data.length && data[j + len] === data[i + len]) {
          len++;
        }
        if (len > matchLength) {
          matchLength = len;
          matchDistance = i - j;
        }
      }
      
      if (matchLength > 2) {
        result += `[${matchDistance},${matchLength}]`;
        i += matchLength;
      } else {
        result += data[i];
        i++;
      }
    }
    return result;
  }

  private static calculateApproximateEntropy(bits: string, m: number): number {
    const n = bits.length;
    const patterns = new Map<string, number>();
    
    for (let i = 0; i <= n - m; i++) {
      const pattern = bits.substring(i, i + m);
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
    }
    
    let sum = 0;
    patterns.forEach(count => {
      const p = count / (n - m + 1);
      sum += p * Math.log(p);
    });
    
    return -sum;
  }

  private static calculateSampleEntropy(bits: string, m: number, r: number): number {
    const n = bits.length;
    let A = 0, B = 0;
    
    for (let i = 0; i < n - m; i++) {
      for (let j = i + 1; j < n - m; j++) {
        let match = true;
        for (let k = 0; k < m; k++) {
          if (bits[i + k] !== bits[j + k]) {
            match = false;
            break;
          }
        }
        if (match) B++;
        
        if (match && i < n - m - 1 && j < n - m - 1) {
          if (bits[i + m] === bits[j + m]) A++;
        }
      }
    }
    
    return B > 0 ? -Math.log(A / B) : 0;
  }

  private static calculatePermutationEntropy(bits: string, n: number): number {
    const permutations = new Map<string, number>();
    
    for (let i = 0; i <= bits.length - n; i++) {
      const segment = bits.substring(i, i + n);
      const indices = Array.from(segment).map((_, idx) => idx).sort((a, b) => segment[a].localeCompare(segment[b]));
      const pattern = indices.join('');
      permutations.set(pattern, (permutations.get(pattern) || 0) + 1);
    }
    
    let entropy = 0;
    const total = bits.length - n + 1;
    permutations.forEach(count => {
      const p = count / total;
      entropy -= p * Math.log2(p);
    });
    
    return entropy;
  }

  private static calculateSpectralEntropy(bytes: number[]): number {
    const fft = this.simpleFFT(bytes);
    const magnitudes = fft.map(c => Math.sqrt(c.real * c.real + c.imag * c.imag));
    const sum = magnitudes.reduce((a, b) => a + b, 0);
    
    let entropy = 0;
    magnitudes.forEach(mag => {
      if (mag > 0) {
        const p = mag / sum;
        entropy -= p * Math.log2(p);
      }
    });
    
    return entropy;
  }

  private static calculateBlockEntropy(bytes: number[]): number {
    const blockSize = 8;
    const blocks = [];
    
    for (let i = 0; i < bytes.length; i += blockSize) {
      const block = bytes.slice(i, i + blockSize);
      blocks.push(block.join(','));
    }
    
    const freq = new Map<string, number>();
    blocks.forEach(b => freq.set(b, (freq.get(b) || 0) + 1));
    
    let entropy = 0;
    freq.forEach(count => {
      const p = count / blocks.length;
      entropy -= p * Math.log2(p);
    });
    
    return entropy;
  }

  private static calculateConditionalEntropy(bytes: number[]): number {
    const pairs = new Map<string, number>();
    
    for (let i = 0; i < bytes.length - 1; i++) {
      const pair = `${bytes[i]},${bytes[i + 1]}`;
      pairs.set(pair, (pairs.get(pair) || 0) + 1);
    }
    
    const marginal = new Map<number, number>();
    bytes.forEach(b => marginal.set(b, (marginal.get(b) || 0) + 1));
    
    let entropy = 0;
    pairs.forEach((count, pair) => {
      const [first] = pair.split(',').map(Number);
      const pxy = count / (bytes.length - 1);
      const px = (marginal.get(first) || 0) / bytes.length;
      if (px > 0) {
        entropy -= pxy * Math.log2(pxy / px);
      }
    });
    
    return entropy;
  }

  private static calculateMutualInformation(bytes: number[]): number {
    const shannon = this.calculateShannonEntropy(bytes);
    const conditional = this.calculateConditionalEntropy(bytes);
    return shannon - conditional;
  }

  private static calculateChiSquared(bytes: number[]): number {
    const expected = bytes.length / 256;
    const freq = new Map<number, number>();
    bytes.forEach(b => freq.set(b, (freq.get(b) || 0) + 1));
    
    let chiSq = 0;
    for (let i = 0; i < 256; i++) {
      const observed = freq.get(i) || 0;
      chiSq += Math.pow(observed - expected, 2) / expected;
    }
    
    return chiSq;
  }

  private static frequencyTest(bits: string): number {
    const ones = bits.split('1').length - 1;
    const n = bits.length;
    const p = 0.5;
    const expected = n * p;
    const variance = n * p * (1 - p);
    return Math.abs(ones - expected) / Math.sqrt(variance);
  }

  private static runsTest(bits: string): number {
    let runs = 1;
    for (let i = 1; i < bits.length; i++) {
      if (bits[i] !== bits[i - 1]) runs++;
    }
    
    const n = bits.length;
    const ones = bits.split('1').length - 1;
    const pi = ones / n;
    const expectedRuns = 2 * n * pi * (1 - pi) + 1;
    const variance = 2 * n * pi * (1 - pi) * (2 * n * pi * (1 - pi) - 1) / n;
    
    return Math.abs(runs - expectedRuns) / Math.sqrt(variance);
  }

  private static longestRunTest(bits: string): number {
    const runs0 = this.getRuns(bits, '0');
    const runs1 = this.getRuns(bits, '1');
    const maxRun = Math.max(...runs0, ...runs1);
    const expected = Math.log2(bits.length);
    return maxRun / expected;
  }

  private static calculateSerialCorrelation(bits: string): number {
    let sum = 0;
    const n = bits.length;
    
    for (let i = 0; i < n - 1; i++) {
      const x = bits[i] === '1' ? 1 : 0;
      const y = bits[i + 1] === '1' ? 1 : 0;
      sum += x * y;
    }
    
    const ones = bits.split('1').length - 1;
    const p = ones / n;
    const expected = p * p * (n - 1);
    
    return (sum - expected) / Math.sqrt(expected);
  }

  private static birthdaySpacingsTest(bytes: number[]): number {
    const spacings = [];
    const seen = new Set<number>();
    
    for (let i = 0; i < bytes.length; i++) {
      if (seen.has(bytes[i])) {
        spacings.push(i);
      }
      seen.add(bytes[i]);
    }
    
    return spacings.length / bytes.length;
  }

  private static getRuns(bits: string, char: string): number[] {
    const runs: number[] = [];
    let currentRun = 0;
    
    for (let i = 0; i < bits.length; i++) {
      if (bits[i] === char) {
        currentRun++;
      } else if (currentRun > 0) {
        runs.push(currentRun);
        currentRun = 0;
      }
    }
    
    if (currentRun > 0) runs.push(currentRun);
    return runs;
  }

  private static countUniquePatterns(bits: string, size: number): number {
    const patterns = new Set<string>();
    for (let i = 0; i <= bits.length - size; i++) {
      patterns.add(bits.substring(i, i + size));
    }
    return patterns.size;
  }

  private static mostFrequent(arr: number[]): number {
    const freq = new Map<number, number>();
    arr.forEach(n => freq.set(n, (freq.get(n) || 0) + 1));
    let max = 0, val = 0;
    freq.forEach((count, num) => {
      if (count > max) {
        max = count;
        val = num;
      }
    });
    return val;
  }

  private static leastFrequent(arr: number[]): number {
    const freq = new Map<number, number>();
    arr.forEach(n => freq.set(n, (freq.get(n) || 0) + 1));
    let min = Infinity, val = 0;
    freq.forEach((count, num) => {
      if (count < min) {
        min = count;
        val = num;
      }
    });
    return val;
  }

  private static calculateSkewness(arr: number[]): number {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const stdDev = Math.sqrt(this.variance(arr));
    
    let sum = 0;
    arr.forEach(x => {
      sum += Math.pow((x - mean) / stdDev, 3);
    });
    
    return sum / arr.length;
  }

  private static calculateKurtosis(arr: number[]): number {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const stdDev = Math.sqrt(this.variance(arr));
    
    let sum = 0;
    arr.forEach(x => {
      sum += Math.pow((x - mean) / stdDev, 4);
    });
    
    return sum / arr.length - 3;
  }

  private static calculatePatternRegularity(bits: string): number {
    const windowSize = 16;
    const patterns = new Set<string>();
    
    for (let i = 0; i <= bits.length - windowSize; i++) {
      patterns.add(bits.substring(i, i + windowSize));
    }
    
    return patterns.size / (bits.length - windowSize + 1);
  }

  private static calculateRepetitionFactor(bits: string): number {
    let repetitions = 0;
    const windowSize = 8;
    
    for (let i = 0; i <= bits.length - windowSize * 2; i++) {
      const pattern = bits.substring(i, i + windowSize);
      const next = bits.substring(i + windowSize, i + windowSize * 2);
      if (pattern === next) repetitions++;
    }
    
    return repetitions / (bits.length - windowSize * 2 + 1);
  }

  private static calculateNgramDiversity(bytes: number[], n: number): number {
    const ngrams = new Set<string>();
    
    for (let i = 0; i <= bytes.length - n; i++) {
      const ngram = bytes.slice(i, i + n).join(',');
      ngrams.add(ngram);
    }
    
    return ngrams.size / (bytes.length - n + 1);
  }

  private static calculateLempelZivComplexity(bits: string): number {
    const patterns = new Set<string>();
    let i = 0;
    let pattern = '';
    
    while (i < bits.length) {
      pattern += bits[i];
      if (!patterns.has(pattern)) {
        patterns.add(pattern);
        pattern = '';
      }
      i++;
    }
    
    return patterns.size;
  }

  private static estimateCompressionRatio(bytes: number[]): number {
    const freq = new Map<number, number>();
    bytes.forEach(b => freq.set(b, (freq.get(b) || 0) + 1));
    
    let huffmanLength = 0;
    freq.forEach(count => {
      const p = count / bytes.length;
      huffmanLength += count * Math.ceil(-Math.log2(p));
    });
    
    return huffmanLength / (bytes.length * 8);
  }

  private static estimateDictionarySize(bytes: number[]): number {
    const patterns = new Set<string>();
    const windowSize = 4;
    
    for (let i = 0; i <= bytes.length - windowSize; i++) {
      patterns.add(bytes.slice(i, i + windowSize).join(','));
    }
    
    return patterns.size;
  }

  private static calculateRedundancy(bytes: number[]): number {
    const entropy = this.calculateShannonEntropy(bytes);
    const maxEntropy = 8;
    return ((maxEntropy - entropy) / maxEntropy) * 100;
  }

  private static calculateTransitionEntropy(bits: string): number {
    const transitions = new Map<string, number>();
    
    for (let i = 0; i < bits.length - 1; i++) {
      const trans = bits[i] + bits[i + 1];
      transitions.set(trans, (transitions.get(trans) || 0) + 1);
    }
    
    let entropy = 0;
    transitions.forEach(count => {
      const p = count / (bits.length - 1);
      entropy -= p * Math.log2(p);
    });
    
    return entropy;
  }

  private static calculateAutocorrelation(bits: string, lag: number): number {
    if (lag >= bits.length) return 0;
    
    let sum = 0;
    const n = bits.length - lag;
    
    for (let i = 0; i < n; i++) {
      const x = bits[i] === '1' ? 1 : 0;
      const y = bits[i + lag] === '1' ? 1 : 0;
      sum += x * y;
    }
    
    const ones = bits.split('1').length - 1;
    const p = ones / bits.length;
    const expected = p * p * n;
    
    return (sum - expected) / Math.sqrt(expected);
  }

  private static findDominantPeriod(bytes: number[]): number {
    const fft = this.simpleFFT(bytes);
    const magnitudes = fft.map(c => Math.sqrt(c.real * c.real + c.imag * c.imag));
    
    let maxMag = 0, maxIdx = 0;
    for (let i = 1; i < magnitudes.length / 2; i++) {
      if (magnitudes[i] > maxMag) {
        maxMag = magnitudes[i];
        maxIdx = i;
      }
    }
    
    return maxIdx > 0 ? bytes.length / maxIdx : 0;
  }

  private static calculatePeriodicityStrength(bytes: number[]): number {
    const fft = this.simpleFFT(bytes);
    const magnitudes = fft.map(c => Math.sqrt(c.real * c.real + c.imag * c.imag));
    const maxMag = Math.max(...magnitudes.slice(1, magnitudes.length / 2));
    const avgMag = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
    
    return maxMag / avgMag;
  }

  private static calculateCrossCorrelation(bits: string): number {
    const half = Math.floor(bits.length / 2);
    const first = bits.substring(0, half);
    const second = bits.substring(half, half * 2);
    
    let matches = 0;
    for (let i = 0; i < Math.min(first.length, second.length); i++) {
      if (first[i] === second[i]) matches++;
    }
    
    return matches / Math.min(first.length, second.length);
  }

  private static calculateDurbinWatson(bytes: number[]): number {
    let sumDiffSq = 0;
    let sumSq = 0;
    
    for (let i = 1; i < bytes.length; i++) {
      sumDiffSq += Math.pow(bytes[i] - bytes[i - 1], 2);
    }
    
    for (let i = 0; i < bytes.length; i++) {
      sumSq += bytes[i] * bytes[i];
    }
    
    return sumSq > 0 ? sumDiffSq / sumSq : 0;
  }

  private static calculateSpectralFlatness(bytes: number[]): number {
    const fft = this.simpleFFT(bytes);
    const magnitudes = fft.map(c => Math.sqrt(c.real * c.real + c.imag * c.imag));
    
    const geometricMean = Math.exp(magnitudes.reduce((sum, m) => sum + Math.log(m + 1e-10), 0) / magnitudes.length);
    const arithmeticMean = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
    
    return arithmeticMean > 0 ? geometricMean / arithmeticMean : 0;
  }

  private static calculateSpectralCentroid(bytes: number[]): number {
    const fft = this.simpleFFT(bytes);
    const magnitudes = fft.map(c => Math.sqrt(c.real * c.real + c.imag * c.imag));
    
    let weightedSum = 0;
    let sum = 0;
    
    for (let i = 0; i < magnitudes.length; i++) {
      weightedSum += i * magnitudes[i];
      sum += magnitudes[i];
    }
    
    return sum > 0 ? weightedSum / sum : 0;
  }

  private static calculateSpectralRolloff(bytes: number[]): number {
    const fft = this.simpleFFT(bytes);
    const magnitudes = fft.map(c => Math.sqrt(c.real * c.real + c.imag * c.imag));
    const totalEnergy = magnitudes.reduce((a, b) => a + b, 0);
    
    let cumulativeEnergy = 0;
    for (let i = 0; i < magnitudes.length; i++) {
      cumulativeEnergy += magnitudes[i];
      if (cumulativeEnergy >= 0.85 * totalEnergy) {
        return i / magnitudes.length;
      }
    }
    
    return 1;
  }

  private static calculateSpectralFlux(bytes: number[]): number {
    const windowSize = 64;
    let flux = 0;
    
    for (let i = 0; i < bytes.length - windowSize * 2; i += windowSize) {
      const window1 = bytes.slice(i, i + windowSize);
      const window2 = bytes.slice(i + windowSize, i + windowSize * 2);
      
      const fft1 = this.simpleFFT(window1);
      const fft2 = this.simpleFFT(window2);
      
      let diff = 0;
      for (let j = 0; j < Math.min(fft1.length, fft2.length); j++) {
        const mag1 = Math.sqrt(fft1[j].real * fft1[j].real + fft1[j].imag * fft1[j].imag);
        const mag2 = Math.sqrt(fft2[j].real * fft2[j].real + fft2[j].imag * fft2[j].imag);
        diff += Math.pow(mag2 - mag1, 2);
      }
      
      flux += Math.sqrt(diff);
    }
    
    return flux / Math.floor(bytes.length / windowSize);
  }

  private static calculatePartitionSimilarity(partitions: Array<{ start: number; end: number; entropy: number }>): number {
    if (partitions.length < 2) return 0;
    
    let totalSimilarity = 0;
    let comparisons = 0;
    
    for (let i = 0; i < partitions.length - 1; i++) {
      const diff = Math.abs(partitions[i].entropy - partitions[i + 1].entropy);
      totalSimilarity += 1 - Math.min(diff, 1);
      comparisons++;
    }
    
    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  private static calculateBoundarySharpness(entropies: number[]): number {
    if (entropies.length < 2) return 0;
    
    let maxChange = 0;
    for (let i = 0; i < entropies.length - 1; i++) {
      const change = Math.abs(entropies[i + 1] - entropies[i]);
      maxChange = Math.max(maxChange, change);
    }
    
    return maxChange;
  }

  private static estimateLyapunovExponent(bits: string): number {
    const n = Math.min(bits.length, 1000);
    let sum = 0;
    
    for (let i = 1; i < n; i++) {
      const x0 = bits[i - 1] === '1' ? 1 : 0;
      const x1 = bits[i] === '1' ? 1 : 0;
      const diff = Math.abs(x1 - x0);
      if (diff > 0) {
        sum += Math.log(diff);
      }
    }
    
    return sum / (n - 1);
  }

  private static calculateHurstExponent(bytes: number[]): number {
    const n = Math.min(bytes.length, 512);
    const mean = bytes.slice(0, n).reduce((a, b) => a + b, 0) / n;
    
    let cumSum = 0;
    const deviations = [];
    for (let i = 0; i < n; i++) {
      cumSum += bytes[i] - mean;
      deviations.push(cumSum);
    }
    
    const range = Math.max(...deviations) - Math.min(...deviations);
    const stdDev = Math.sqrt(this.variance(bytes.slice(0, n)));
    
    if (stdDev === 0) return 0.5;
    
    const rs = range / stdDev;
    return Math.log(rs) / Math.log(n);
  }

  private static calculateFractalDimension(bits: string): number {
    const scales = [2, 4, 8, 16, 32];
    const counts = [];
    
    for (const scale of scales) {
      let count = 0;
      for (let i = 0; i < bits.length - scale; i += scale) {
        const segment = bits.substring(i, i + scale);
        if (segment.includes('1')) count++;
      }
      counts.push(count);
    }
    
    // Linear regression on log-log plot
    const logScales = scales.map(s => Math.log(s));
    const logCounts = counts.map(c => Math.log(c + 1));
    
    const n = scales.length;
    const sumX = logScales.reduce((a, b) => a + b, 0);
    const sumY = logCounts.reduce((a, b) => a + b, 0);
    const sumXY = logScales.reduce((sum, x, i) => sum + x * logCounts[i], 0);
    const sumX2 = logScales.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return -slope;
  }

  private static estimateMDL(bytes: number[]): number {
    const entropy = this.calculateShannonEntropy(bytes);
    const uniqueBytes = new Set(bytes).size;
    return (entropy * bytes.length) + (uniqueBytes * Math.log2(256));
  }

  private static calculateLocalComplexity(bits: string): number {
    const windowSize = 32;
    let complexitySum = 0;
    let windows = 0;
    
    for (let i = 0; i <= bits.length - windowSize; i += windowSize) {
      const window = bits.substring(i, i + windowSize);
      const uniquePatterns = new Set<string>();
      
      for (let j = 0; j <= window.length - 4; j++) {
        uniquePatterns.add(window.substring(j, j + 4));
      }
      
      complexitySum += uniquePatterns.size / (window.length - 3);
      windows++;
    }
    
    return windows > 0 ? complexitySum / windows : 0;
  }

  private static estimateNoiseLevel(bytes: number[]): number {
    const mean = bytes.reduce((a, b) => a + b, 0) / bytes.length;
    let highFreqEnergy = 0;
    
    for (let i = 1; i < bytes.length; i++) {
      highFreqEnergy += Math.pow(bytes[i] - bytes[i - 1], 2);
    }
    
    return Math.sqrt(highFreqEnergy / (bytes.length - 1));
  }

  private static calculateSNR(bytes: number[]): number {
    const mean = bytes.reduce((a, b) => a + b, 0) / bytes.length;
    const signal = mean * mean;
    const noise = this.variance(bytes);
    
    return noise > 0 ? 10 * Math.log10(signal / noise) : 0;
  }

  private static calculatePredictability(bits: string): number {
    let correct = 0;
    
    for (let i = 2; i < bits.length; i++) {
      const predicted = bits[i - 1] === bits[i - 2] ? bits[i - 1] : (bits[i - 1] === '1' ? '0' : '1');
      if (predicted === bits[i]) correct++;
    }
    
    return correct / (bits.length - 2);
  }

  private static calculateInformationDensity(bytes: number[]): number {
    const entropy = this.calculateShannonEntropy(bytes);
    const maxEntropy = 8;
    return entropy / maxEntropy;
  }

  private static byteEntropy(byte: number): number {
    const bits = byte.toString(2).padStart(8, '0');
    const ones = bits.split('1').length - 1;
    const zeros = 8 - ones;
    
    if (ones === 0 || zeros === 0) return 0;
    
    const p1 = ones / 8;
    const p0 = zeros / 8;
    
    return -(p1 * Math.log2(p1) + p0 * Math.log2(p0));
  }

  private static calculateNgramProbability(bytes: number[], n: number): number {
    if (bytes.length < n) return 0;
    
    const ngrams = new Map<string, number>();
    const total = bytes.length - n + 1;
    
    for (let i = 0; i <= bytes.length - n; i++) {
      const ngram = bytes.slice(i, i + n).join(',');
      ngrams.set(ngram, (ngrams.get(ngram) || 0) + 1);
    }
    
    let maxProb = 0;
    ngrams.forEach(count => {
      maxProb = Math.max(maxProb, count / total);
    });
    
    return maxProb;
  }

  private static simpleFFT(data: number[]): Array<{ real: number; imag: number }> {
    const n = data.length;
    const result: Array<{ real: number; imag: number }> = [];
    
    for (let k = 0; k < n; k++) {
      let real = 0;
      let imag = 0;
      
      for (let t = 0; t < n; t++) {
        const angle = -2 * Math.PI * k * t / n;
        real += data[t] * Math.cos(angle);
        imag += data[t] * Math.sin(angle);
      }
      
      result.push({ real, imag });
    }
    
    return result;
  }

  private static calculateCRC32(bytes: number[]): number {
    let crc = 0xFFFFFFFF;
    
    for (const byte of bytes) {
      crc ^= byte;
      for (let i = 0; i < 8; i++) {
        crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
      }
    }
    
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  private static median(arr: number[]): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private static variance(arr: number[]): number {
    if (arr.length === 0) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / arr.length;
  }
}
