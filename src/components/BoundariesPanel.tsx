import { useState, useMemo } from 'react';
import { BinaryMetrics } from '@/lib/binaryMetrics';
import { Boundary, PartitionManager } from '@/lib/partitionManager';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Sparkles, X, Zap, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface BoundariesPanelProps {
  bits: string;
  stats: any;
  boundaries: Boundary[];
  partitionManager: PartitionManager;
  onJumpTo: (index: number) => void;
  onAppendBoundary: (boundary: string, description: string, color: string) => void;
  onInsertBoundary: (boundary: string, description: string, color: string, position: number) => void;
  onRemoveBoundary: (id: string) => void;
  onToggleHighlight: (id: string) => void;
}

// Helper to find unique palindrome
const findUniquePalindrome = (bits: string): { sequence: string; position: number } | null => {
  const palindromes: Array<{ sequence: string; position: number }> = [];
  
  for (let i = 0; i < bits.length; i++) {
    // Odd length
    let len = 1;
    while (i - len >= 0 && i + len < bits.length && bits[i - len] === bits[i + len]) {
      len++;
    }
    const oddPal = bits.substring(i - len + 1, i + len);
    if (oddPal.length >= 8) {
      palindromes.push({ sequence: oddPal, position: i - len + 1 });
    }
    
    // Even length
    len = 0;
    while (i - len >= 0 && i + 1 + len < bits.length && bits[i - len] === bits[i + 1 + len]) {
      len++;
    }
    const evenPal = bits.substring(i - len + 1, i + len + 1);
    if (evenPal.length >= 8) {
      palindromes.push({ sequence: evenPal, position: i - len + 1 });
    }
  }
  
  // Find longest palindrome that occurs only once
  palindromes.sort((a, b) => b.sequence.length - a.sequence.length);
  
  for (const pal of palindromes) {
    const occurrences = (bits.match(new RegExp(pal.sequence, 'g')) || []).length;
    if (occurrences === 1) {
      return pal;
    }
  }
  
  return null;
};

export const BoundariesPanel = ({ 
  bits, 
  stats, 
  boundaries,
  partitionManager,
  onJumpTo, 
  onAppendBoundary,
  onInsertBoundary,
  onRemoveBoundary,
  onToggleHighlight 
}: BoundariesPanelProps) => {
  const [customBoundary, setCustomBoundary] = useState('');
  const [generatedBoundary, setGeneratedBoundary] = useState<string | null>(null);
  const [boundaryColor, setBoundaryColor] = useState('#FF00FF');
  const [insertPosition, setInsertPosition] = useState('');

  const suggestions = useMemo(() => {
    if (bits.length === 0) return null;
    
    // Create unique suggestions
    const zeroRunUnique = '0'.repeat(stats.longestZeroRun.length + 1);
    const oneRunUnique = '1'.repeat(stats.longestOneRun.length + 1);
    const palindrome = findUniquePalindrome(bits);
    
    return {
      zeroRunUnique,
      oneRunUnique,
      palindrome,
    };
  }, [bits, stats]);

  const handleGenerateUnique = () => {
    const boundary = BinaryMetrics.findUniqueBoundary(bits, 8, 32);
    if (boundary) {
      setGeneratedBoundary(boundary);
      toast.success(`Generated unique ${boundary.length}-bit boundary`);
    } else {
      toast.error('Could not find a unique boundary sequence');
    }
  };

  const handleUseSuggestion = (sequence: string, description: string) => {
    setGeneratedBoundary(sequence);
    toast.success(`Selected: ${description}`);
  };

  const validateBoundary = (sequence: string) => {
    if (!/^[01]+$/.test(sequence)) {
      toast.error('Boundary must only contain 0s and 1s');
      return false;
    }
    
    const occurrences = (bits.match(new RegExp(sequence, 'g')) || []).length;
    if (occurrences > 1) {
      toast.error('This sequence occurs multiple times in the file');
      return false;
    }
    
    if (occurrences === 0) {
      return true; // New boundary (will be added)
    }
    
    toast.error('This sequence already exists in the file exactly once');
    return false;
  };

  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-4">
        {/* Active Boundaries - Table View */}
        {boundaries.length > 0 && (
          <Card className="p-4 bg-card border-border">
            <h3 className="text-sm font-semibold text-primary mb-3">
              Active Boundaries ({boundaries.length})
            </h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Sequence</TableHead>
                    <TableHead className="text-center">Length</TableHead>
                    <TableHead className="text-center">Occurrences</TableHead>
                    <TableHead>Positions</TableHead>
                    <TableHead className="w-20 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {boundaries.map((boundary) => {
                    const hasMultipleOccurrences = boundary.positions.length > 1;
                    const isHighlighted = partitionManager.isHighlightEnabled(boundary.id);
                    return (
                      <TableRow 
                        key={boundary.id} 
                        className={hasMultipleOccurrences ? 'bg-red-500/5' : ''}
                      >
                        <TableCell>
                          <div
                            className="w-4 h-4 rounded border border-border"
                            style={{ backgroundColor: boundary.color }}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {boundary.description}
                          {hasMultipleOccurrences && (
                            <span className="ml-2 text-red-500 text-xs font-bold">🚩 MULTIPLE</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {boundary.sequence.substring(0, 20)}
                          {boundary.sequence.length > 20 && '...'}
                        </TableCell>
                        <TableCell className="text-center">{boundary.sequence.length}</TableCell>
                        <TableCell className={`text-center ${hasMultipleOccurrences ? 'text-red-500 font-semibold' : ''}`}>
                          {boundary.positions.length}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {boundary.positions.slice(0, 3).map((pos, idx) => (
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
                            {boundary.positions.length > 3 && (
                              <span className="text-xs text-muted-foreground self-center">
                                +{boundary.positions.length - 3}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              onClick={() => onToggleHighlight(boundary.id)}
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              title={isHighlighted ? "Hide highlight" : "Show highlight"}
                            >
                              {isHighlighted ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </Button>
                            <Button
                              onClick={() => onRemoveBoundary(boundary.id)}
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}


        {/* Generate Unique Boundary */}
        <Card className="p-4 bg-card border-border">
          <h3 className="text-sm font-semibold text-primary mb-3">Generate Unique Boundary</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Create a boundary sequence that doesn't appear anywhere in your data:
          </p>
          
          <Button 
            onClick={handleGenerateUnique} 
            className="w-full mb-3"
            variant="default"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Unique Boundary
          </Button>

          {generatedBoundary && (
            <div className="space-y-3">
              <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Generated/Selected Boundary:</div>
                <div className="text-sm font-mono text-primary break-all">
                  {generatedBoundary.substring(0, 100)}
                  {generatedBoundary.length > 100 && '...'}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Length: {generatedBoundary.length} bits • 
                  1s: {generatedBoundary.split('1').length - 1} • 
                  0s: {generatedBoundary.split('0').length - 1}
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={boundaryColor}
                  onChange={(e) => setBoundaryColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-border"
                  title="Choose boundary color"
                />
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Button 
                    onClick={() => {
                      onAppendBoundary(generatedBoundary, 'Boundary sequence', boundaryColor);
                      setGeneratedBoundary(null);
                    }}
                    className="w-full"
                  >
                    Append
                  </Button>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      placeholder="Pos"
                      value={insertPosition}
                      onChange={(e) => setInsertPosition(e.target.value)}
                      className="w-16 h-10"
                    />
                    <Button 
                      onClick={() => {
                        const pos = parseInt(insertPosition);
                        if (!isNaN(pos) && pos >= 0 && pos <= bits.length) {
                          onInsertBoundary(generatedBoundary, 'Boundary sequence', boundaryColor, pos);
                          setGeneratedBoundary(null);
                          setInsertPosition('');
                        } else {
                          toast.error('Invalid position');
                        }
                      }}
                      disabled={!insertPosition}
                      className="flex-1"
                    >
                      Insert
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Custom Boundary */}
        <Card className="p-4 bg-card border-border">
          <h3 className="text-sm font-semibold text-primary mb-3">Custom Boundary</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Enter your own boundary sequence (must not exist in the file):
          </p>
          
          <div className="space-y-2">
            <Input
              placeholder="Enter binary sequence (e.g., 11110000)"
              value={customBoundary}
              onChange={(e) => setCustomBoundary(e.target.value)}
              className="font-mono"
            />
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={boundaryColor}
                onChange={(e) => setBoundaryColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-border"
                title="Choose boundary color"
              />
              <div className="flex-1 grid grid-cols-2 gap-2">
                <Button 
                  onClick={() => {
                    if (validateBoundary(customBoundary)) {
                      onAppendBoundary(customBoundary, `Custom: ${customBoundary.substring(0, 10)}...`, boundaryColor);
                      setCustomBoundary('');
                    }
                  }}
                  className="w-full"
                  disabled={!customBoundary}
                >
                  Append
                </Button>
                <div className="flex gap-1">
                  <Input
                    type="number"
                    placeholder="Pos"
                    value={insertPosition}
                    onChange={(e) => setInsertPosition(e.target.value)}
                    className="w-16 h-10"
                  />
                  <Button 
                    onClick={() => {
                      const pos = parseInt(insertPosition);
                      if (validateBoundary(customBoundary) && !isNaN(pos) && pos >= 0 && pos <= bits.length) {
                        onInsertBoundary(customBoundary, `Custom: ${customBoundary.substring(0, 10)}...`, boundaryColor, pos);
                        setCustomBoundary('');
                        setInsertPosition('');
                      } else if (isNaN(pos) || pos < 0 || pos > bits.length) {
                        toast.error('Invalid position');
                      }
                    }}
                    disabled={!customBoundary || !insertPosition}
                    className="flex-1"
                  >
                    Insert
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Info */}
        <Card className="p-4 bg-card/50 border-border">
          <div className="text-xs text-muted-foreground space-y-2">
            <p><strong>💡 About Boundaries</strong></p>
            <p>
              Boundaries are special sequences that mark divisions in your binary data. 
              They're useful for partitioning files or adding markers.
            </p>
            <p>
              A good boundary should be unique (not in your data) and recognizable. 
              Use the smart suggestions above or generate a unique sequence.
            </p>
          </div>
        </Card>
      </div>
    </ScrollArea>
  );
};