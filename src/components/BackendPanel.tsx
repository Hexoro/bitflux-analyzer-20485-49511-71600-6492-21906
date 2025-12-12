import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Database,
  FileOutput,
  Plus,
  Pencil,
  Trash2,
  Download,
  RotateCcw,
  Calculator,
  Cog,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  predefinedManager,
  PredefinedMetric,
  PredefinedOperation,
} from '@/lib/predefinedManager';

type BackendTab = 'predefined' | 'generator';

export const BackendPanel = () => {
  const [activeTab, setActiveTab] = useState<BackendTab>('predefined');
  const [, forceUpdate] = useState({});

  // Dialog states
  const [metricDialogOpen, setMetricDialogOpen] = useState(false);
  const [operationDialogOpen, setOperationDialogOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<PredefinedMetric | null>(null);
  const [editingOperation, setEditingOperation] = useState<PredefinedOperation | null>(null);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [expandedOperation, setExpandedOperation] = useState<string | null>(null);

  // Form states
  const [metricForm, setMetricForm] = useState<Partial<PredefinedMetric>>({});
  const [operationForm, setOperationForm] = useState<Partial<PredefinedOperation>>({});

  useEffect(() => {
    const unsubscribe = predefinedManager.subscribe(() => forceUpdate({}));
    return unsubscribe;
  }, []);

  const handleAddMetric = () => {
    setEditingMetric(null);
    setMetricForm({
      id: '',
      name: '',
      description: '',
      formula: '',
      unit: '',
      category: '',
    });
    setMetricDialogOpen(true);
  };

  const handleEditMetric = (metric: PredefinedMetric) => {
    setEditingMetric(metric);
    setMetricForm({ ...metric });
    setMetricDialogOpen(true);
  };

  const handleSaveMetric = () => {
    if (!metricForm.id || !metricForm.name || !metricForm.formula) {
      toast.error('ID, Name, and Formula are required');
      return;
    }

    const metric: PredefinedMetric = {
      id: metricForm.id,
      name: metricForm.name,
      description: metricForm.description || '',
      formula: metricForm.formula,
      unit: metricForm.unit,
      category: metricForm.category,
    };

    if (editingMetric) {
      predefinedManager.updateMetric(editingMetric.id, metric);
      toast.success('Metric updated');
    } else {
      predefinedManager.addMetric(metric);
      toast.success('Metric added');
    }
    setMetricDialogOpen(false);
  };

  const handleDeleteMetric = (id: string) => {
    predefinedManager.deleteMetric(id);
    toast.success('Metric deleted');
  };

  const handleAddOperation = () => {
    setEditingOperation(null);
    setOperationForm({
      id: '',
      name: '',
      description: '',
      parameters: [],
      category: '',
    });
    setOperationDialogOpen(true);
  };

  const handleEditOperation = (op: PredefinedOperation) => {
    setEditingOperation(op);
    setOperationForm({ ...op });
    setOperationDialogOpen(true);
  };

  const handleSaveOperation = () => {
    if (!operationForm.id || !operationForm.name) {
      toast.error('ID and Name are required');
      return;
    }

    const operation: PredefinedOperation = {
      id: operationForm.id,
      name: operationForm.name,
      description: operationForm.description || '',
      parameters: operationForm.parameters || [],
      category: operationForm.category,
    };

    if (editingOperation) {
      predefinedManager.updateOperation(editingOperation.id, operation);
      toast.success('Operation updated');
    } else {
      predefinedManager.addOperation(operation);
      toast.success('Operation added');
    }
    setOperationDialogOpen(false);
  };

  const handleDeleteOperation = (id: string) => {
    predefinedManager.deleteOperation(id);
    toast.success('Operation deleted');
  };

  const metrics = predefinedManager.getAllMetrics();
  const operations = predefinedManager.getAllOperations();
  const metricCategories = predefinedManager.getMetricCategories();
  const operationCategories = predefinedManager.getOperationCategories();

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as BackendTab)} className="h-full flex flex-col">
      <TabsList className="w-full justify-start rounded-none border-b">
        <TabsTrigger value="predefined">
          <Database className="w-4 h-4 mr-2" />
          Pre-defined
        </TabsTrigger>
        <TabsTrigger value="generator">
          <FileOutput className="w-4 h-4 mr-2" />
          File Generator
        </TabsTrigger>
      </TabsList>

      <div className="flex-1 overflow-hidden">
        {/* Pre-defined Tab */}
        <TabsContent value="predefined" className="h-full m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              {/* Operations Section */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Cog className="w-4 h-4" />
                      Operations ({operations.length})
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => predefinedManager.resetToDefaults()}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                      </Button>
                      <Button size="sm" variant="default" onClick={handleAddOperation}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {operationCategories.map(category => (
                      <div key={category} className="mb-3">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">{category}</h4>
                        <div className="space-y-1">
                          {operations.filter(op => op.category === category).map(op => (
                            <div
                              key={op.id}
                              className="border rounded-lg overflow-hidden"
                            >
                              <div
                                className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30"
                                onClick={() => setExpandedOperation(expandedOperation === op.id ? null : op.id)}
                              >
                                <div className="flex items-center gap-3">
                                  {expandedOperation === op.id ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-sm font-medium">{op.id}</span>
                                      <span className="text-muted-foreground">-</span>
                                      <span>{op.name}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEditOperation(op)}>
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteOperation(op.id)}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              {expandedOperation === op.id && (
                                <div className="px-3 pb-3 pt-1 bg-muted/20 border-t">
                                  <p className="text-sm text-muted-foreground mb-2">{op.description}</p>
                                  {op.parameters && op.parameters.length > 0 && (
                                    <div>
                                      <span className="text-xs font-medium">Parameters:</span>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {op.parameters.map(p => (
                                          <Badge key={p.name} variant="outline" className="text-xs">
                                            {p.name}: {p.type}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {operations.filter(op => !op.category).length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">Uncategorized</h4>
                        <div className="space-y-1">
                          {operations.filter(op => !op.category).map(op => (
                            <div
                              key={op.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-medium">{op.id}</span>
                                <span className="text-muted-foreground">-</span>
                                <span>{op.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEditOperation(op)}>
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteOperation(op.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Metrics Section */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4" />
                      Metrics ({metrics.length})
                    </div>
                    <Button size="sm" variant="default" onClick={handleAddMetric}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {metricCategories.map(category => (
                      <div key={category} className="mb-3">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">{category}</h4>
                        <div className="space-y-1">
                          {metrics.filter(m => m.category === category).map(metric => (
                            <div
                              key={metric.id}
                              className="border rounded-lg overflow-hidden"
                            >
                              <div
                                className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30"
                                onClick={() => setExpandedMetric(expandedMetric === metric.id ? null : metric.id)}
                              >
                                <div className="flex items-center gap-3">
                                  {expandedMetric === metric.id ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{metric.name}</span>
                                      {metric.unit && (
                                        <Badge variant="secondary" className="text-xs">{metric.unit}</Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{metric.description}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEditMetric(metric)}>
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteMetric(metric.id)}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              {expandedMetric === metric.id && (
                                <div className="px-3 pb-3 pt-1 bg-muted/20 border-t">
                                  <div className="font-mono text-sm bg-background/50 p-2 rounded">
                                    {metric.formula}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {metrics.filter(m => !m.category).length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">Uncategorized</h4>
                        <div className="space-y-1">
                          {metrics.filter(m => !m.category).map(metric => (
                            <div
                              key={metric.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30"
                            >
                              <div>
                                <span className="font-medium">{metric.name}</span>
                                <p className="text-xs text-muted-foreground">{metric.description}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEditMetric(metric)}>
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteMetric(metric.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* File Generator Tab */}
        <TabsContent value="generator" className="h-full m-0">
          <FileGeneratorPanel />
        </TabsContent>
      </div>

      {/* Metric Dialog */}
      <Dialog open={metricDialogOpen} onOpenChange={setMetricDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMetric ? 'Edit Metric' : 'Add Metric'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ID</Label>
                <Input
                  value={metricForm.id || ''}
                  onChange={e => setMetricForm({ ...metricForm, id: e.target.value })}
                  placeholder="entropy"
                  disabled={!!editingMetric}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={metricForm.category || ''}
                  onChange={e => setMetricForm({ ...metricForm, category: e.target.value })}
                  placeholder="Statistics"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={metricForm.name || ''}
                onChange={e => setMetricForm({ ...metricForm, name: e.target.value })}
                placeholder="Shannon Entropy"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={metricForm.description || ''}
                onChange={e => setMetricForm({ ...metricForm, description: e.target.value })}
                placeholder="Measures randomness"
              />
            </div>
            <div className="space-y-2">
              <Label>Formula</Label>
              <Textarea
                value={metricForm.formula || ''}
                onChange={e => setMetricForm({ ...metricForm, formula: e.target.value })}
                placeholder="-Σ(p(x) * log₂(p(x)))"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Input
                value={metricForm.unit || ''}
                onChange={e => setMetricForm({ ...metricForm, unit: e.target.value })}
                placeholder="bits"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMetricDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveMetric}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Operation Dialog */}
      <Dialog open={operationDialogOpen} onOpenChange={setOperationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingOperation ? 'Edit Operation' : 'Add Operation'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ID</Label>
                <Input
                  value={operationForm.id || ''}
                  onChange={e => setOperationForm({ ...operationForm, id: e.target.value })}
                  placeholder="XOR"
                  disabled={!!editingOperation}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={operationForm.category || ''}
                  onChange={e => setOperationForm({ ...operationForm, category: e.target.value })}
                  placeholder="Logic Gates"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={operationForm.name || ''}
                onChange={e => setOperationForm({ ...operationForm, name: e.target.value })}
                placeholder="XOR Gate"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={operationForm.description || ''}
                onChange={e => setOperationForm({ ...operationForm, description: e.target.value })}
                placeholder="Bitwise exclusive OR operation"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOperationDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveOperation}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
};

// File Generator Panel Component
const FileGeneratorPanel = () => {
  const [fileType, setFileType] = useState<'preset' | 'scoring' | 'policies' | 'operations' | 'metrics'>('preset');
  const [generatedContent, setGeneratedContent] = useState('');

  // Form states for different file types
  const [presetForm, setPresetForm] = useState({
    name: '',
    strategy: '',
    scoring: '',
    policies: [] as string[],
    metrics: '',
    operations: '',
  });

  const [scoringForm, setScoringForm] = useState({
    initialBudget: 1000,
    operations: {} as Record<string, number>,
    combos: [] as { ops: string[]; cost: number }[],
  });

  const allMetrics = predefinedManager.getAllMetrics();
  const allOperations = predefinedManager.getAllOperations();

  const generatePreset = () => {
    const content = JSON.stringify({
      name: presetForm.name || 'My Preset',
      strategy: presetForm.strategy || null,
      scoring: presetForm.scoring || null,
      policies: presetForm.policies,
      metrics: presetForm.metrics || null,
      operations: presetForm.operations || null,
    }, null, 2);
    setGeneratedContent(content);
  };

  const generateScoring = () => {
    let lua = `-- Scoring Configuration\n`;
    lua += `-- Generated: ${new Date().toISOString()}\n\n`;
    lua += `initial_budget = ${scoringForm.initialBudget}\n\n`;
    lua += `-- Operation costs\ncosts = {\n`;
    
    allOperations.forEach(op => {
      const cost = scoringForm.operations[op.id] ?? 5;
      lua += `  ${op.id} = ${cost},\n`;
    });
    lua += `}\n\n`;

    lua += `-- Combined operation discounts\nfunction get_cost(op1, op2)\n`;
    scoringForm.combos.forEach(combo => {
      if (combo.ops.length === 2) {
        lua += `  if op1 == "${combo.ops[0]}" and op2 == "${combo.ops[1]}" then\n`;
        lua += `    return ${combo.cost}\n`;
        lua += `  end\n`;
      }
    });
    lua += `  return costs[op1] + costs[op2]\n`;
    lua += `end\n`;

    setGeneratedContent(lua);
  };

  const generateMetrics = () => {
    const selectedMetrics = allMetrics.map(m => ({
      id: m.id,
      name: m.name,
      description: m.description,
      formula: m.formula,
      enabled: true,
    }));
    setGeneratedContent(JSON.stringify({ metrics: selectedMetrics }, null, 2));
  };

  const generateOperations = () => {
    const selectedOps = allOperations.map(op => ({
      id: op.id,
      name: op.name,
      description: op.description,
      enabled: true,
    }));
    setGeneratedContent(JSON.stringify({ operations: selectedOps }, null, 2));
  };

  const generatePolicies = () => {
    let lua = `-- Policy Configuration\n`;
    lua += `-- Generated: ${new Date().toISOString()}\n\n`;
    lua += `-- Maximum operations per run\nmax_operations = 100\n\n`;
    lua += `-- Allowed operations (subset of available)\nallowed_operations = {\n`;
    allOperations.slice(0, 5).forEach(op => {
      lua += `  "${op.id}",\n`;
    });
    lua += `}\n\n`;
    lua += `-- Validation function\nfunction validate(operation, state)\n`;
    lua += `  -- Check if operation is allowed\n`;
    lua += `  local allowed = false\n`;
    lua += `  for _, op in ipairs(allowed_operations) do\n`;
    lua += `    if op == operation then\n`;
    lua += `      allowed = true\n`;
    lua += `      break\n`;
    lua += `    end\n`;
    lua += `  end\n`;
    lua += `  return allowed\n`;
    lua += `end\n`;

    setGeneratedContent(lua);
  };

  const handleGenerate = () => {
    switch (fileType) {
      case 'preset': generatePreset(); break;
      case 'scoring': generateScoring(); break;
      case 'metrics': generateMetrics(); break;
      case 'operations': generateOperations(); break;
      case 'policies': generatePolicies(); break;
    }
  };

  const handleDownload = () => {
    if (!generatedContent) {
      toast.error('Generate content first');
      return;
    }

    const extensions: Record<string, string> = {
      preset: '.json',
      scoring: '.lua',
      policies: '.lua',
      operations: '.json',
      metrics: '.json',
    };

    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated_${fileType}${extensions[fileType]}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('File downloaded');
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileOutput className="w-4 h-4" />
              Generate Configuration Files
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>File Type</Label>
              <Select value={fileType} onValueChange={(v: any) => setFileType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border z-50">
                  <SelectItem value="preset">Preset (JSON)</SelectItem>
                  <SelectItem value="scoring">Scoring Script (Lua)</SelectItem>
                  <SelectItem value="policies">Policy Script (Lua)</SelectItem>
                  <SelectItem value="metrics">Metrics Config (JSON)</SelectItem>
                  <SelectItem value="operations">Operations Config (JSON)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type-specific forms */}
            {fileType === 'preset' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Preset Name</Label>
                  <Input
                    value={presetForm.name}
                    onChange={e => setPresetForm({ ...presetForm, name: e.target.value })}
                    placeholder="My Compression Preset"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Strategy File</Label>
                  <Input
                    value={presetForm.strategy}
                    onChange={e => setPresetForm({ ...presetForm, strategy: e.target.value })}
                    placeholder="lzw_compress.cpp"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Scoring File</Label>
                  <Input
                    value={presetForm.scoring}
                    onChange={e => setPresetForm({ ...presetForm, scoring: e.target.value })}
                    placeholder="standard_economy.lua"
                  />
                </div>
              </div>
            )}

            {fileType === 'scoring' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Initial Budget</Label>
                  <Input
                    type="number"
                    value={scoringForm.initialBudget}
                    onChange={e => setScoringForm({ ...scoringForm, initialBudget: parseInt(e.target.value) || 1000 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Operation Costs (defaults to 5)</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {allOperations.slice(0, 8).map(op => (
                      <div key={op.id} className="flex items-center gap-2">
                        <span className="text-xs font-mono w-12">{op.id}</span>
                        <Input
                          type="number"
                          className="h-7 text-xs"
                          value={scoringForm.operations[op.id] ?? 5}
                          onChange={e => setScoringForm({
                            ...scoringForm,
                            operations: { ...scoringForm.operations, [op.id]: parseInt(e.target.value) || 0 }
                          })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleGenerate} className="flex-1">
                Generate
              </Button>
              <Button variant="outline" onClick={handleDownload} disabled={!generatedContent}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>

        {generatedContent && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Generated Content</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted/50 p-3 rounded-lg text-xs overflow-x-auto max-h-80 overflow-y-auto font-mono">
                {generatedContent}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
};
