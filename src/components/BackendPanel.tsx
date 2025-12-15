import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
  Info,
  Code,
  Variable,
  BookOpen,
  Upload,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileArchive,
  Play,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  predefinedManager,
  PredefinedMetric,
  PredefinedOperation,
} from '@/lib/predefinedManager';
import { algorithmManager } from '@/lib/algorithmManager';
import { fileValidator, ValidationResult } from '@/lib/fileValidator';
import { resultExporter } from '@/lib/resultExporter';
import { MetricsCodeEditor } from './MetricsCodeEditor';
import { OperationsCodeEditor } from './OperationsCodeEditor';

type BackendTab = 'predefined' | 'generator' | 'validator' | 'info' | 'metrics-code' | 'operations-code';

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
      <TabsList className="w-full justify-start rounded-none border-b overflow-x-auto">
        <TabsTrigger value="predefined">
          <Database className="w-4 h-4 mr-2" />
          Pre-defined
        </TabsTrigger>
        <TabsTrigger value="metrics-code">
          <Calculator className="w-4 h-4 mr-2" />
          Metrics Code
        </TabsTrigger>
        <TabsTrigger value="operations-code">
          <Cog className="w-4 h-4 mr-2" />
          Ops Code
        </TabsTrigger>
        <TabsTrigger value="generator">
          <FileOutput className="w-4 h-4 mr-2" />
          Generator
        </TabsTrigger>
        <TabsTrigger value="validator">
          <FileCheck className="w-4 h-4 mr-2" />
          Validator
        </TabsTrigger>
        <TabsTrigger value="info">
          <Info className="w-4 h-4 mr-2" />
          Info
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
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Metrics Code Editor Tab */}
        <TabsContent value="metrics-code" className="h-full m-0 p-4">
          <MetricsCodeEditor />
        </TabsContent>

        {/* Operations Code Editor Tab */}
        <TabsContent value="operations-code" className="h-full m-0 p-4">
          <OperationsCodeEditor />
        </TabsContent>

        {/* File Generator Tab */}
        <TabsContent value="generator" className="h-full m-0">
          <FileGeneratorPanel />
        </TabsContent>

        {/* Validator Tab */}
        <TabsContent value="validator" className="h-full m-0">
          <ValidatorPanel />
        </TabsContent>

        {/* Info Tab */}
        <TabsContent value="info" className="h-full m-0">
          <InfoPanel />
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

// File Validator Panel Component
const ValidatorPanel = () => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; content: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const content = await file.text();
    setSelectedFile({ name: file.name, content });
    setValidationResult(null);
  };

  const handleValidate = async () => {
    if (!selectedFile) return;

    setIsValidating(true);
    try {
      const result = await fileValidator.validateFile(selectedFile.name, selectedFile.content, true);
      setValidationResult(result);
      
      if (result.valid && result.errors.length === 0) {
        toast.success('File validation passed!');
      } else if (result.errors.length > 0) {
        toast.error(`Validation failed with ${result.errors.length} error(s)`);
      } else {
        toast.info(`Validation passed with ${result.warnings.length} warning(s)`);
      }
    } catch (error) {
      toast.error('Validation failed: ' + error);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileCheck className="w-4 h-4" />
              File Validator (Full Sandbox Test)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload strategy, scoring, policy, or configuration files for full validation with sandbox testing.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".cpp,.c,.h,.py,.lua,.json"
              className="hidden"
            />

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1">
                <Upload className="w-4 h-4 mr-2" />
                {selectedFile ? selectedFile.name : 'Select File'}
              </Button>
              <Button onClick={handleValidate} disabled={!selectedFile || isValidating}>
                {isValidating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                Validate
              </Button>
            </div>

            {selectedFile && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{selectedFile.name}</span>
                  <Badge variant="outline">{selectedFile.content.length} chars</Badge>
                </div>
                <pre className="text-xs overflow-x-auto max-h-32 overflow-y-auto font-mono text-muted-foreground">
                  {selectedFile.content.slice(0, 500)}{selectedFile.content.length > 500 ? '...' : ''}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {validationResult && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                {validationResult.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive" />
                )}
                Validation Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={validationResult.valid ? 'default' : 'destructive'}>
                  {validationResult.valid ? 'VALID' : 'INVALID'}
                </Badge>
                <Badge variant="outline">{validationResult.fileType}</Badge>
              </div>

              {validationResult.errors.length > 0 && (
                <div className="space-y-1">
                  <h4 className="text-xs font-medium text-destructive flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Errors ({validationResult.errors.length})
                  </h4>
                  {validationResult.errors.map((err, i) => (
                    <div key={i} className="p-2 bg-destructive/10 rounded text-xs text-destructive">
                      {err}
                    </div>
                  ))}
                </div>
              )}

              {validationResult.warnings.length > 0 && (
                <div className="space-y-1">
                  <h4 className="text-xs font-medium text-yellow-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Warnings ({validationResult.warnings.length})
                  </h4>
                  {validationResult.warnings.map((warn, i) => (
                    <div key={i} className="p-2 bg-yellow-500/10 rounded text-xs text-yellow-600">
                      {warn}
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-1">
                <h4 className="text-xs font-medium">API Compliance</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-muted/30 rounded">
                    <span className="text-muted-foreground">Operations Used:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {validationResult.apiCompliance.usedOperations.map(op => (
                        <Badge
                          key={op}
                          variant={validationResult.apiCompliance.unknownOperations.includes(op) ? 'destructive' : 'outline'}
                          className="text-xs"
                        >
                          {op}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="p-2 bg-muted/30 rounded">
                    <span className="text-muted-foreground">Metrics Used:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {validationResult.apiCompliance.usedMetrics.map(m => (
                        <Badge
                          key={m}
                          variant={validationResult.apiCompliance.unknownMetrics.includes(m) ? 'destructive' : 'outline'}
                          className="text-xs"
                        >
                          {m}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {validationResult.sandboxResult && (
                <div className="space-y-1">
                  <h4 className="text-xs font-medium flex items-center gap-1">
                    <Play className="w-3 h-3" /> Sandbox Test
                  </h4>
                  <div className={`p-2 rounded text-xs ${validationResult.sandboxResult.success ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
                    <div className="flex items-center justify-between">
                      <span>{validationResult.sandboxResult.success ? 'Passed' : 'Failed'}</span>
                      <Badge variant="outline">{validationResult.sandboxResult.duration.toFixed(2)}ms</Badge>
                    </div>
                    {validationResult.sandboxResult.error && (
                      <p className="mt-1 text-destructive">{validationResult.sandboxResult.error}</p>
                    )}
                    {validationResult.sandboxResult.output && (
                      <pre className="mt-2 p-2 bg-background/50 rounded overflow-x-auto max-h-32">
                        {JSON.stringify(validationResult.sandboxResult.output, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
};

// File Generator Panel Component
const FileGeneratorPanel = () => {
  const [fileType, setFileType] = useState<'preset' | 'scoring' | 'policies' | 'operations' | 'metrics'>('preset');
  const [generatedContent, setGeneratedContent] = useState('');
  const [presetFiles, setPresetFiles] = useState<{
    strategy?: { name: string; content: string };
    scoring?: { name: string; content: string };
    policies?: Array<{ name: string; content: string }>;
  }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<'strategy' | 'scoring' | 'policies'>('strategy');

  const [presetForm, setPresetForm] = useState({
    name: '',
  });

  const [scoringForm, setScoringForm] = useState({
    initialBudget: 1000,
    operations: {} as Record<string, number>,
  });

  const allMetrics = predefinedManager.getAllMetrics();
  const allOperations = predefinedManager.getAllOperations();

  const handlePresetFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const content = await file.text();
    
    if (uploadTarget === 'strategy') {
      setPresetFiles(prev => ({ ...prev, strategy: { name: file.name, content } }));
    } else if (uploadTarget === 'scoring') {
      setPresetFiles(prev => ({ ...prev, scoring: { name: file.name, content } }));
    } else if (uploadTarget === 'policies') {
      setPresetFiles(prev => ({
        ...prev,
        policies: [...(prev.policies || []), { name: file.name, content }]
      }));
    }
    toast.success(`Added ${file.name} to preset`);
  };

  const generatePreset = () => {
    const content = JSON.stringify({
      name: presetForm.name || 'My Preset',
      strategy: presetFiles.strategy?.name || null,
      scoring: presetFiles.scoring?.name || null,
      policies: presetFiles.policies?.map(p => p.name) || [],
      created: new Date().toISOString(),
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
    lua += `-- Get cost for single operation\nfunction get_cost(op_name)\n`;
    lua += `  return costs[op_name] or 5\n`;
    lua += `end\n\n`;
    lua += `-- Get combined cost (with potential discounts)\nfunction get_combo_cost(op1, op2)\n`;
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
      unit: m.unit,
      enabled: true,
    }));
    setGeneratedContent(JSON.stringify({ metrics: selectedMetrics }, null, 2));
  };

  const generateOperations = () => {
    const selectedOps = allOperations.map(op => ({
      id: op.id,
      name: op.name,
      description: op.description,
      parameters: op.parameters,
      enabled: true,
    }));
    setGeneratedContent(JSON.stringify({ operations: selectedOps }, null, 2));
  };

  const generatePolicies = () => {
    let lua = `-- Policy Configuration\n`;
    lua += `-- Generated: ${new Date().toISOString()}\n\n`;
    lua += `max_operations = 1000\n\n`;
    lua += `allowed_operations = {\n`;
    allOperations.slice(0, 10).forEach(op => {
      lua += `  "${op.id}",\n`;
    });
    lua += `}\n\n`;
    lua += `forbidden = {}\n\n`;
    lua += `function validate(op_name, state)\n`;
    lua += `  for _, op in ipairs(forbidden) do\n`;
    lua += `    if op == op_name then\n`;
    lua += `      return false, "Operation is forbidden"\n`;
    lua += `    end\n`;
    lua += `  end\n`;
    lua += `  return true\n`;
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

  const handleDownloadPresetZip = async () => {
    if (!presetForm.name) {
      toast.error('Enter preset name');
      return;
    }

    try {
      const blob = await resultExporter.exportPresetAsZip(presetForm.name, {
        strategy: presetFiles.strategy,
        scoring: presetFiles.scoring,
        policies: presetFiles.policies,
      });
      resultExporter.downloadBlob(blob, `${presetForm.name}.zip`);
      toast.success('Preset ZIP downloaded');
    } catch (error) {
      toast.error('Failed to create ZIP: ' + error);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handlePresetFileUpload}
          accept={uploadTarget === 'strategy' ? '.cpp,.c,.py' : '.lua'}
          className="hidden"
        />

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
                  <SelectItem value="preset">Preset Bundle (ZIP)</SelectItem>
                  <SelectItem value="scoring">Scoring Script (Lua)</SelectItem>
                  <SelectItem value="policies">Policy Script (Lua)</SelectItem>
                  <SelectItem value="metrics">Metrics Config (JSON)</SelectItem>
                  <SelectItem value="operations">Operations Config (JSON)</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                  <Label>Add Files to Bundle</Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setUploadTarget('strategy');
                        fileInputRef.current?.click();
                      }}
                    >
                      + Strategy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setUploadTarget('scoring');
                        fileInputRef.current?.click();
                      }}
                    >
                      + Scoring
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setUploadTarget('policies');
                        fileInputRef.current?.click();
                      }}
                    >
                      + Policy
                    </Button>
                  </div>

                  <div className="space-y-1 mt-2">
                    {presetFiles.strategy && (
                      <Badge variant="outline" className="mr-1">
                        📄 {presetFiles.strategy.name}
                      </Badge>
                    )}
                    {presetFiles.scoring && (
                      <Badge variant="outline" className="mr-1">
                        💰 {presetFiles.scoring.name}
                      </Badge>
                    )}
                    {presetFiles.policies?.map(p => (
                      <Badge key={p.name} variant="outline" className="mr-1">
                        🛡️ {p.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button onClick={handleDownloadPresetZip} className="w-full" disabled={!presetForm.name}>
                  <FileArchive className="w-4 h-4 mr-2" />
                  Download Preset ZIP
                </Button>
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
                  <Label>Operation Costs</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {allOperations.slice(0, 10).map(op => (
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

            {fileType !== 'preset' && (
              <div className="flex gap-2">
                <Button onClick={handleGenerate} className="flex-1">
                  Generate
                </Button>
                <Button variant="outline" onClick={handleDownload} disabled={!generatedContent}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {generatedContent && fileType !== 'preset' && (
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

// Info Panel Component - Strategy Writing Guide
const InfoPanel = () => {
  const allMetrics = predefinedManager.getAllMetrics();
  const allOperations = predefinedManager.getAllOperations();

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BookOpen className="w-4 h-4" />
              Strategy Development Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="text-muted-foreground mb-4">
              Complete guide for writing strategies, scoring scripts, and policies. Strategies access metrics files, operations files, policies, and receive initial costs from scoring files during execution.
            </p>

            <Accordion type="multiple" defaultValue={['workflow', 'globals']} className="space-y-2">
              {/* Execution Workflow */}
              <AccordionItem value="workflow" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-500" />
                    <span>Execution Workflow</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-3 text-xs">
                    <p className="text-muted-foreground">When a strategy runs, the following happens:</p>
                    <ol className="list-decimal list-inside space-y-2">
                      <li><strong>Load Context:</strong> Binary data, metrics file, and operations file are loaded</li>
                      <li><strong>Load Scoring:</strong> Initial budget and operation costs are set from scoring script</li>
                      <li><strong>Load Policies:</strong> Allowed operations and constraints are enforced</li>
                      <li><strong>Execute Strategy:</strong> Your code runs with access to all configured resources</li>
                      <li><strong>Track Metrics:</strong> Each operation's effect on metrics is recorded</li>
                      <li><strong>Export Results:</strong> Full benchmark and CSV exports are generated</li>
                    </ol>
                    <div className="p-2 bg-cyan-500/10 rounded mt-2">
                      <p className="text-cyan-500">💡 Strategies can query which operations/metrics are enabled before using them</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Global Variables */}
              <AccordionItem value="globals" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Variable className="w-4 h-4 text-cyan-500" />
                    <span>Global Variables</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-3 font-mono text-xs">
                    <div className="p-2 bg-muted/30 rounded">
                      <code className="text-cyan-500">bits</code>
                      <span className="text-muted-foreground ml-2">: string</span>
                      <p className="text-muted-foreground mt-1 font-sans">Current binary stream</p>
                    </div>
                    <div className="p-2 bg-muted/30 rounded">
                      <code className="text-cyan-500">bits_length</code>
                      <span className="text-muted-foreground ml-2">: number</span>
                      <p className="text-muted-foreground mt-1 font-sans">Length of binary stream</p>
                    </div>
                    <div className="p-2 bg-muted/30 rounded">
                      <code className="text-cyan-500">budget</code>
                      <span className="text-muted-foreground ml-2">: number</span>
                      <p className="text-muted-foreground mt-1 font-sans">Current remaining budget (from scoring)</p>
                    </div>
                    <div className="p-2 bg-muted/30 rounded">
                      <code className="text-cyan-500">initial_budget</code>
                      <span className="text-muted-foreground ml-2">: number</span>
                      <p className="text-muted-foreground mt-1 font-sans">Starting budget from scoring script</p>
                    </div>
                    <div className="p-2 bg-muted/30 rounded">
                      <code className="text-cyan-500">enabled_metrics</code>
                      <span className="text-muted-foreground ml-2">: string[]</span>
                      <p className="text-muted-foreground mt-1 font-sans">List of metrics you can query</p>
                    </div>
                    <div className="p-2 bg-muted/30 rounded">
                      <code className="text-cyan-500">enabled_operations</code>
                      <span className="text-muted-foreground ml-2">: string[]</span>
                      <p className="text-muted-foreground mt-1 font-sans">List of operations you can use</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Core Functions */}
              <AccordionItem value="functions" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-yellow-500" />
                    <span>Core Functions</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-3 font-mono text-xs">
                    <div className="p-2 bg-muted/30 rounded">
                      <code className="text-yellow-500">apply_operation</code>
                      <span className="text-muted-foreground">(op_name, params) → string</span>
                      <p className="text-muted-foreground mt-1 font-sans">Apply operation to bits, auto-deducts cost</p>
                    </div>
                    <div className="p-2 bg-muted/30 rounded">
                      <code className="text-yellow-500">get_cost</code>
                      <span className="text-muted-foreground">(op_name) → number</span>
                      <p className="text-muted-foreground mt-1 font-sans">Get cost from scoring config</p>
                    </div>
                    <div className="p-2 bg-muted/30 rounded">
                      <code className="text-yellow-500">get_metric</code>
                      <span className="text-muted-foreground">(metric_name) → number</span>
                      <p className="text-muted-foreground mt-1 font-sans">Calculate metric for current bits</p>
                    </div>
                    <div className="p-2 bg-muted/30 rounded">
                      <code className="text-yellow-500">is_operation_allowed</code>
                      <span className="text-muted-foreground">(op_name) → boolean</span>
                      <p className="text-muted-foreground mt-1 font-sans">Check policy and enabled status</p>
                    </div>
                    <div className="p-2 bg-muted/30 rounded">
                      <code className="text-yellow-500">deduct_budget</code>
                      <span className="text-muted-foreground">(amount) → boolean</span>
                      <p className="text-muted-foreground mt-1 font-sans">Manual budget deduction</p>
                    </div>
                    <div className="p-2 bg-muted/30 rounded">
                      <code className="text-yellow-500">log</code>
                      <span className="text-muted-foreground">(message) → void</span>
                      <p className="text-muted-foreground mt-1 font-sans">Log to execution history</p>
                    </div>
                    <div className="p-2 bg-muted/30 rounded">
                      <code className="text-yellow-500">halt</code>
                      <span className="text-muted-foreground">() → void</span>
                      <p className="text-muted-foreground mt-1 font-sans">Stop execution</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Available Operations */}
              <AccordionItem value="operations" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Cog className="w-4 h-4 text-green-500" />
                    <span>Available Operations ({allOperations.length})</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-1 font-mono text-xs max-h-60 overflow-y-auto">
                    {allOperations.map(op => (
                      <div key={op.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <div>
                          <code className="text-green-500">{op.id}</code>
                          <span className="text-muted-foreground ml-2 font-sans">- {op.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">{op.category}</Badge>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Available Metrics */}
              <AccordionItem value="metrics" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-purple-500" />
                    <span>Available Metrics ({allMetrics.length})</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-1 font-mono text-xs max-h-60 overflow-y-auto">
                    {allMetrics.map(m => (
                      <div key={m.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <div>
                          <code className="text-purple-500">{m.id}</code>
                          <span className="text-muted-foreground ml-2 font-sans">- {m.name}</span>
                        </div>
                        {m.unit && <Badge variant="outline" className="text-xs">{m.unit}</Badge>}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* C++ Example */}
              <AccordionItem value="cpp" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-cyan-500" />
                    <span>C++ Strategy Example</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <pre className="bg-muted/50 p-3 rounded-lg text-xs overflow-x-auto font-mono">
{`// strategy.cpp
#include "bitwise_api.h"

void execute() {
    // Check what's available
    log("Enabled ops: " + enabled_operations.size());
    log("Initial budget: " + to_string(initial_budget));
    
    while (budget > 0) {
        double entropy = get_metric("entropy");
        
        if (entropy > 0.9 && is_operation_allowed("XOR")) {
            int cost = get_cost("XOR");
            if (budget >= cost) {
                apply_operation("XOR", {{"mask", "10101010"}});
            }
        } else {
            halt();
        }
    }
}`}
                  </pre>
                </AccordionContent>
              </AccordionItem>

              {/* Python Example */}
              <AccordionItem value="python" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-yellow-500" />
                    <span>Python Strategy Example (AI)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <pre className="bg-muted/50 p-3 rounded-lg text-xs overflow-x-auto font-mono">
{`# strategy.py
from bitwise_api import *

def execute():
    log(f"Budget: {budget}, Ops: {len(enabled_operations)}")
    
    # Calculate current state
    entropy = get_metric("entropy")
    balance = get_metric("balance")
    
    # Simple heuristic (or use ML model)
    while budget > 0:
        if entropy > 0.8 and is_operation_allowed("XOR"):
            apply_operation("XOR", {"mask": "11110000"})
        elif balance < 0.4 and is_operation_allowed("OR"):
            apply_operation("OR", {"mask": "00001111"})
        else:
            break
    
    log(f"Final entropy: {get_metric('entropy')}")
`}
                  </pre>
                </AccordionContent>
              </AccordionItem>

              {/* Lua Scoring Example */}
              <AccordionItem value="lua" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-orange-500" />
                    <span>Lua Scoring Script Example</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <pre className="bg-muted/50 p-3 rounded-lg text-xs overflow-x-auto font-mono">
{`-- scoring.lua
initial_budget = 1000

-- Operation costs (strategy reads these)
costs = {
    AND = 5, OR = 4, XOR = 6, NOT = 2,
    SHL = 3, SHR = 3, ROL = 4, ROR = 4,
    INSERT = 8, DELETE = 10, MOVE = 12
}

-- Combo discounts (non-linear costs)
combos = {
    { ops = {"XOR", "NOT"}, cost = 6 },  -- Discount
    { ops = {"SHL", "SHR"}, cost = 4 },  -- Discount
}

function get_cost(op_name)
    return costs[op_name] or 5
end

function get_combo_cost(op1, op2)
    for _, combo in ipairs(combos) do
        if combo.ops[1] == op1 and combo.ops[2] == op2 then
            return combo.cost
        end
    end
    return costs[op1] + costs[op2]
end`}
                  </pre>
                </AccordionContent>
              </AccordionItem>

              {/* Policy Example */}
              <AccordionItem value="policy" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-red-500" />
                    <span>Lua Policy Script Example</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <pre className="bg-muted/50 p-3 rounded-lg text-xs overflow-x-auto font-mono">
{`-- policy.lua
max_operations = 100
operation_count = 0

-- Only allow these operations
allowed_operations = {
    "XOR", "AND", "OR", "NOT",
    "SHL", "SHR"
}

-- These are forbidden regardless
forbidden = { "DELETE", "MOVE" }

function validate(op_name, state)
    operation_count = operation_count + 1
    
    if operation_count > max_operations then
        return false, "Max operations exceeded"
    end
    
    for _, f in ipairs(forbidden) do
        if op_name == f then
            return false, "Operation forbidden"
        end
    end
    
    return true
end`}
                  </pre>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
};
