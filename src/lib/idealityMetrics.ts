/**
 * File Ideality Metrics - Analyzes repeating sequences in binary data
 */

export interface IdealityResult {
  windowSize: number;
  repeatingCount: number;
  totalBits: number;
  idealityPercentage: number;
}

export class IdealityMetrics {
  /**
   * Calculate file ideality for a specific window size
   * Ideality = (number of bits in repeating sequences / total bits) * 100
   * 
   * A repeating sequence is a pattern that occurs consecutively
   * e.g., 1010 is 10+10 (repeating), but 100110 is not
   */
  static calculateIdeality(
    bits: string,
    windowSize: number,
    startIndex: number = 0,
    endIndex?: number
  ): IdealityResult {
    const end = endIndex ?? bits.length - 1;
    const section = bits.substring(startIndex, end + 1);
    
    if (section.length < windowSize * 2) {
      return {
        windowSize,
        repeatingCount: 0,
        totalBits: section.length,
        idealityPercentage: 0,
      };
    }

    let repeatingCount = 0;
    let i = 0;

    while (i <= section.length - windowSize * 2) {
      const pattern = section.substring(i, i + windowSize);
      const nextPattern = section.substring(i + windowSize, i + windowSize * 2);
      
      if (pattern === nextPattern) {
        // Found a repeating sequence
        let repetitions = 2;
        let currentPos = i + windowSize * 2;
        
        // Check for more repetitions
        while (currentPos + windowSize <= section.length) {
          const testPattern = section.substring(currentPos, currentPos + windowSize);
          if (testPattern === pattern) {
            repetitions++;
            currentPos += windowSize;
          } else {
            break;
          }
        }
        
        // Count all bits in the repeating sequence
        repeatingCount += repetitions * windowSize;
        i = currentPos; // Skip past the repeating sequence
      } else {
        i++; // Move to next position
      }
    }

    const idealityPercentage = Math.floor((repeatingCount / section.length) * 100);

    return {
      windowSize,
      repeatingCount,
      totalBits: section.length,
      idealityPercentage,
    };
  }

  /**
   * Calculate ideality for all window sizes from 2 to half of file size
   */
  static calculateAllIdealities(
    bits: string,
    startIndex: number = 0,
    endIndex?: number
  ): IdealityResult[] {
    const end = endIndex ?? bits.length - 1;
    const sectionLength = end - startIndex + 1;
    const maxWindowSize = Math.floor(sectionLength / 2);
    
    if (maxWindowSize < 2) {
      return [];
    }

    const results: IdealityResult[] = [];
    
    for (let windowSize = 2; windowSize <= maxWindowSize; windowSize++) {
      const result = this.calculateIdeality(bits, windowSize, startIndex, endIndex);
      results.push(result);
    }

    return results;
  }

  /**
   * Get top N window sizes with highest ideality
   */
  static getTopIdealityWindows(
    bits: string,
    topN: number = 10,
    startIndex: number = 0,
    endIndex?: number
  ): IdealityResult[] {
    const allResults = this.calculateAllIdealities(bits, startIndex, endIndex);
    
    return allResults
      .sort((a, b) => b.idealityPercentage - a.idealityPercentage)
      .slice(0, topN);
  }
}
