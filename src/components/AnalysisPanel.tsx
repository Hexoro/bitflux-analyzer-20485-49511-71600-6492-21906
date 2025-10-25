import { CompressionMetrics } from '@/lib/enhancedMetrics';
import { BinaryStats } from '@/lib/binaryMetrics';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface AnalysisPanelProps {
  stats: BinaryStats;
  bits: string;
  bitsPerRow: number;
  onJumpTo: (index: number) => void;
}

export const AnalysisPanel = ({ stats, bits, bitsPerRow, onJumpTo }: AnalysisPanelProps) => {
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const enhanced = CompressionMetrics.analyze(bits, stats.entropy);

  return (
    <div className="h-full overflow-auto p-4 space-y-4 scrollbar-thin">
      {/* File Info */}
      <Card className="p-4 bg-card border-border">
        <h3 className="text-sm font-semibold text-primary mb-3">File Information</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Size:</span>
            <span className="text-foreground font-mono">{stats.totalBits} bits ({formatBytes(stats.totalBytes)})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Bits per Row:</span>
            <span className="text-foreground font-mono">{bitsPerRow}</span>
          </div>
        </div>
      </Card>

      {/* Distribution */}
      <Card className="p-4 bg-card border-border">
        <h3 className="text-sm font-semibold text-primary mb-3">Bit Distribution</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Zeros (0)</span>
              <span className="text-foreground font-mono">{stats.zeroCount} ({stats.zeroPercent.toFixed(2)}%)</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${stats.zeroPercent}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Ones (1)</span>
              <span className="text-foreground font-mono">{stats.oneCount} ({stats.onePercent.toFixed(2)}%)</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${stats.onePercent}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Entropy & Compression */}
      <Card className="p-4 bg-card border-border">
        <h3 className="text-sm font-semibold text-primary mb-3">Entropy & Compression</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shannon Entropy:</span>
            <span className="text-foreground font-mono">{stats.entropy.toFixed(4)} bits/symbol</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hamming Weight:</span>
            <span className="text-foreground font-mono">
              {enhanced.hammingWeight} ({enhanced.hammingWeightPercent.toFixed(2)}%)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Compression Ratio:</span>
            <span className="text-foreground font-mono">{enhanced.estimatedCompressionRatio.toFixed(2)}:1</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mean Run Length:</span>
            <span className="text-foreground font-mono">{stats.meanRunLength.toFixed(2)} bits</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Est. Compressed:</span>
            <span className="text-foreground font-mono">{formatBytes(stats.estimatedCompressedSize)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Max Compressible:</span>
            <span className="text-foreground font-mono">{formatBytes(Math.max(1, Math.ceil(stats.totalBits * stats.entropy / 8)))}</span>
          </div>
          {enhanced.longestRepeatedSubstring && (
            <div className="mt-3 p-2 bg-secondary/50 rounded">
              <div className="text-xs text-muted-foreground mb-1">Longest Repeated Pattern:</div>
              <div className="font-mono text-xs text-primary break-all mb-1">
                {enhanced.longestRepeatedSubstring.sequence}
              </div>
              <div className="text-xs text-muted-foreground">
                Length: {enhanced.longestRepeatedSubstring.length} bits, 
                Occurs: {enhanced.longestRepeatedSubstring.count} times
              </div>
            </div>
          )}
          <div className="mt-2 p-2 bg-secondary/50 rounded text-xs text-muted-foreground">
            Entropy of 1.0 = maximum randomness (perfectly random)
            <br />
            Entropy of 0.0 = no randomness (all same bit)
          </div>
        </div>
      </Card>

      {/* Longest Sequences */}
      <Card className="p-4 bg-card border-border">
        <h3 className="text-sm font-semibold text-primary mb-3">Longest Sequences</h3>
        <div className="space-y-3">
          {stats.longestZeroRun && (
            <div className="p-3 bg-secondary/30 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm text-muted-foreground">Longest 0s</span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onJumpTo(stats.longestZeroRun!.start)}
                  className="h-6 text-xs"
                >
                  Jump to
                </Button>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Length:</span>
                  <span className="text-foreground font-mono">{stats.longestZeroRun.length} bits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Position:</span>
                  <span className="text-foreground font-mono">{stats.longestZeroRun.start} - {stats.longestZeroRun.end}</span>
                </div>
              </div>
            </div>
          )}

          {stats.longestOneRun && (
            <div className="p-3 bg-secondary/30 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm text-muted-foreground">Longest 1s</span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onJumpTo(stats.longestOneRun!.start)}
                  className="h-6 text-xs"
                >
                  Jump to
                </Button>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Length:</span>
                  <span className="text-foreground font-mono">{stats.longestOneRun.length} bits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Position:</span>
                  <span className="text-foreground font-mono">{stats.longestOneRun.start} - {stats.longestOneRun.end}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Data Quality */}
      <Card className="p-4 bg-card border-border">
        <h3 className="text-sm font-semibold text-primary mb-3">Data Quality</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Balance Score:</span>
            <span className="text-foreground font-mono">
              {(100 - Math.abs(50 - stats.onePercent) * 2).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Randomness:</span>
            <span className="text-foreground font-mono">
              {(stats.entropy * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Byte Alignment:</span>
            <span className="text-foreground font-mono">
              {bits.length % 8 === 0 ? '✓ Aligned' : `✗ ${bits.length % 8} extra bits`}
            </span>
          </div>
        </div>
        <div className="mt-3 p-2 bg-secondary/50 rounded text-xs text-muted-foreground">
          Balance shows how evenly distributed 0s and 1s are. Randomness indicates entropy level.
        </div>
      </Card>

      {/* Statistics */}
      <Card className="p-4 bg-card border-border">
        <h3 className="text-sm font-semibold text-primary mb-3">Advanced Statistics</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Population Count:</span>
            <span className="text-foreground font-mono">
              {stats.oneCount} (Hamming weight)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Transitions:</span>
            <span className="text-foreground font-mono">
              {bits.split('').reduce((acc, bit, i) => 
                i > 0 && bit !== bits[i-1] ? acc + 1 : acc, 0
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Transition Rate:</span>
            <span className="text-foreground font-mono">
              {((bits.split('').reduce((acc, bit, i) => 
                i > 0 && bit !== bits[i-1] ? acc + 1 : acc, 0
              ) / Math.max(1, bits.length - 1)) * 100).toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Est. Bit Density:</span>
            <span className="text-foreground font-mono">
              {(stats.oneCount / Math.max(1, stats.totalBits)).toFixed(4)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nibble Alignment:</span>
            <span className="text-foreground font-mono">
              {bits.length % 4 === 0 ? '✓ Aligned' : `✗ ${bits.length % 4} extra bits`}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};
