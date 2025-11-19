import { CompressionMetrics } from '@/lib/enhancedMetrics';
import { AdvancedMetricsCalculator } from '@/lib/advancedMetrics';
import { BinaryStats } from '@/lib/binaryMetrics';
import { PatternAnalysis } from '@/lib/bitstreamAnalysis';
import { IdealityMetrics } from '@/lib/idealityMetrics';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Progress } from './ui/progress';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

interface AnalysisPanelProps {
  stats: BinaryStats;
  bits: string;
  bitsPerRow: number;
  onJumpTo: (index: number) => void;
  onIdealityChange: (idealBitIndices: number[]) => void;
}

export const AnalysisPanel = ({ stats, bits, bitsPerRow, onJumpTo, onIdealityChange }: AnalysisPanelProps) => {
  const [idealityWindowSize, setIdealityWindowSize] = useState('4');
  const [idealityStart, setIdealityStart] = useState('0');
  const [idealityEnd, setIdealityEnd] = useState(String(bits.length - 1));
  const [showIdealBits, setShowIdealBits] = useState(false);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const enhanced = useMemo(() => CompressionMetrics.analyze(bits, stats.entropy), [bits, stats.entropy]);
  const advanced = useMemo(() => AdvancedMetricsCalculator.analyze(bits, stats.entropy), [bits, stats.entropy]);

  const calculateCurrentIdeality = () => {
    const windowSize = parseInt(idealityWindowSize) || 4;
    const start = Math.max(0, parseInt(idealityStart) || 0);
    const end = Math.min(bits.length - 1, parseInt(idealityEnd) || bits.length - 1);
    
    if (windowSize < 1 || start >= end) {
      return { idealityPercentage: 0, windowSize, repeatingCount: 0, totalBits: 0, idealBitIndices: [] };
    }
    
    const allResults = IdealityMetrics.calculateAllIdealities(bits, start, end);
    const result = allResults.find(r => r.windowSize === windowSize);
    
    return result || { idealityPercentage: 0, windowSize, repeatingCount: 0, totalBits: end - start + 1, idealBitIndices: [] };
  };

  const currentIdeality = calculateCurrentIdeality();

  const topPatterns = useMemo(() => {
    const patterns8 = PatternAnalysis.findAllPatterns(bits, 8, 2);
    return patterns8.slice(0, 5);
  }, [bits]);

  const exportMetrics = () => {
    const allMetrics = {
      basic: stats,
      enhanced,
      advanced: {
        ...advanced,
        bigramDistribution: Array.from(advanced.bigramDistribution.entries()),
        trigramDistribution: Array.from(advanced.trigramDistribution.entries()),
        nybbleDistribution: Array.from(advanced.nybbleDistribution.entries()),
        byteDistribution: Array.from(advanced.byteDistribution.entries()),
      },
      ideality: currentIdeality,
    };
    
    const json = JSON.stringify(allMetrics, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'binary-analysis-metrics.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Metrics exported successfully');
  };

  return (
    <div className="h-full overflow-auto p-4 space-y-4 scrollbar-thin">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-primary">Comprehensive Analysis</h2>
        <Button variant="outline" size="sm" onClick={exportMetrics}>
          Export Metrics
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={["file-info", "compression", "patterns"]} className="space-y-2">
        <AccordionItem value="file-info" className="border-border">
          <AccordionTrigger className="text-sm font-semibold text-primary hover:no-underline px-4 py-2 bg-card rounded-t-lg">
            File Information
          </AccordionTrigger>
          <AccordionContent className="p-4 bg-card rounded-b-lg border-t border-border">
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
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="distribution" className="border-border">
          <AccordionTrigger className="text-sm font-semibold text-primary hover:no-underline px-4 py-2 bg-card rounded-t-lg">
            Bit Distribution
          </AccordionTrigger>
          <AccordionContent className="p-4 bg-card rounded-b-lg border-t border-border">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Zeros (0)</span>
                  <span className="text-foreground font-mono">{stats.zeroCount} ({stats.zeroPercent.toFixed(2)}%)</span>
                </div>
                <Progress value={stats.zeroPercent} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Ones (1)</span>
                  <span className="text-foreground font-mono">{stats.oneCount} ({stats.onePercent.toFixed(2)}%)</span>
                </div>
                <Progress value={stats.onePercent} className="h-2" />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="compression" className="border-border">
          <AccordionTrigger className="text-sm font-semibold text-primary hover:no-underline px-4 py-2 bg-card rounded-t-lg">
            Compression & Binary Metrics
          </AccordionTrigger>
          <AccordionContent className="p-4 bg-card rounded-b-lg border-t border-border">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Shannon Entropy:</span><span className="text-foreground font-mono">{stats.entropy.toFixed(4)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">RLE Ratio:</span><span className="text-foreground font-mono">{advanced.compressionEstimates.rle.toFixed(2)}:1</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Huffman (est):</span><span className="text-foreground font-mono">{advanced.compressionEstimates.huffman.toFixed(2)}:1</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Variance:</span><span className="text-foreground font-mono">{advanced.variance.toFixed(4)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Chi-Square:</span><span className={`font-mono ${advanced.chiSquare.isRandom ? 'text-green-500' : 'text-yellow-500'}`}>{advanced.chiSquare.isRandom ? '✓ Random' : '⚠ Biased'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Transitions:</span><span className="text-foreground font-mono">{advanced.transitionCount.total} ({(advanced.transitionRate * 100).toFixed(1)}%)</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Pattern Diversity:</span><span className="text-foreground font-mono">{(advanced.patternDiversity * 100).toFixed(1)}%</span></div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="patterns" className="border-border">
          <AccordionTrigger className="text-sm font-semibold text-primary hover:no-underline px-4 py-2 bg-card rounded-t-lg">
            Top Patterns
          </AccordionTrigger>
          <AccordionContent className="p-4 bg-card rounded-b-lg border-t border-border">
            {topPatterns.length > 0 ? (
              <div className="space-y-1">
                {topPatterns.map((p, idx) => (
                  <div key={idx} className="flex justify-between text-xs bg-secondary/20 p-2 rounded">
                    <span className="font-mono">{p.pattern}</span>
                    <span className="text-muted-foreground">{p.count}x</span>
                  </div>
                ))}
              </div>
            ) : <div className="text-xs text-muted-foreground">No patterns</div>}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="sequences" className="border-border">
          <AccordionTrigger className="text-sm font-semibold text-primary hover:no-underline px-4 py-2 bg-card rounded-t-lg">
            Longest Runs
          </AccordionTrigger>
          <AccordionContent className="p-4 bg-card rounded-b-lg border-t border-border space-y-3">
            {stats.longestZeroRun && (
              <div className="p-2 bg-secondary/20 rounded">
                <div className="flex justify-between mb-1"><span className="text-sm font-medium">Longest 0s</span><Button variant="outline" size="sm" onClick={() => onJumpTo(stats.longestZeroRun!.start)}>Jump</Button></div>
                <div className="text-xs text-muted-foreground">Length: {stats.longestZeroRun.length} • Pos: {stats.longestZeroRun.start}-{stats.longestZeroRun.end}</div>
              </div>
            )}
            {stats.longestOneRun && (
              <div className="p-2 bg-secondary/20 rounded">
                <div className="flex justify-between mb-1"><span className="text-sm font-medium">Longest 1s</span><Button variant="outline" size="sm" onClick={() => onJumpTo(stats.longestOneRun!.start)}>Jump</Button></div>
                <div className="text-xs text-muted-foreground">Length: {stats.longestOneRun.length} • Pos: {stats.longestOneRun.start}-{stats.longestOneRun.end}</div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="ideality" className="border-border">
          <AccordionTrigger className="text-sm font-semibold text-primary hover:no-underline px-4 py-2 bg-card rounded-t-lg">
            File Ideality
          </AccordionTrigger>
          <AccordionContent className="p-4 bg-card rounded-b-lg border-t border-border">
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div><Label className="text-xs">Window</Label><Input type="number" min="2" value={idealityWindowSize} onChange={(e) => setIdealityWindowSize(e.target.value)} className="h-8 text-xs font-mono bg-input"/></div>
                <div><Label className="text-xs">Start</Label><Input type="number" min="0" value={idealityStart} onChange={(e) => setIdealityStart(e.target.value)} className="h-8 text-xs font-mono bg-input"/></div>
                <div><Label className="text-xs">End</Label><Input type="number" min="0" value={idealityEnd} onChange={(e) => setIdealityEnd(e.target.value)} className="h-8 text-xs font-mono bg-input"/></div>
              </div>
              <div className="p-3 bg-secondary/30 rounded space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Score:</span><span className="text-primary font-mono font-semibold">{currentIdeality.idealityPercentage.toFixed(2)}%</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Repeating:</span><span className="font-mono">{currentIdeality.repeatingCount}</span></div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => { onIdealityChange(currentIdeality.idealBitIndices); setShowIdealBits(!showIdealBits); toast.success(showIdealBits ? 'Hidden' : 'Highlighted'); }}>{showIdealBits ? 'Hide' : 'Show'} Ideal Bits</Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
