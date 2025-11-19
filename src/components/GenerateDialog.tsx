import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { BinaryModel } from '@/lib/binaryModel';
import { GENERATION_PRESETS, PRESET_DESCRIPTIONS, QUICK_SIZES } from '@/lib/generationPresets';
import { toast } from 'sonner';
import { ChevronDown } from 'lucide-react';

interface GenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (bits: string) => void;
}

export const GenerateDialog = ({ open, onOpenChange, onGenerate }: GenerateDialogProps) => {
  const [mode, setMode] = useState<'random' | 'pattern' | 'structured' | 'file-format'>('random');
  const [length, setLength] = useState(1024);
  
  // Random mode
  const [probability, setProbability] = useState(0.5);
  const [seed, setSeed] = useState('');
  const [targetEntropy, setTargetEntropy] = useState<number | null>(null);
  
  // Pattern mode
  const [pattern, setPattern] = useState('1010');
  const [noise, setNoise] = useState(0);
  
  // Structured mode
  const [template, setTemplate] = useState<string>('alternating');
  const [blockSize, setBlockSize] = useState(8);
  
  // File format mode
  const [headerPattern, setHeaderPattern] = useState('11111111');
  
  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);

  const calculateExpectedMetrics = () => {
    const p = probability;
    const entropy = p > 0 && p < 1 ? -p * Math.log2(p) - (1 - p) * Math.log2(1 - p) : 0;
    const hammingWeight = (p * 100).toFixed(1);
    const compressionRatio = length > 0 ? (length / Math.max(entropy * length, 1)).toFixed(2) : '1.00';
    
    return { entropy, hammingWeight, compressionRatio };
  };

  const handleGenerate = () => {
    if (length < 8 || length > 10000000) {
      toast.error('Length must be between 8 and 10,000,000 bits');
      return;
    }

    let bits = '';
    
    try {
      switch (mode) {
        case 'random':
          if (targetEntropy !== null && targetEntropy >= 0) {
            bits = BinaryModel.generateWithEntropy(length, targetEntropy);
          } else {
            bits = BinaryModel.generateRandom(length, probability, seed || undefined);
          }
          break;
          
        case 'pattern':
          if (!pattern || !/^[01]+$/.test(pattern)) {
            toast.error('Pattern must contain only 0s and 1s');
            return;
          }
          bits = BinaryModel.generateFromPattern(pattern, length, noise);
          break;
          
        case 'structured':
          bits = BinaryModel.generateStructured(template, length, blockSize);
          break;
          
        case 'file-format':
          if (!headerPattern || !/^[01]+$/.test(headerPattern)) {
            toast.error('Header pattern must contain only 0s and 1s');
            return;
          }
          bits = BinaryModel.generateFileFormat(length, headerPattern);
          break;
      }
      
      onGenerate(bits);
      toast.success(`Generated ${length} bits using ${mode} mode`);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to generate binary data');
      console.error(error);
    }
  };

  const applyPreset = (presetKey: string) => {
    const preset = GENERATION_PRESETS[presetKey];
    if (!preset) return;
    
    setLength(preset.length);
    setMode(preset.mode);
    
    if (preset.probability !== undefined) setProbability(preset.probability);
    if (preset.pattern) setPattern(preset.pattern);
    if (preset.noise !== undefined) setNoise(preset.noise);
    if (preset.template) setTemplate(preset.template);
    if (preset.blockSize) setBlockSize(preset.blockSize);
    if (preset.headerPattern) setHeaderPattern(preset.headerPattern);
    
    toast.success(`Applied preset: ${presetKey.replace(/-/g, ' ')}`);
  };

  const applyQuickSize = (size: number) => {
    setLength(size);
  };

  const metrics = calculateExpectedMetrics();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-primary">Generate Binary Data</DialogTitle>
          <DialogDescription>
            Create custom binary data with advanced generation options
          </DialogDescription>
        </DialogHeader>

        {/* Presets */}
        <div className="space-y-2">
          <Label>Quick Presets</Label>
          <Select onValueChange={applyPreset}>
            <SelectTrigger className="bg-input border-border">
              <SelectValue placeholder="Choose a preset..." />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              {Object.keys(GENERATION_PRESETS).map(key => (
                <SelectItem key={key} value={key} className="hover:bg-secondary">
                  <div className="flex flex-col">
                    <span className="font-medium">{key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    <span className="text-xs text-muted-foreground">{PRESET_DESCRIPTIONS[key]}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Length */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="length">Length (bits)</Label>
            <div className="flex gap-1">
              {QUICK_SIZES.map(({ label, value }) => (
                <Button
                  key={value}
                  variant="outline"
                  size="sm"
                  onClick={() => applyQuickSize(value)}
                  className="text-xs h-6 px-2"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
          <Input
            id="length"
            type="number"
            min={8}
            max={10000000}
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value) || 0)}
            className="font-mono bg-input border-border"
          />
          <p className="text-xs text-muted-foreground">
            {(length / 8).toFixed(0)} bytes • {(length / 1024).toFixed(2)} KB • {(length / (1024 * 1024)).toFixed(2)} MB
          </p>
        </div>

        {/* Generation Modes */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-muted">
            <TabsTrigger value="random">Random</TabsTrigger>
            <TabsTrigger value="pattern">Pattern</TabsTrigger>
            <TabsTrigger value="structured">Structured</TabsTrigger>
            <TabsTrigger value="file-format">File Format</TabsTrigger>
          </TabsList>

          <TabsContent value="random" className="space-y-4 mt-4">
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

            <div className="space-y-2">
              <Label htmlFor="seed">Seed (optional)</Label>
              <Input
                id="seed"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="Enter seed for reproducible generation"
                className="bg-input border-border"
              />
              <p className="text-xs text-muted-foreground">Leave empty for random generation</p>
            </div>
          </TabsContent>

          <TabsContent value="pattern" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="pattern">Pattern</Label>
              <Input
                id="pattern"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="e.g., 1010 or 11001100"
                className="font-mono bg-input border-border"
              />
              <p className="text-xs text-muted-foreground">Pattern will repeat to fill the length</p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="noise">
                Noise Level: {(noise * 100).toFixed(0)}%
              </Label>
              <Slider
                id="noise"
                min={0}
                max={0.5}
                step={0.01}
                value={[noise]}
                onValueChange={(values) => setNoise(values[0])}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Randomly flip bits at this rate</p>
            </div>
          </TabsContent>

          <TabsContent value="structured" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="zeros">All Zeros</SelectItem>
                  <SelectItem value="ones">All Ones</SelectItem>
                  <SelectItem value="alternating">Alternating (010101...)</SelectItem>
                  <SelectItem value="blocks">Alternating Blocks</SelectItem>
                  <SelectItem value="gray-code">Gray Code Sequence</SelectItem>
                  <SelectItem value="fibonacci">Fibonacci Sequence</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {template === 'blocks' && (
              <div className="space-y-2">
                <Label htmlFor="blockSize">Block Size</Label>
                <Input
                  id="blockSize"
                  type="number"
                  min={1}
                  max={256}
                  value={blockSize}
                  onChange={(e) => setBlockSize(parseInt(e.target.value) || 8)}
                  className="font-mono bg-input border-border"
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="file-format" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="headerPattern">Header Pattern (8 bits)</Label>
              <Input
                id="headerPattern"
                value={headerPattern}
                onChange={(e) => setHeaderPattern(e.target.value)}
                placeholder="e.g., 11111111"
                className="font-mono bg-input border-border"
                maxLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Will generate: Header (8 bits) + Random Data + Checksum (8 bits)
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Advanced Options */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              Advanced Options
              <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            {mode === 'random' && (
              <div className="space-y-2">
                <Label htmlFor="targetEntropy">Target Entropy (optional)</Label>
                <Input
                  id="targetEntropy"
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={targetEntropy ?? ''}
                  onChange={(e) => setTargetEntropy(e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="0.0 to 1.0"
                  className="font-mono bg-input border-border"
                />
                <p className="text-xs text-muted-foreground">
                  Override probability to match target entropy
                </p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Preview */}
        <div className="p-3 bg-secondary/30 rounded-lg space-y-2 text-xs">
          <div className="font-semibold text-sm text-foreground">Expected Metrics:</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shannon Entropy:</span>
              <span className="font-mono text-foreground">{metrics.entropy.toFixed(3)} bits/symbol</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hamming Weight:</span>
              <span className="font-mono text-foreground">~{metrics.hammingWeight}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Compression Ratio:</span>
              <span className="font-mono text-foreground">~{metrics.compressionRatio}:1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expected Size:</span>
              <span className="font-mono text-foreground">{((metrics.entropy * length) / 8).toFixed(0)} bytes</span>
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
