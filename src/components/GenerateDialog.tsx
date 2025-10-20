import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { BinaryModel } from '@/lib/binaryModel';
import { toast } from 'sonner';

interface GenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (bits: string) => void;
}

export const GenerateDialog = ({ open, onOpenChange, onGenerate }: GenerateDialogProps) => {
  const [length, setLength] = useState(1024);
  const [probability, setProbability] = useState(0.5);

  const handleGenerate = () => {
    if (length < 8 || length > 1000000) {
      toast.error('Length must be between 8 and 1,000,000 bits');
      return;
    }

    const bits = BinaryModel.generateRandom(length, probability);
    onGenerate(bits);
    toast.success(`Generated ${length} bits of random data`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-primary">Generate Binary Data</DialogTitle>
          <DialogDescription>
            Create random binary data with custom parameters
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Length */}
          <div className="space-y-2">
            <Label htmlFor="length">Length (bits)</Label>
            <Input
              id="length"
              type="number"
              min={8}
              max={1000000}
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value) || 0)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              {(length / 8).toFixed(0)} bytes • {(length / 1024).toFixed(2)} KB
            </p>
          </div>

          {/* Probability */}
          <div className="space-y-3">
            <Label htmlFor="probability">
              Probability of 1s: {(probability * 100).toFixed(0)}%
            </Label>
            <Slider
              id="probability"
              min={0}
              max={1}
              step={0.01}
              value={[probability]}
              onValueChange={(values) => setProbability(values[0])}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>All 0s</span>
              <span>Balanced</span>
              <span>All 1s</span>
            </div>
          </div>

          {/* Preview Info */}
          <div className="p-3 bg-secondary/30 rounded-lg space-y-1 text-xs">
            <div className="text-muted-foreground">Expected distribution:</div>
            <div className="flex justify-between">
              <span>Zeros (0):</span>
              <span className="font-mono">~{((1 - probability) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Ones (1):</span>
              <span className="font-mono">~{(probability * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Entropy:</span>
              <span className="font-mono">
                ~{(-(probability * Math.log2(probability || 0.001) + (1 - probability) * Math.log2((1 - probability) || 0.001))).toFixed(3)} bits/symbol
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleGenerate} className="flex-1">
            Generate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
