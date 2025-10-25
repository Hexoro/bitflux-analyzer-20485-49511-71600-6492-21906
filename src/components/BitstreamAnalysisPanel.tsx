import { useState } from 'react';
import { PatternAnalysis, TransitionAnalysis, CorrelationAnalysis, CompressionAnalysisTools } from '@/lib/bitstreamAnalysis';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Progress } from './ui/progress';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

interface BitstreamAnalysisPanelProps {
  bits: string;
  onJumpTo: (index: number) => void;
}

export const BitstreamAnalysisPanel = ({ bits, onJumpTo }: BitstreamAnalysisPanelProps) => {
  const [patternInput, setPatternInput] = useState('');
  const [patternResults, setPatternResults] = useState<{ pattern: string; positions: number[]; frequency: number } | null>(null);
  const [tokenFormat, setTokenFormat] = useState('8');
  const [comparePattern, setComparePattern] = useState('');
  const [correlationResult, setCorrelationResult] = useState<any>(null);

  const handlePatternSearch = () => {
    if (!patternInput.match(/^[01]+$/)) {
      toast.error('Please enter a valid binary pattern');
      return;
    }

    const result = PatternAnalysis.findPattern(bits, patternInput);
    const frequency = PatternAnalysis.patternFrequency(bits, patternInput.length);
    const patternFreq = frequency.get(patternInput) || 0;
    
    setPatternResults({
      pattern: patternInput,
      positions: result.positions,
      frequency: patternFreq / bits.length
    });
    
    toast.success(`Found ${result.positions.length} occurrences`);
  };

  const handleParseTokens = () => {
    const tokenSize = parseInt(tokenFormat);
    if (isNaN(tokenSize) || tokenSize < 1) {
      toast.error('Invalid token size');
      return;
    }

    const tokens = PatternAnalysis.parseTokens(bits, tokenFormat);
    toast.success(`Parsed ${tokens.length} tokens of ${tokenFormat} chars each`);
    // Could display tokens in a dialog or export them
  };

  const handleCompare = () => {
    if (!comparePattern.match(/^[01]+$/)) {
      toast.error('Please enter a valid binary pattern to compare');
      return;
    }

    const hamming = CorrelationAnalysis.hammingDistance(bits, comparePattern);
    const similarityResult = CorrelationAnalysis.calculateSimilarity(bits, comparePattern);

    setCorrelationResult({ 
      hamming, 
      similarity: similarityResult.similarity, 
      correlation: similarityResult.similarity 
    });
    toast.success('Comparison complete');
  };

  const transitionData = TransitionAnalysis.analyzeTransitions(bits);
  const transitionRate = transitionData.transitionRate;
  const runLengths = TransitionAnalysis.runLengthEncode(bits);
  const compressionData = CompressionAnalysisTools.estimateRLECompression(bits);
  
  // Calculate block entropy manually
  const blockSize = 256;
  const numBlocks = Math.floor(bits.length / blockSize);
  const blockEntropyValues: number[] = [];
  for (let i = 0; i < numBlocks; i++) {
    const block = bits.slice(i * blockSize, (i + 1) * blockSize);
    blockEntropyValues.push(CompressionAnalysisTools.calculateEntropy(block));
  }
  const blockEntropy = {
    values: blockEntropyValues,
    average: blockEntropyValues.reduce((a, b) => a + b, 0) / (blockEntropyValues.length || 1),
    min: Math.min(...blockEntropyValues, 0),
    max: Math.max(...blockEntropyValues, 0)
  };

  return (
    <div className="h-full overflow-auto p-4 space-y-4 scrollbar-thin">
      <Accordion type="multiple" defaultValue={['pattern', 'transition']} className="space-y-2">
        {/* Pattern Analysis */}
        <AccordionItem value="pattern">
          <AccordionTrigger className="text-sm font-medium">Pattern Analysis</AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            <Card className="p-4 bg-card border-border">
              <h4 className="text-xs font-semibold text-primary mb-2">Pattern Search</h4>
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Enter pattern (e.g., 1010)"
                  value={patternInput}
                  onChange={(e) => setPatternInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePatternSearch()}
                  className="font-mono text-xs flex-1"
                />
                <Button onClick={handlePatternSearch} size="sm">
                  <Search className="w-4 h-4" />
                </Button>
              </div>

              {patternResults && (
                <div className="space-y-2">
                  <div className="p-3 bg-secondary/50 rounded text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pattern:</span>
                      <span className="font-mono">{patternResults.pattern}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Occurrences:</span>
                      <span className="font-mono">{patternResults.positions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Frequency:</span>
                      <span className="font-mono">{(patternResults.frequency * 100).toFixed(4)}%</span>
                    </div>
                  </div>

                  {patternResults.positions.length > 0 && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-2">Positions (first 20):</div>
                      <div className="flex flex-wrap gap-2">
                        {patternResults.positions.slice(0, 20).map((pos, idx) => (
                          <Button
                            key={idx}
                            size="sm"
                            variant="outline"
                            onClick={() => onJumpTo(pos)}
                            className="h-6 px-2 text-xs font-mono"
                          >
                            {pos}
                          </Button>
                        ))}
                        {patternResults.positions.length > 20 && (
                          <span className="text-xs text-muted-foreground self-center">
                            +{patternResults.positions.length - 20} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>

            <Card className="p-4 bg-card border-border">
              <h4 className="text-xs font-semibold text-primary mb-2">Token Parser</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Token size (bits)"
                  value={tokenFormat}
                  onChange={(e) => setTokenFormat(e.target.value)}
                  className="font-mono text-xs"
                />
                <Button onClick={handleParseTokens} size="sm" variant="outline">
                  Parse
                </Button>
              </div>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Transition Analysis */}
        <AccordionItem value="transition">
          <AccordionTrigger className="text-sm font-medium">Transition Analysis</AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            <Card className="p-4 bg-card border-border">
              <h4 className="text-xs font-semibold text-primary mb-3">Bit Transitions</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">0 → 1 transitions:</span>
                  <span className="font-mono">{transitionData.zeroToOne}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">1 → 0 transitions:</span>
                  <span className="font-mono">{transitionData.oneToZero}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total transitions:</span>
                  <span className="font-mono">{transitionData.totalTransitions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transition rate:</span>
                  <span className="font-mono">{(transitionRate * 100).toFixed(2)}%</span>
                </div>
              </div>

              <div className="mt-3">
                <div className="text-xs text-muted-foreground mb-1">Transition Density</div>
                <Progress value={transitionRate * 100} className="h-2" />
              </div>
            </Card>

            <Card className="p-4 bg-card border-border">
              <h4 className="text-xs font-semibold text-primary mb-3">Run Length Analysis</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total runs:</span>
                  <span className="font-mono">{runLengths.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max run length:</span>
                  <span className="font-mono">
                    {Math.max(...runLengths.map(r => r.length), 0)} bits
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg run length:</span>
                  <span className="font-mono">
                    {(runLengths.reduce((a, r) => a + r.length, 0) / (runLengths.length || 1)).toFixed(2)} bits
                  </span>
                </div>
              </div>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Correlation */}
        <AccordionItem value="correlation">
          <AccordionTrigger className="text-sm font-medium">Correlation Analysis</AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            <Card className="p-4 bg-card border-border">
              <h4 className="text-xs font-semibold text-primary mb-2">Compare with Pattern</h4>
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Enter binary pattern"
                  value={comparePattern}
                  onChange={(e) => setComparePattern(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
                  className="font-mono text-xs flex-1"
                />
                <Button onClick={handleCompare} size="sm" variant="outline">
                  Compare
                </Button>
              </div>

              {correlationResult && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hamming Distance:</span>
                    <span className="font-mono">{correlationResult.hamming}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Similarity Score:</span>
                    <span className="font-mono">{(correlationResult.similarity * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Correlation:</span>
                    <span className="font-mono">{correlationResult.correlation.toFixed(4)}</span>
                  </div>
                  <Progress value={correlationResult.similarity * 100} className="h-2 mt-2" />
                </div>
              )}
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Compression Analysis */}
        <AccordionItem value="compression">
          <AccordionTrigger className="text-sm font-medium">Compression Analysis</AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            <Card className="p-4 bg-card border-border">
              <h4 className="text-xs font-semibold text-primary mb-3">Compression Potential</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RLE ratio:</span>
                  <span className="font-mono">{compressionData.compressionRatio.toFixed(2)}:1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original size:</span>
                  <span className="font-mono">{compressionData.rawLength} bits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RLE compressed:</span>
                  <span className="font-mono">{compressionData.compressedLength} bits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entropy:</span>
                  <span className="font-mono">{compressionData.entropy.toFixed(4)}</span>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-card border-border">
              <h4 className="text-xs font-semibold text-primary mb-3">Block Entropy (256-bit blocks)</h4>
              <div className="space-y-2">
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Average:</span>
                    <span className="font-mono">{blockEntropy.average.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min:</span>
                    <span className="font-mono">{blockEntropy.min.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max:</span>
                    <span className="font-mono">{blockEntropy.max.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Blocks analyzed:</span>
                    <span className="font-mono">{blockEntropy.values.length}</span>
                  </div>
                </div>
              </div>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
