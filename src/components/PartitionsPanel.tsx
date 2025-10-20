import { Partition } from '@/lib/partitionManager';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';

interface PartitionsPanelProps {
  partitions: Partition[];
  onJumpTo: (index: number) => void;
}

export const PartitionsPanel = ({ partitions, onJumpTo }: PartitionsPanelProps) => {
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primary">
            Partitions ({partitions.length})
          </h3>
        </div>

        <Card className="p-3 bg-primary/5 border-primary/30">
          <p className="text-xs text-muted-foreground">
            💡 Partitions are automatically created from boundaries. To modify partitions, add or remove boundaries in the Boundaries tab.
          </p>
        </Card>

        {partitions.length === 0 ? (
          <Card className="p-6 bg-card border-border text-center">
            <p className="text-muted-foreground">
              No partitions found. Add boundaries to create partitions.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {partitions.map((partition, idx) => (
              <Card key={partition.id} className="p-4 bg-card border-border hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-primary">
                      Partition {idx + 1}
                    </h4>
                    <p className="text-xs text-muted-foreground font-mono">
                      Position: {partition.startIndex} - {partition.endIndex}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onJumpTo(partition.startIndex)}
                    className="h-7 text-xs"
                  >
                    Jump
                  </Button>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size:</span>
                    <span className="text-foreground font-mono">
                      {partition.stats.totalBits} bits ({formatBytes(partition.stats.totalBytes)})
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entropy:</span>
                    <span className="text-foreground font-mono">
                      {partition.stats.entropy.toFixed(4)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Distribution:</span>
                    <span className="text-foreground font-mono">
                      0s: {partition.stats.zeroPercent.toFixed(1)}% | 1s: {partition.stats.onePercent.toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mean Run:</span>
                    <span className="text-foreground font-mono">
                      {partition.stats.meanRunLength.toFixed(2)} bits
                    </span>
                  </div>

                  {/* Bit preview */}
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="text-xs text-muted-foreground mb-1">Preview (first 64 bits):</div>
                    <div className="font-mono text-xs text-primary break-all">
                      {partition.bits.substring(0, 64)}
                      {partition.bits.length > 64 && '...'}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
