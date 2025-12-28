/**
 * Generation Settings Tab for Backend Mode
 * Allows editing default generation presets and settings
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  GENERATION_PRESETS, 
  PRESET_DESCRIPTIONS, 
  GenerationConfig,
  QUICK_SIZES,
} from '@/lib/generationPresets';

const STORAGE_KEY = 'bsee_custom_generation_presets';

interface CustomPreset {
  id: string;
  name: string;
  description: string;
  config: GenerationConfig;
}

export const GenerationTab = () => {
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<CustomPreset | null>(null);
  const [expandedPreset, setExpandedPreset] = useState<string | null>(null);

  const [form, setForm] = useState<{
    name: string;
    description: string;
    config: GenerationConfig;
  }>({
    name: '',
    description: '',
    config: {
      mode: 'random',
      length: 1024,
      probability: 0.5,
    },
  });

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        setCustomPresets(JSON.parse(data));
      }
    } catch (e) {
      console.error('Failed to load custom presets:', e);
    }
  };

  const savePresets = (presets: CustomPreset[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
      setCustomPresets(presets);
    } catch (e) {
      console.error('Failed to save presets:', e);
    }
  };

  const handleAdd = () => {
    setEditingPreset(null);
    setForm({
      name: '',
      description: '',
      config: {
        mode: 'random',
        length: 1024,
        probability: 0.5,
      },
    });
    setDialogOpen(true);
  };

  const handleEdit = (preset: CustomPreset) => {
    setEditingPreset(preset);
    setForm({
      name: preset.name,
      description: preset.description,
      config: { ...preset.config },
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }

    const preset: CustomPreset = {
      id: editingPreset?.id || `custom_${Date.now()}`,
      name: form.name,
      description: form.description,
      config: form.config,
    };

    let newPresets: CustomPreset[];
    if (editingPreset) {
      newPresets = customPresets.map(p => p.id === editingPreset.id ? preset : p);
      toast.success('Preset updated');
    } else {
      newPresets = [...customPresets, preset];
      toast.success('Preset created');
    }

    savePresets(newPresets);
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    const newPresets = customPresets.filter(p => p.id !== id);
    savePresets(newPresets);
    toast.success('Preset deleted');
  };

  const handleReset = () => {
    savePresets([]);
    toast.success('Custom presets cleared');
  };

  const allPresets = [
    ...Object.entries(GENERATION_PRESETS).map(([key, config]) => ({
      id: key,
      name: key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: PRESET_DESCRIPTIONS[key] || '',
      config,
      isBuiltin: true,
    })),
    ...customPresets.map(p => ({ ...p, isBuiltin: false })),
  ];

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Generation Presets ({allPresets.length})
              </div>
              <div className="flex items-center gap-2">
                {customPresets.length > 0 && (
                  <Button size="sm" variant="outline" onClick={handleReset}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Clear Custom
                  </Button>
                )}
                <Button size="sm" variant="default" onClick={handleAdd}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Preset
                </Button>
              </div>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Manage generation presets. Built-in presets cannot be edited, but you can create custom ones.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Built-in Presets */}
              <h4 className="text-xs font-medium text-muted-foreground uppercase mt-2">Built-in Presets</h4>
              {allPresets.filter(p => p.isBuiltin).map(preset => (
                <div key={preset.id} className="border rounded-lg overflow-hidden">
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30"
                    onClick={() => setExpandedPreset(expandedPreset === preset.id ? null : preset.id)}
                  >
                    <div className="flex items-center gap-3">
                      {expandedPreset === preset.id ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <div>
                        <span className="font-medium">{preset.name}</span>
                        <p className="text-xs text-muted-foreground">{preset.description}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">{preset.config.mode}</Badge>
                  </div>
                  {expandedPreset === preset.id && (
                    <div className="px-3 pb-3 pt-1 bg-muted/20 border-t text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Length:</span>
                        <span className="font-mono">{preset.config.length} bits</span>
                      </div>
                      {preset.config.probability !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Probability:</span>
                          <span className="font-mono">{(preset.config.probability * 100).toFixed(0)}%</span>
                        </div>
                      )}
                      {preset.config.template && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Template:</span>
                          <span className="font-mono">{preset.config.template}</span>
                        </div>
                      )}
                      {preset.config.pattern && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pattern:</span>
                          <span className="font-mono">{preset.config.pattern}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Custom Presets */}
              {customPresets.length > 0 && (
                <>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase mt-4">Custom Presets</h4>
                  {customPresets.map(preset => (
                    <div key={preset.id} className="border rounded-lg overflow-hidden border-primary/30">
                      <div
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30"
                        onClick={() => setExpandedPreset(expandedPreset === preset.id ? null : preset.id)}
                      >
                        <div className="flex items-center gap-3">
                          {expandedPreset === preset.id ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                          <div>
                            <span className="font-medium">{preset.name}</span>
                            <p className="text-xs text-muted-foreground">{preset.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <Badge variant="outline" className="text-xs">{preset.config.mode}</Badge>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(preset)}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(preset.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      {expandedPreset === preset.id && (
                        <div className="px-3 pb-3 pt-1 bg-muted/20 border-t text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Length:</span>
                            <span className="font-mono">{preset.config.length} bits</span>
                          </div>
                          {preset.config.probability !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Probability:</span>
                              <span className="font-mono">{(preset.config.probability * 100).toFixed(0)}%</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Size Reference */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Quick Size Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              {QUICK_SIZES.map(({ label, value }) => (
                <div key={value} className="p-2 bg-muted/30 rounded text-center">
                  <div className="font-medium text-sm">{label}</div>
                  <div className="text-xs text-muted-foreground font-mono">{value.toLocaleString()} bits</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPreset ? 'Edit Preset' : 'Create Preset'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="My Custom Preset"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What this preset does"
              />
            </div>

            <div className="space-y-2">
              <Label>Mode</Label>
              <Select 
                value={form.config.mode} 
                onValueChange={(v: any) => setForm({ ...form, config: { ...form.config, mode: v } })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="random">Random</SelectItem>
                  <SelectItem value="pattern">Pattern</SelectItem>
                  <SelectItem value="structured">Structured</SelectItem>
                  <SelectItem value="file-format">File Format</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Length (bits)</Label>
              <Input
                type="number"
                value={form.config.length}
                onChange={(e) => setForm({ 
                  ...form, 
                  config: { ...form.config, length: parseInt(e.target.value) || 1024 } 
                })}
                min={8}
                max={10000000}
              />
            </div>

            {form.config.mode === 'random' && (
              <div className="space-y-2">
                <Label>Probability of 1s: {((form.config.probability || 0.5) * 100).toFixed(0)}%</Label>
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={[form.config.probability || 0.5]}
                  onValueChange={([v]) => setForm({ 
                    ...form, 
                    config: { ...form.config, probability: v } 
                  })}
                />
              </div>
            )}

            {form.config.mode === 'pattern' && (
              <div className="space-y-2">
                <Label>Pattern</Label>
                <Input
                  value={form.config.pattern || '1010'}
                  onChange={(e) => setForm({ 
                    ...form, 
                    config: { ...form.config, pattern: e.target.value } 
                  })}
                  placeholder="e.g., 1010 or 11001100"
                  className="font-mono"
                />
              </div>
            )}

            {form.config.mode === 'structured' && (
              <div className="space-y-2">
                <Label>Template</Label>
                <Select 
                  value={form.config.template || 'alternating'} 
                  onValueChange={(v: any) => setForm({ 
                    ...form, 
                    config: { ...form.config, template: v } 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zeros">All Zeros</SelectItem>
                    <SelectItem value="ones">All Ones</SelectItem>
                    <SelectItem value="alternating">Alternating</SelectItem>
                    <SelectItem value="blocks">Blocks</SelectItem>
                    <SelectItem value="gray-code">Gray Code</SelectItem>
                    <SelectItem value="fibonacci">Fibonacci</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Generation Code (optional - overrides settings above)</Label>
              <Textarea
                value={(form as any).code || ''}
                onChange={(e) => setForm({ ...form, code: e.target.value } as any)}
                className="font-mono text-xs h-32"
                placeholder={`function generate(length) {
  // Return a string of 0s and 1s
  let bits = '';
  for (let i = 0; i < length; i++) {
    bits += Math.random() > 0.5 ? '1' : '0';
  }
  return bits;
}`}
              />
              <p className="text-xs text-muted-foreground">
                Write JavaScript code that generates binary data. Function receives length and returns bit string.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
};
