import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { FlipHorizontal, Shuffle, Replace } from 'lucide-react';

interface TransformationsPanelProps {
  bits: string;
  selectedRange: { start: number; end: number } | null;
  onTransform: (newBits: string, description: string) => void;
}

export const TransformationsPanel = ({ bits, selectedRange, onTransform }: TransformationsPanelProps) => {
  const [findPattern, setFindPattern] = useState('');
  const [replacePattern, setReplacePattern] = useState('');

  const handleDelete = () => {
    if (selectedRange) {
      const before = bits.substring(0, selectedRange.start);
      const after = bits.substring(selectedRange.end + 1);
      onTransform(before + after, `Deleted bits ${selectedRange.start}-${selectedRange.end}`);
    }
  };

  const handleInvert = () => {
    if (!selectedRange) {
      // Invert all
      const inverted = bits.split('').map(b => b === '0' ? '1' : '0').join('');
      onTransform(inverted, 'Inverted all bits');
    } else {
      // Invert selection
      const before = bits.substring(0, selectedRange.start);
      const selected = bits.substring(selectedRange.start, selectedRange.end + 1);
      const after = bits.substring(selectedRange.end + 1);
      const inverted = selected.split('').map(b => b === '0' ? '1' : '0').join('');
      onTransform(before + inverted + after, `Inverted bits ${selectedRange.start}-${selectedRange.end}`);
    }
  };

  const handleShiftLeft = () => {
    if (bits.length === 0) return;
    const shifted = bits.substring(1) + bits[0];
    onTransform(shifted, 'Shifted left by 1 bit');
  };

  const handleShiftRight = () => {
    if (bits.length === 0) return;
    const shifted = bits[bits.length - 1] + bits.substring(0, bits.length - 1);
    onTransform(shifted, 'Shifted right by 1 bit');
  };

  const handleReverse = () => {
    if (!selectedRange) {
      const reversed = bits.split('').reverse().join('');
      onTransform(reversed, 'Reversed all bits');
    } else {
      const before = bits.substring(0, selectedRange.start);
      const selected = bits.substring(selectedRange.start, selectedRange.end + 1);
      const after = bits.substring(selectedRange.end + 1);
      const reversed = selected.split('').reverse().join('');
      onTransform(before + reversed + after, `Reversed bits ${selectedRange.start}-${selectedRange.end}`);
    }
  };

  const handleFindReplace = () => {
    if (!findPattern || !/^[01]+$/.test(findPattern)) {
      return;
    }
    if (!replacePattern || !/^[01]+$/.test(replacePattern)) {
      return;
    }

    const replaced = bits.split(findPattern).join(replacePattern);
    const count = (bits.length - replaced.length + replacePattern.length - findPattern.length) / (findPattern.length - replacePattern.length + 1);
    onTransform(replaced, `Replaced ${count} occurrence(s) of "${findPattern}"`);
  };

  const hasData = bits && bits.length > 0;

  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Transformations</h3>

        {!hasData && (
          <Card className="p-4 bg-secondary/20 border-border">
            <p className="text-sm text-muted-foreground text-center">
              No binary data available. Please generate or load a file first.
            </p>
          </Card>
        )}


        {hasData && (
          <>
            {/* Bitwise Operations */}
            <Card className="p-4 bg-card border-border">
              <h4 className="text-sm font-semibold text-primary mb-3">Bitwise Operations</h4>
              <div className="space-y-2">
                {selectedRange && (
                  <Button
                    onClick={handleDelete}
                    variant="destructive"
                    className="w-full justify-start"
                    size="sm"
                  >
                    Delete Selection
                  </Button>
                )}
                <Button
                  onClick={handleInvert}
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                >
                  <FlipHorizontal className="w-4 h-4 mr-2" />
                  Invert (NOT) {selectedRange ? 'Selection' : 'All'}
                </Button>
                <Button
                  onClick={handleReverse}
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  Reverse {selectedRange ? 'Selection' : 'All'}
                </Button>
              </div>
            </Card>

            {/* Shift Operations */}
            <Card className="p-4 bg-card border-border">
              <h4 className="text-sm font-semibold text-primary mb-3">Shift Operations</h4>
              <div className="space-y-2">
                <Button
                  onClick={handleShiftLeft}
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                >
                  ← Shift Left (Rotate)
                </Button>
                <Button
                  onClick={handleShiftRight}
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                >
                  → Shift Right (Rotate)
                </Button>
              </div>
            </Card>

            {/* Find and Replace */}
            <Card className="p-4 bg-card border-border">
              <h4 className="text-sm font-semibold text-primary mb-3">Find & Replace</h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="find" className="text-xs">Find Pattern</Label>
                  <Input
                    id="find"
                    value={findPattern}
                    onChange={(e) => setFindPattern(e.target.value)}
                    placeholder="e.g., 1010"
                    className="font-mono text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="replace" className="text-xs">Replace With</Label>
                  <Input
                    id="replace"
                    value={replacePattern}
                    onChange={(e) => setReplacePattern(e.target.value)}
                    placeholder="e.g., 0101"
                    className="font-mono text-sm"
                  />
                </div>
                <Button
                  onClick={handleFindReplace}
                  variant="default"
                  className="w-full"
                  size="sm"
                  disabled={!findPattern || !replacePattern}
                >
                  <Replace className="w-4 h-4 mr-2" />
                  Replace All
                </Button>
              </div>
            </Card>

            {selectedRange && (
              <Card className="p-3 bg-secondary/50 border-border">
                <p className="text-xs text-muted-foreground">
                  Current selection: {selectedRange.end - selectedRange.start + 1} bits
                  <br />
                  Position: {selectedRange.start} - {selectedRange.end}
                </p>
              </Card>
            )}
          </>
        )}
      </div>
    </ScrollArea>
  );
};
