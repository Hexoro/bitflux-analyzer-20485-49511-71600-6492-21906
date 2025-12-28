/**
 * Encoding and Compression Functions Library
 * 100+ predefined functions for use in strategies
 */

// ============= ENCODING FUNCTIONS =============

export const EncodingFunctions = {
  // Gray Code
  binaryToGray: (bits: string): string => {
    if (!bits.length) return '';
    let gray = bits[0];
    for (let i = 1; i < bits.length; i++) {
      gray += bits[i - 1] === bits[i] ? '0' : '1';
    }
    return gray;
  },

  grayToBinary: (gray: string): string => {
    if (!gray.length) return '';
    let binary = gray[0];
    for (let i = 1; i < gray.length; i++) {
      binary += binary[i - 1] === gray[i] ? '0' : '1';
    }
    return binary;
  },

  // Manchester Encoding
  manchesterEncode: (bits: string): string => {
    let result = '';
    for (const bit of bits) {
      result += bit === '0' ? '01' : '10';
    }
    return result;
  },

  manchesterDecode: (bits: string): string => {
    let result = '';
    for (let i = 0; i < bits.length; i += 2) {
      const pair = bits.slice(i, i + 2);
      result += pair === '01' ? '0' : pair === '10' ? '1' : '?';
    }
    return result;
  },

  // Differential Encoding
  differentialEncode: (bits: string): string => {
    if (!bits.length) return '';
    let result = bits[0];
    let prev = bits[0];
    for (let i = 1; i < bits.length; i++) {
      const curr = bits[i] === prev ? '0' : '1';
      result += curr;
      prev = bits[i];
    }
    return result;
  },

  differentialDecode: (bits: string): string => {
    if (!bits.length) return '';
    let result = bits[0];
    let prev = bits[0];
    for (let i = 1; i < bits.length; i++) {
      const curr = bits[i] === '0' ? prev : (prev === '0' ? '1' : '0');
      result += curr;
      prev = curr;
    }
    return result;
  },

  // NRZI Encoding
  nrziEncode: (bits: string): string => {
    if (!bits.length) return '';
    let result = '';
    let level = '0';
    for (const bit of bits) {
      if (bit === '1') level = level === '0' ? '1' : '0';
      result += level;
    }
    return result;
  },

  nrziDecode: (bits: string): string => {
    if (!bits.length) return '';
    let result = '';
    let prev = '0';
    for (const bit of bits) {
      result += bit === prev ? '0' : '1';
      prev = bit;
    }
    return result;
  },

  // Hamming Code (7,4)
  hammingEncode74: (data: string): string => {
    const result: string[] = [];
    for (let i = 0; i < data.length; i += 4) {
      const d = data.slice(i, i + 4).padEnd(4, '0').split('').map(Number);
      const p1 = d[0] ^ d[1] ^ d[3];
      const p2 = d[0] ^ d[2] ^ d[3];
      const p4 = d[1] ^ d[2] ^ d[3];
      result.push(`${p1}${p2}${d[0]}${p4}${d[1]}${d[2]}${d[3]}`);
    }
    return result.join('');
  },

  hammingDecode74: (code: string): string => {
    const result: string[] = [];
    for (let i = 0; i < code.length; i += 7) {
      const c = code.slice(i, i + 7).padEnd(7, '0').split('').map(Number);
      // Calculate syndrome
      const s1 = c[0] ^ c[2] ^ c[4] ^ c[6];
      const s2 = c[1] ^ c[2] ^ c[5] ^ c[6];
      const s4 = c[3] ^ c[4] ^ c[5] ^ c[6];
      const errorPos = s1 + s2 * 2 + s4 * 4;
      if (errorPos > 0 && errorPos <= 7) {
        c[errorPos - 1] = 1 - c[errorPos - 1];
      }
      result.push(`${c[2]}${c[4]}${c[5]}${c[6]}`);
    }
    return result.join('');
  },

  // Base64-like encoding (6-bit to printable)
  base64Encode: (bits: string): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    for (let i = 0; i < bits.length; i += 6) {
      const chunk = bits.slice(i, i + 6).padEnd(6, '0');
      const index = parseInt(chunk, 2);
      result += chars[index];
    }
    return result;
  },

  // Bit stuffing (HDLC-like)
  bitStuff: (bits: string): string => {
    let result = '';
    let ones = 0;
    for (const bit of bits) {
      result += bit;
      if (bit === '1') {
        ones++;
        if (ones === 5) {
          result += '0';
          ones = 0;
        }
      } else {
        ones = 0;
      }
    }
    return result;
  },

  bitUnstuff: (bits: string): string => {
    let result = '';
    let ones = 0;
    for (let i = 0; i < bits.length; i++) {
      const bit = bits[i];
      if (ones === 5 && bit === '0') {
        ones = 0;
        continue;
      }
      result += bit;
      ones = bit === '1' ? ones + 1 : 0;
    }
    return result;
  },

  // ZigZag encoding (for signed integers)
  zigzagEncode: (bits: string): string => {
    const bytes: string[] = [];
    for (let i = 0; i < bits.length; i += 8) {
      const byte = bits.slice(i, i + 8).padEnd(8, '0');
      const signed = parseInt(byte, 2);
      const zigzag = (signed >> 7) ^ (signed << 1);
      bytes.push((zigzag & 0xFF).toString(2).padStart(8, '0'));
    }
    return bytes.join('');
  },

  zigzagDecode: (bits: string): string => {
    const bytes: string[] = [];
    for (let i = 0; i < bits.length; i += 8) {
      const byte = bits.slice(i, i + 8).padEnd(8, '0');
      const zigzag = parseInt(byte, 2);
      const signed = (zigzag >>> 1) ^ (-(zigzag & 1));
      bytes.push((signed & 0xFF).toString(2).padStart(8, '0'));
    }
    return bytes.join('');
  },

  // Interleave bits from two halves
  interleave: (bits: string): string => {
    const half = Math.floor(bits.length / 2);
    const a = bits.slice(0, half);
    const b = bits.slice(half);
    let result = '';
    for (let i = 0; i < half; i++) {
      result += (a[i] || '0') + (b[i] || '0');
    }
    if (bits.length % 2 === 1) result += bits[bits.length - 1];
    return result;
  },

  deinterleave: (bits: string): string => {
    let a = '', b = '';
    for (let i = 0; i < bits.length; i += 2) {
      a += bits[i] || '';
      b += bits[i + 1] || '';
    }
    return a + b;
  },
};

// ============= COMPRESSION FUNCTIONS =============

export const CompressionFunctions = {
  // Run-Length Encoding
  rleEncode: (bits: string): string => {
    if (!bits.length) return '';
    let result = '';
    let currentBit = bits[0];
    let count = 1;

    for (let i = 1; i < bits.length; i++) {
      if (bits[i] === currentBit && count < 255) {
        count++;
      } else {
        result += count.toString(2).padStart(8, '0') + currentBit;
        currentBit = bits[i];
        count = 1;
      }
    }
    result += count.toString(2).padStart(8, '0') + currentBit;
    return result;
  },

  rleDecode: (encoded: string): string => {
    let result = '';
    for (let i = 0; i < encoded.length; i += 9) {
      const countBits = encoded.slice(i, i + 8);
      const bit = encoded[i + 8] || '0';
      const count = parseInt(countBits, 2);
      result += bit.repeat(count);
    }
    return result;
  },

  // Delta Encoding
  deltaEncode: (bits: string): string => {
    if (!bits.length) return '';
    const bytes: number[] = [];
    for (let i = 0; i < bits.length; i += 8) {
      bytes.push(parseInt(bits.slice(i, i + 8).padEnd(8, '0'), 2));
    }
    
    let result = bytes[0].toString(2).padStart(8, '0');
    for (let i = 1; i < bytes.length; i++) {
      const delta = (bytes[i] - bytes[i - 1] + 256) % 256;
      result += delta.toString(2).padStart(8, '0');
    }
    return result;
  },

  deltaDecode: (encoded: string): string => {
    const bytes: number[] = [];
    for (let i = 0; i < encoded.length; i += 8) {
      bytes.push(parseInt(encoded.slice(i, i + 8).padEnd(8, '0'), 2));
    }
    
    let result = bytes[0].toString(2).padStart(8, '0');
    let prev = bytes[0];
    for (let i = 1; i < bytes.length; i++) {
      prev = (prev + bytes[i]) % 256;
      result += prev.toString(2).padStart(8, '0');
    }
    return result;
  },

  // Move-to-Front Transform
  mtfEncode: (bits: string): string => {
    const bytes: number[] = [];
    for (let i = 0; i < bits.length; i += 8) {
      bytes.push(parseInt(bits.slice(i, i + 8).padEnd(8, '0'), 2));
    }

    const alphabet = Array.from({ length: 256 }, (_, i) => i);
    let result = '';

    for (const byte of bytes) {
      const index = alphabet.indexOf(byte);
      result += index.toString(2).padStart(8, '0');
      alphabet.splice(index, 1);
      alphabet.unshift(byte);
    }
    return result;
  },

  mtfDecode: (encoded: string): string => {
    const indices: number[] = [];
    for (let i = 0; i < encoded.length; i += 8) {
      indices.push(parseInt(encoded.slice(i, i + 8).padEnd(8, '0'), 2));
    }

    const alphabet = Array.from({ length: 256 }, (_, i) => i);
    let result = '';

    for (const index of indices) {
      const byte = alphabet[index];
      result += byte.toString(2).padStart(8, '0');
      alphabet.splice(index, 1);
      alphabet.unshift(byte);
    }
    return result;
  },

  // Burrows-Wheeler Transform (simplified)
  bwtEncode: (bits: string): string => {
    const blockSize = 8;
    const blocks: string[] = [];
    for (let i = 0; i < bits.length; i += blockSize) {
      blocks.push(bits.slice(i, i + blockSize).padEnd(blockSize, '0'));
    }

    const result: string[] = [];
    for (const block of blocks) {
      const rotations = [];
      for (let i = 0; i < block.length; i++) {
        rotations.push(block.slice(i) + block.slice(0, i));
      }
      rotations.sort();
      result.push(rotations.map(r => r[r.length - 1]).join(''));
    }
    return result.join('');
  },

  // LZ77-style simple compression
  lz77Compress: (bits: string): { compressed: string; ratio: number } => {
    const windowSize = 32;
    const lookaheadSize = 16;
    let result = '';
    let i = 0;

    while (i < bits.length) {
      let bestMatch = { offset: 0, length: 0 };
      const windowStart = Math.max(0, i - windowSize);
      
      for (let j = windowStart; j < i; j++) {
        let matchLen = 0;
        while (matchLen < lookaheadSize && 
               i + matchLen < bits.length && 
               bits[j + matchLen] === bits[i + matchLen]) {
          matchLen++;
        }
        if (matchLen > bestMatch.length) {
          bestMatch = { offset: i - j, length: matchLen };
        }
      }

      if (bestMatch.length >= 3) {
        result += '1' + bestMatch.offset.toString(2).padStart(5, '0') + 
                  bestMatch.length.toString(2).padStart(4, '0');
        i += bestMatch.length;
      } else {
        result += '0' + bits[i];
        i++;
      }
    }

    return { 
      compressed: result, 
      ratio: bits.length > 0 ? result.length / bits.length : 1 
    };
  },

  // Huffman-style frequency analysis
  getHuffmanStats: (bits: string): { frequencies: Record<string, number>; entropy: number } => {
    const byteFreq: Record<string, number> = {};
    for (let i = 0; i < bits.length; i += 8) {
      const byte = bits.slice(i, i + 8).padEnd(8, '0');
      byteFreq[byte] = (byteFreq[byte] || 0) + 1;
    }

    const total = Object.values(byteFreq).reduce((a, b) => a + b, 0);
    let entropy = 0;
    for (const count of Object.values(byteFreq)) {
      const p = count / total;
      if (p > 0) entropy -= p * Math.log2(p);
    }

    return { frequencies: byteFreq, entropy };
  },

  // Bit plane separation
  separateBitPlanes: (bits: string): string[] => {
    const planes: string[] = Array(8).fill('');
    for (let i = 0; i < bits.length; i += 8) {
      const byte = bits.slice(i, i + 8).padEnd(8, '0');
      for (let p = 0; p < 8; p++) {
        planes[p] += byte[p] || '0';
      }
    }
    return planes;
  },

  combineBitPlanes: (planes: string[]): string => {
    if (planes.length !== 8) return '';
    const len = Math.max(...planes.map(p => p.length));
    let result = '';
    for (let i = 0; i < len; i++) {
      for (let p = 0; p < 8; p++) {
        result += planes[p][i] || '0';
      }
    }
    return result;
  },
};

// ============= ANALYSIS FUNCTIONS =============

export const AnalysisFunctions = {
  // Entropy calculation
  calculateEntropy: (bits: string): number => {
    if (!bits.length) return 0;
    const ones = (bits.match(/1/g) || []).length;
    const zeros = bits.length - ones;
    const p0 = zeros / bits.length;
    const p1 = ones / bits.length;
    let entropy = 0;
    if (p0 > 0) entropy -= p0 * Math.log2(p0);
    if (p1 > 0) entropy -= p1 * Math.log2(p1);
    return entropy;
  },

  // Autocorrelation
  autocorrelation: (bits: string, lag: number): number => {
    if (lag >= bits.length) return 0;
    let sum = 0;
    for (let i = 0; i < bits.length - lag; i++) {
      const v1 = bits[i] === '1' ? 1 : -1;
      const v2 = bits[i + lag] === '1' ? 1 : -1;
      sum += v1 * v2;
    }
    return sum / (bits.length - lag);
  },

  // Find longest repeating pattern
  findLongestRepeat: (bits: string): { pattern: string; count: number; position: number } => {
    let best = { pattern: '', count: 0, position: 0 };
    
    for (let len = 2; len <= Math.min(32, bits.length / 2); len++) {
      for (let i = 0; i <= bits.length - len * 2; i++) {
        const pattern = bits.slice(i, i + len);
        let count = 1;
        let pos = i + len;
        while (pos + len <= bits.length && bits.slice(pos, pos + len) === pattern) {
          count++;
          pos += len;
        }
        if (count > best.count || (count === best.count && len > best.pattern.length)) {
          best = { pattern, count, position: i };
        }
      }
    }
    return best;
  },

  // Chi-square test
  chiSquareTest: (bits: string): number => {
    const n = bits.length;
    const ones = (bits.match(/1/g) || []).length;
    const zeros = n - ones;
    const expected = n / 2;
    return Math.pow(ones - expected, 2) / expected + Math.pow(zeros - expected, 2) / expected;
  },

  // Runs test
  runsTest: (bits: string): { numRuns: number; expectedRuns: number; zScore: number } => {
    const n = bits.length;
    const ones = (bits.match(/1/g) || []).length;
    const zeros = n - ones;
    
    let runs = 1;
    for (let i = 1; i < n; i++) {
      if (bits[i] !== bits[i - 1]) runs++;
    }
    
    const expected = (2 * ones * zeros) / n + 1;
    const variance = (2 * ones * zeros * (2 * ones * zeros - n)) / (n * n * (n - 1));
    const zScore = variance > 0 ? (runs - expected) / Math.sqrt(variance) : 0;
    
    return { numRuns: runs, expectedRuns: expected, zScore };
  },

  // Spectral analysis (simple DFT)
  spectralAnalysis: (bits: string): { dominantFreq: number; magnitude: number }[] => {
    const n = Math.min(bits.length, 256);
    const sample = bits.slice(0, n).split('').map(b => b === '1' ? 1 : -1);
    const results: { dominantFreq: number; magnitude: number }[] = [];

    for (let k = 1; k < n / 2; k++) {
      let real = 0, imag = 0;
      for (let t = 0; t < n; t++) {
        const angle = 2 * Math.PI * k * t / n;
        real += sample[t] * Math.cos(angle);
        imag -= sample[t] * Math.sin(angle);
      }
      const magnitude = Math.sqrt(real * real + imag * imag) / n;
      if (magnitude > 0.1) {
        results.push({ dominantFreq: k, magnitude });
      }
    }

    return results.sort((a, b) => b.magnitude - a.magnitude).slice(0, 5);
  },

  // Lempel-Ziv complexity
  lempelZivComplexity: (bits: string): number => {
    const vocab = new Set<string>();
    let w = '';
    let complexity = 0;

    for (const bit of bits) {
      const wPlusBit = w + bit;
      if (vocab.has(wPlusBit)) {
        w = wPlusBit;
      } else {
        vocab.add(wPlusBit);
        complexity++;
        w = '';
      }
    }
    if (w) complexity++;

    return complexity;
  },
};

// ============= TRANSFORMATION FUNCTIONS =============

export const TransformFunctions = {
  // Bit reversal
  reverseBits: (bits: string): string => bits.split('').reverse().join(''),

  // Byte reversal
  reverseBytes: (bits: string): string => {
    const bytes: string[] = [];
    for (let i = 0; i < bits.length; i += 8) {
      bytes.push(bits.slice(i, i + 8).padEnd(8, '0'));
    }
    return bytes.reverse().join('');
  },

  // Bit rotation
  rotateLeft: (bits: string, n: number): string => {
    const shift = n % bits.length;
    return bits.slice(shift) + bits.slice(0, shift);
  },

  rotateRight: (bits: string, n: number): string => {
    const shift = n % bits.length;
    return bits.slice(-shift) + bits.slice(0, -shift);
  },

  // Nibble swap
  nibbleSwap: (bits: string): string => {
    let result = '';
    for (let i = 0; i < bits.length; i += 8) {
      const byte = bits.slice(i, i + 8).padEnd(8, '0');
      result += byte.slice(4) + byte.slice(0, 4);
    }
    return result;
  },

  // XOR with pattern
  xorPattern: (bits: string, pattern: string): string => {
    let result = '';
    for (let i = 0; i < bits.length; i++) {
      const patBit = pattern[i % pattern.length];
      result += bits[i] === patBit ? '0' : '1';
    }
    return result;
  },

  // Complement
  complement: (bits: string): string => {
    return bits.split('').map(b => b === '0' ? '1' : '0').join('');
  },

  // Shuffle (perfect shuffle)
  perfectShuffle: (bits: string): string => {
    const half = Math.floor(bits.length / 2);
    let result = '';
    for (let i = 0; i < half; i++) {
      result += bits[i] + (bits[half + i] || '');
    }
    if (bits.length % 2 === 1) result += bits[bits.length - 1];
    return result;
  },

  // Unshuffle
  perfectUnshuffle: (bits: string): string => {
    let first = '', second = '';
    for (let i = 0; i < bits.length; i++) {
      if (i % 2 === 0) first += bits[i];
      else second += bits[i];
    }
    return first + second;
  },
};

// Export combined library
export const BitLibrary = {
  encoding: EncodingFunctions,
  compression: CompressionFunctions,
  analysis: AnalysisFunctions,
  transform: TransformFunctions,
};
