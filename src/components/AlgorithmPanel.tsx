import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Lightbulb, 
  Settings2, 
  BarChart2, 
  Target, 
  ListChecks, 
  Shield, 
  Cog, 
  Upload,
  FileCode,
  Trash2,
  Play,
  Pause,
  Square,
  SkipForward,
  DollarSign,
  ChevronRight,
  ChevronDown,
  FileJson,
  FileText,
  Download,
  Clock,
  Cpu,
  HardDrive,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { algorithmManager, AlgorithmFile } from '@/lib/algorithmManager';
import { predefinedManager, PredefinedMetric, PredefinedOperation } from '@/lib/predefinedManager';
import { algorithmExecutor, ExecutionResult, ExecutionStep, ExecutionState } from '@/lib/algorithmExecutor';

type AlgorithmTab = 'strategy' | 'presets' | 'results' | 'scoring' | 'metrics' | 'policies' | 'operations';

interface AlgorithmPanelProps {
  onExecutionHistoryChange?: (entries: ExecutionStep[]) => void;
}

export const AlgorithmPanel = ({ onExecutionHistoryChange }: AlgorithmPanelProps) => {
  const [activeTab, setActiveTab] = useState<AlgorithmTab>('strategy');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [expandedOperation, setExpandedOperation] = useState<string | null>(null);
  const [enabledMetrics, setEnabledMetrics] = useState<Set<string>>(new Set());
  const [enabledOperations, setEnabledOperations] = useState<Set<string>>(new Set());
  const [, forceUpdate] = useState({});
  
  // Execution state
  const [executionState, setExecutionState] = useState<ExecutionState>('idle');
  const [currentResult, setCurrentResult] = useState<ExecutionResult | null>(null);
  const [selectedResult, setSelectedResult] = useState<ExecutionResult | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<AlgorithmFile['type']>('strategy');

  useEffect(() => {
    const updateState = () => forceUpdate({});
    const unsubscribe1 = algorithmManager.subscribe(updateState);
    const unsubscribe2 = predefinedManager.subscribe(updateState);
    const unsubscribe3 = algorithmExecutor.subscribe(() => {
      setCurrentResult(algorithmExecutor.getCurrentResult());
      forceUpdate({});
    });
    
    // Load enabled states from localStorage
    const savedMetrics = localStorage.getItem('bitwise_enabled_metrics');
    const savedOps = localStorage.getItem('bitwise_enabled_operations');
    if (savedMetrics) setEnabledMetrics(new Set(JSON.parse(savedMetrics)));
    if (savedOps) setEnabledOperations(new Set(JSON.parse(savedOps)));
    
    // Set up executor callbacks
    algorithmExecutor.setCallbacks({
      onStateChange: (state) => setExecutionState(state),
      onStep: (step) => {
        onExecutionHistoryChange?.(algorithmExecutor.getCurrentResult()?.steps || []);
      },
      onComplete: (result) => {
        toast.success(`Execution completed in ${result.duration}ms`);
      },
      onError: (error) => {
        toast.error(`Execution error: ${error}`);
      },
    });
    
    return () => {
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
    };
  }, [onExecutionHistoryChange]);

  const toggleMetricEnabled = (id: string) => {
    setEnabledMetrics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      localStorage.setItem('bitwise_enabled_metrics', JSON.stringify([...newSet]));
      return newSet;
    });
  };

  const toggleOperationEnabled = (id: string) => {
    setEnabledOperations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      localStorage.setItem('bitwise_enabled_operations', JSON.stringify([...newSet]));
      return newSet;
    });
  };

  const handleUpload = (type: AlgorithmFile['type']) => {
    setUploadType(type);
    if (fileInputRef.current) {
      // Set accept based on type - now includes Python for strategies
      const acceptMap: Record<AlgorithmFile['type'], string> = {
        strategy: '.cpp,.c,.h,.py',
        scoring: '.lua',
        preset: '.json',
        metrics: '.json',
        policies: '.lua',
        operations: '.json',
      };
      fileInputRef.current.accept = acceptMap[type];
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      
      // Validate JSON files
      if (uploadType === 'preset' || uploadType === 'metrics' || uploadType === 'operations') {
        try {
          JSON.parse(content);
        } catch {
          toast.error('Invalid JSON file');
          return;
        }
      }

      algorithmManager.addFile(file.name, content, uploadType);
      toast.success(`${file.name} uploaded`);
    } catch (error) {
      toast.error('Failed to read file');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = (id: string) => {
    algorithmManager.deleteFile(id);
    if (selectedFile === id) setSelectedFile(null);
    toast.success('File deleted');
  };

  const handleRunStrategy = async () => {
    const strategy = selectedFile ? algorithmManager.getFile(selectedFile) : null;
    if (!strategy || strategy.type !== 'strategy') {
      toast.error('Select a strategy file first');
      return;
    }

    // In real implementation, this would run with actual binary data
    const mockBits = '1010101010101010101010101010101010101010101010101010101010101010';
    await algorithmExecutor.startExecution(strategy.id, strategy.name, mockBits, 1000);
  };

  const handlePauseResume = () => {
    if (executionState === 'running') {
      algorithmExecutor.pause();
    } else if (executionState === 'paused') {
      algorithmExecutor.resume();
    }
  };

  const handleStop = () => {
    algorithmExecutor.stop();
  };

  const handleStep = () => {
    algorithmExecutor.stepOnce();
  };

  const handleExportCSV = (result: ExecutionResult) => {
    const csv = algorithmExecutor.exportToCSV(result);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution_${result.strategyName}_${new Date(result.startTime).toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const getFileIcon = (file: AlgorithmFile) => {
    if (file.language === 'python') return <FileCode className="w-4 h-4 text-yellow-500" />;
    if (file.language === 'cpp') return <FileCode className="w-4 h-4 text-cyan-500" />;
    if (file.language === 'lua') return <FileText className="w-4 h-4 text-orange-500" />;
    return <FileJson className="w-4 h-4 text-green-500" />;
  };

  const FileList = ({ 
    files, 
    showCodePreview = true,
    onSelect 
  }: { 
    files: AlgorithmFile[]; 
    showCodePreview?: boolean;
    onSelect?: (id: string) => void;
  }) => (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
            selectedFile === file.id
              ? 'bg-primary/10 border-primary'
              : 'hover:bg-muted/50'
          }`}
          onClick={() => {
            setSelectedFile(file.id);
            onSelect?.(file.id);
          }}
        >
          <div className="flex items-center gap-3">
            {getFileIcon(file)}
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {file.language.toUpperCase()} • {file.content.length} chars • {new Date(file.created).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(file.id);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  const CodePreview = ({ fileId }: { fileId: string }) => {
    const file = algorithmManager.getFile(fileId);
    if (!file) return null;

    return (
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium">Code Preview</h4>
          <Badge variant="outline">{file.language.toUpperCase()}</Badge>
        </div>
        <pre className="bg-muted/50 p-3 rounded-lg text-xs overflow-x-auto max-h-64 overflow-y-auto font-mono">
          {file.content}
        </pre>
      </div>
    );
  };

  // Execution Controls Component
  const ExecutionControls = () => {
    const isRunning = executionState === 'running';
    const isPaused = executionState === 'paused';
    const isActive = isRunning || isPaused;

    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Execution Controls
            </div>
            <Badge variant={
              executionState === 'running' ? 'default' :
              executionState === 'paused' ? 'secondary' :
              executionState === 'completed' ? 'outline' :
              executionState === 'error' ? 'destructive' : 'secondary'
            }>
              {executionState.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <Button 
              size="sm" 
              onClick={handleRunStrategy}
              disabled={isActive || !selectedFile}
              className="flex-1"
            >
              <Play className="w-4 h-4 mr-2" />
              Run
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={handlePauseResume}
              disabled={!isActive}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleStep}
              disabled={!isPaused}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={handleStop}
              disabled={!isActive}
            >
              <Square className="w-4 h-4" />
            </Button>
          </div>

          {currentResult && isActive && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Step {currentResult.steps.length}</span>
                <span>Budget: {currentResult.finalBudget.toFixed(0)}/{currentResult.initialBudget}</span>
              </div>
              <Progress 
                value={(currentResult.initialBudget - currentResult.finalBudget) / currentResult.initialBudget * 100} 
                className="h-2"
              />
              {currentResult.steps.length > 0 && (
                <div className="p-2 bg-muted/30 rounded text-xs font-mono">
                  <span className="text-muted-foreground">Last: </span>
                  <span className="text-cyan-500">{currentResult.steps[currentResult.steps.length - 1].operation}</span>
                  <span className="text-muted-foreground ml-2">
                    Cost: {currentResult.steps[currentResult.steps.length - 1].cost}
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AlgorithmTab)} className="h-full flex flex-col">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      <TabsList className="w-full justify-start rounded-none border-b overflow-x-auto">
        <TabsTrigger value="strategy">Strategy</TabsTrigger>
        <TabsTrigger value="scoring">Scoring</TabsTrigger>
        <TabsTrigger value="presets">Presets</TabsTrigger>
        <TabsTrigger value="metrics">Metrics</TabsTrigger>
        <TabsTrigger value="policies">Policies</TabsTrigger>
        <TabsTrigger value="operations">Operations</TabsTrigger>
        <TabsTrigger value="results">Results</TabsTrigger>
      </TabsList>

      <div className="flex-1 overflow-hidden">
        {/* Strategy Tab - C++/Python Algorithm Files */}
        <TabsContent value="strategy" className="h-full m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <ExecutionControls />
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Strategy Algorithms
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleUpload('strategy')}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload C++/Python
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="text-muted-foreground mb-4">
                    Upload C++ or Python algorithms to process binary data. Python files support TensorFlow/AI-based algorithms.
                  </p>

                  {algorithmManager.getStrategies().length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                      <FileCode className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No algorithms uploaded</p>
                      <p className="text-xs mt-1">Upload .cpp, .c, .h, or .py files</p>
                    </div>
                  ) : (
                    <FileList files={algorithmManager.getStrategies()} />
                  )}

                  {selectedFile && algorithmManager.getFile(selectedFile)?.type === 'strategy' && (
                    <CodePreview fileId={selectedFile} />
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Scoring Tab - Lua Economy Scripts */}
        <TabsContent value="scoring" className="h-full m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Scoring Scripts
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleUpload('scoring')}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Lua
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="text-muted-foreground mb-4">
                    Upload Lua scripts defining operation costs, economy rules, and scoring logic.
                  </p>

                  <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-medium mb-2">Lua Script Example</h4>
                    <pre className="text-xs overflow-x-auto font-mono text-muted-foreground">
{`-- Economy configuration
initial_budget = 1000

-- Operation costs
costs = {
  AND = 5,
  OR = 4,
  XOR = 3,
  NOT = 2,
  SHIFT = 2
}

-- Combined operation discounts
function get_cost(op1, op2)
  if op1 == "AND" and op2 == "XOR" then
    return 6  -- Discount from 8
  end
  return costs[op1] + costs[op2]
end`}
                    </pre>
                  </div>

                  {algorithmManager.getScoringScripts().length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                      <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No scoring scripts uploaded</p>
                      <p className="text-xs mt-1">Upload a .lua file</p>
                    </div>
                  ) : (
                    <FileList files={algorithmManager.getScoringScripts()} />
                  )}

                  {selectedFile && algorithmManager.getFile(selectedFile)?.type === 'scoring' && (
                    <CodePreview fileId={selectedFile} />
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Presets Tab - JSON Configuration */}
        <TabsContent value="presets" className="h-full m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Settings2 className="w-4 h-4" />
                      Presets
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleUpload('preset')}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload JSON
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="text-muted-foreground mb-4">
                    Upload JSON presets that define which algorithm, scoring, policies, metrics, and operations to use together.
                  </p>

                  <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-medium mb-2">Preset JSON Example</h4>
                    <pre className="text-xs overflow-x-auto font-mono text-muted-foreground">
{`{
  "name": "Compression Preset 1",
  "strategy": "lzw_compress.cpp",
  "scoring": "standard_economy.lua",
  "policies": ["no_loops.lua", "max_ops.lua"],
  "metrics": "compression_metrics.json",
  "operations": "basic_ops.json"
}`}
                    </pre>
                  </div>

                  {algorithmManager.getPresets().length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                      <Settings2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No presets uploaded</p>
                      <p className="text-xs mt-1">Upload a .json preset file</p>
                    </div>
                  ) : (
                    <FileList files={algorithmManager.getPresets()} />
                  )}

                  {selectedFile && algorithmManager.getFile(selectedFile)?.type === 'preset' && (
                    <CodePreview fileId={selectedFile} />
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Metrics Tab - Shows pre-defined metrics with enable/disable */}
        <TabsContent value="metrics" className="h-full m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <ListChecks className="w-4 h-4" />
                      Available Metrics ({predefinedManager.getAllMetrics().length})
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {enabledMetrics.size} enabled
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="text-muted-foreground mb-4">
                    Toggle metrics on/off to control which ones the strategy can use. Click to view formula.
                  </p>

                  {predefinedManager.getMetricCategories().map(category => (
                    <div key={category} className="mb-4">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">{category}</h4>
                      <div className="space-y-1">
                        {predefinedManager.getAllMetrics()
                          .filter(m => m.category === category)
                          .map((metric) => (
                            <div
                              key={metric.id}
                              className="border rounded-lg overflow-hidden"
                            >
                              <div
                                className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30"
                                onClick={() => setExpandedMetric(
                                  expandedMetric === metric.id ? null : metric.id
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  {expandedMetric === metric.id 
                                    ? <ChevronDown className="w-4 h-4" />
                                    : <ChevronRight className="w-4 h-4" />
                                  }
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium">{metric.name}</p>
                                      {metric.unit && (
                                        <Badge variant="secondary" className="text-xs">{metric.unit}</Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{metric.description}</p>
                                  </div>
                                </div>
                                <Switch
                                  checked={enabledMetrics.has(metric.id)}
                                  onCheckedChange={() => toggleMetricEnabled(metric.id)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              {expandedMetric === metric.id && (
                                <div className="px-3 pb-3 pt-0 bg-muted/20 border-t">
                                  <div className="bg-background/50 p-3 rounded-lg mt-2">
                                    <p className="text-xs text-muted-foreground mb-1">Formula:</p>
                                    <code className="text-sm font-mono text-cyan-500">{metric.formula}</code>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}

                  {/* Uploaded metric files */}
                  {algorithmManager.getMetricsFiles().length > 0 && (
                    <div className="mt-6 pt-4 border-t">
                      <h4 className="font-medium mb-2 text-xs text-muted-foreground uppercase">Uploaded Files</h4>
                      <FileList files={algorithmManager.getMetricsFiles()} showCodePreview={false} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Policies Tab - Lua Scripts */}
        <TabsContent value="policies" className="h-full m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Policy Scripts
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleUpload('policies')}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Lua
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="text-muted-foreground mb-4">
                    Upload Lua scripts defining rules, constraints, and policies for algorithm execution.
                  </p>

                  <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-medium mb-2">Policy Lua Example</h4>
                    <pre className="text-xs overflow-x-auto font-mono text-muted-foreground">
{`-- Policy: Maximum operations limit
max_operations = 1000
operation_count = 0

function check_operation(op_name)
  operation_count = operation_count + 1
  if operation_count > max_operations then
    return false, "Max operations exceeded"
  end
  return true
end

-- Policy: Forbidden operations
forbidden = { "DELETE", "OVERWRITE" }

function is_allowed(op_name)
  for _, f in ipairs(forbidden) do
    if op_name == f then
      return false
    end
  end
  return true
end`}
                    </pre>
                  </div>

                  {algorithmManager.getPolicies().length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                      <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No policy scripts uploaded</p>
                      <p className="text-xs mt-1">Upload a .lua policy file</p>
                    </div>
                  ) : (
                    <FileList files={algorithmManager.getPolicies()} />
                  )}

                  {selectedFile && algorithmManager.getFile(selectedFile)?.type === 'policies' && (
                    <CodePreview fileId={selectedFile} />
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Operations Tab - Shows pre-defined operations with enable/disable */}
        <TabsContent value="operations" className="h-full m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Cog className="w-4 h-4" />
                      Available Operations ({predefinedManager.getAllOperations().length})
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {enabledOperations.size} enabled
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="text-muted-foreground mb-4">
                    Toggle operations on/off to control what the strategy can use.
                  </p>

                  {predefinedManager.getOperationCategories().map(category => (
                    <div key={category} className="mb-4">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">{category}</h4>
                      <div className="space-y-1">
                        {predefinedManager.getAllOperations()
                          .filter(op => op.category === category)
                          .map((op) => (
                            <div
                              key={op.id}
                              className="border rounded-lg overflow-hidden"
                            >
                              <div
                                className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30"
                                onClick={() => setExpandedOperation(
                                  expandedOperation === op.id ? null : op.id
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  {expandedOperation === op.id 
                                    ? <ChevronDown className="w-4 h-4" />
                                    : <ChevronRight className="w-4 h-4" />
                                  }
                                  <Badge variant={enabledOperations.has(op.id) ? "default" : "secondary"} className="font-mono">
                                    {op.id}
                                  </Badge>
                                  <span className="font-medium">{op.name}</span>
                                </div>
                                <Switch
                                  checked={enabledOperations.has(op.id)}
                                  onCheckedChange={() => toggleOperationEnabled(op.id)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              {expandedOperation === op.id && (
                                <div className="px-3 pb-3 pt-1 bg-muted/20 border-t">
                                  <p className="text-sm text-muted-foreground mb-2">{op.description}</p>
                                  {op.parameters && op.parameters.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {op.parameters.map(p => (
                                        <Badge key={p.name} variant="outline" className="text-xs">
                                          {p.name}: {p.type}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}

                  {/* Uploaded operation files */}
                  {algorithmManager.getOperationsFiles().length > 0 && (
                    <div className="mt-6 pt-4 border-t">
                      <h4 className="font-medium mb-2 text-xs text-muted-foreground uppercase">Uploaded Files</h4>
                      <FileList files={algorithmManager.getOperationsFiles()} showCodePreview={false} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Results Tab - Benchmarking & Export */}
        <TabsContent value="results" className="h-full m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {algorithmExecutor.getResults().length === 0 ? (
                <Card>
                  <CardContent className="text-sm text-muted-foreground py-8">
                    <div className="text-center border border-dashed rounded-lg py-8">
                      <BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No results yet</p>
                      <p className="text-xs mt-1">Run an algorithm to see benchmarking results</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Results List */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <BarChart2 className="w-4 h-4" />
                          Execution Results ({algorithmExecutor.getResults().length})
                        </div>
                        <Button size="sm" variant="outline" onClick={() => algorithmExecutor.clearResults()}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Clear All
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {algorithmExecutor.getResults().map((result) => (
                          <div
                            key={result.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedResult?.id === result.id
                                ? 'bg-primary/10 border-primary'
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => setSelectedResult(result)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {result.success ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-destructive" />
                                )}
                                <span className="font-medium">{result.strategyName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {result.duration}ms
                                </Badge>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleExportCSV(result);
                                  }}
                                >
                                  <Download className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(result.startTime).toLocaleString()} • {result.steps.length} steps
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Selected Result Details */}
                  {selectedResult && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Activity className="w-4 h-4" />
                          Benchmark Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* System Info */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                              <Clock className="w-3 h-3" />
                              Duration
                            </div>
                            <p className="font-mono text-lg">{selectedResult.duration}ms</p>
                          </div>
                          <div className="p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                              <Cpu className="w-3 h-3" />
                              CPU Time
                            </div>
                            <p className="font-mono text-lg">{selectedResult.cpuTimeMs}ms</p>
                          </div>
                          <div className="p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                              <HardDrive className="w-3 h-3" />
                              Peak Memory
                            </div>
                            <p className="font-mono text-lg">{selectedResult.peakMemoryMB.toFixed(2)}MB</p>
                          </div>
                          <div className="p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                              <DollarSign className="w-3 h-3" />
                              Total Cost
                            </div>
                            <p className="font-mono text-lg">{selectedResult.totalCost}</p>
                          </div>
                        </div>

                        {/* Size Changes */}
                        <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                          <h4 className="text-xs font-medium mb-2">Size Analysis</h4>
                          <div className="flex items-center justify-between text-sm">
                            <span>Initial: {selectedResult.initialSize} bits</span>
                            <span className="text-muted-foreground">→</span>
                            <span>Final: {selectedResult.finalSize} bits</span>
                            <Badge variant={selectedResult.compressionRatio > 1 ? "default" : "secondary"}>
                              {selectedResult.compressionRatio.toFixed(2)}x
                            </Badge>
                          </div>
                        </div>

                        {/* Steps Summary */}
                        <div className="mb-4">
                          <h4 className="text-xs font-medium mb-2">Operations ({selectedResult.steps.length})</h4>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {selectedResult.steps.map((step) => (
                              <div key={step.stepNumber} className="flex items-center justify-between p-2 bg-muted/20 rounded text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">#{step.stepNumber}</span>
                                  <Badge variant="outline" className="font-mono">{step.operation}</Badge>
                                </div>
                                <div className="flex items-center gap-3 text-muted-foreground">
                                  <span>Cost: {step.cost}</span>
                                  <span>Size: {step.sizeBefore}→{step.sizeAfter}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Button className="w-full" onClick={() => handleExportCSV(selectedResult)}>
                          <Download className="w-4 h-4 mr-2" />
                          Export CSV Report
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </div>
    </Tabs>
  );
};
