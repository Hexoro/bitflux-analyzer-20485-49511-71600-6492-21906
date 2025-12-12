import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Lightbulb, 
  Settings2, 
  BarChart2, 
  Target, 
  ListChecks, 
  Shield, 
  Cog, 
  History, 
  Upload,
  FileCode,
  Trash2,
  Play,
  RefreshCw,
  DollarSign,
  ChevronRight,
  ChevronDown,
  FileJson,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { algorithmManager, AlgorithmFile, MetricDefinition } from '@/lib/algorithmManager';

type AlgorithmTab = 'strategy' | 'presets' | 'results' | 'scoring' | 'metrics' | 'policies' | 'operations' | 'history';

export const AlgorithmPanel = () => {
  const [activeTab, setActiveTab] = useState<AlgorithmTab>('strategy');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [, forceUpdate] = useState({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<AlgorithmFile['type']>('strategy');

  useEffect(() => {
    const updateState = () => forceUpdate({});
    const unsubscribe = algorithmManager.subscribe(updateState);
    return unsubscribe;
  }, []);

  const handleUpload = (type: AlgorithmFile['type']) => {
    setUploadType(type);
    if (fileInputRef.current) {
      // Set accept based on type
      const acceptMap: Record<AlgorithmFile['type'], string> = {
        strategy: '.cpp,.c,.h',
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

  const getFileIcon = (type: AlgorithmFile['type']) => {
    switch (type) {
      case 'strategy': return <FileCode className="w-4 h-4 text-cyan-500" />;
      case 'scoring': return <FileText className="w-4 h-4 text-yellow-500" />;
      case 'preset': return <FileJson className="w-4 h-4 text-green-500" />;
      case 'metrics': return <FileJson className="w-4 h-4 text-purple-500" />;
      case 'policies': return <FileText className="w-4 h-4 text-orange-500" />;
      case 'operations': return <FileJson className="w-4 h-4 text-blue-500" />;
    }
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
            {getFileIcon(file.type)}
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {file.content.length} chars • {new Date(file.created).toLocaleDateString()}
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
          <Button size="sm" variant="default" disabled>
            <Play className="w-4 h-4 mr-2" />
            Run
          </Button>
        </div>
        <pre className="bg-muted/50 p-3 rounded-lg text-xs overflow-x-auto max-h-64 overflow-y-auto font-mono">
          {file.content}
        </pre>
      </div>
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
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>

      <div className="flex-1 overflow-hidden">
        {/* Strategy Tab - C++ Algorithm Files */}
        <TabsContent value="strategy" className="h-full m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Strategy Algorithms
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleUpload('strategy')}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload C++
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="text-muted-foreground mb-4">
                    Upload C++ compression algorithms to process binary data.
                  </p>

                  {algorithmManager.getStrategies().length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                      <FileCode className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No algorithms uploaded</p>
                      <p className="text-xs mt-1">Upload a .cpp, .c, or .h file</p>
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

        {/* Metrics Tab - JSON with toggle UI */}
        <TabsContent value="metrics" className="h-full m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <ListChecks className="w-4 h-4" />
                      Metrics Definitions
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleUpload('metrics')}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload JSON
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="text-muted-foreground mb-4">
                    Upload JSON files defining metrics with formulas. Toggle metrics on/off and click to view calculation details.
                  </p>

                  <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-medium mb-2">Metrics JSON Example</h4>
                    <pre className="text-xs overflow-x-auto font-mono text-muted-foreground">
{`{
  "metrics": [
    {
      "id": "entropy",
      "name": "Shannon Entropy",
      "description": "Measures randomness",
      "formula": "-sum(p * log2(p))",
      "enabled": true
    },
    {
      "id": "compression_ratio",
      "name": "Compression Ratio",
      "description": "Original / Compressed size",
      "formula": "original_size / compressed_size",
      "enabled": true
    }
  ]
}`}
                    </pre>
                  </div>

                  {algorithmManager.getMetricsFiles().length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                      <ListChecks className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No metrics files uploaded</p>
                      <p className="text-xs mt-1">Upload a .json metrics file</p>
                    </div>
                  ) : (
                    <>
                      {/* File list */}
                      <div className="mb-4">
                        <h4 className="font-medium mb-2 text-xs text-muted-foreground uppercase">Uploaded Files</h4>
                        <FileList files={algorithmManager.getMetricsFiles()} showCodePreview={false} />
                      </div>

                      {/* Metrics toggle list */}
                      <div>
                        <h4 className="font-medium mb-2 text-xs text-muted-foreground uppercase">All Metrics</h4>
                        <div className="space-y-1">
                          {algorithmManager.getAllMetrics().map((metric) => (
                            <div
                              key={`${metric.fileId}:${metric.id}`}
                              className="border rounded-lg overflow-hidden"
                            >
                              <div
                                className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30"
                                onClick={() => setExpandedMetric(
                                  expandedMetric === `${metric.fileId}:${metric.id}` 
                                    ? null 
                                    : `${metric.fileId}:${metric.id}`
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  {expandedMetric === `${metric.fileId}:${metric.id}` 
                                    ? <ChevronDown className="w-4 h-4" />
                                    : <ChevronRight className="w-4 h-4" />
                                  }
                                  <div>
                                    <p className="font-medium">{metric.name}</p>
                                    <p className="text-xs text-muted-foreground">{metric.description}</p>
                                  </div>
                                </div>
                                <Switch
                                  checked={metric.enabled}
                                  onCheckedChange={(checked) => {
                                    algorithmManager.toggleMetric(metric.fileId, metric.id, checked);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              {expandedMetric === `${metric.fileId}:${metric.id}` && (
                                <div className="px-3 pb-3 pt-0">
                                  <div className="bg-muted/50 p-3 rounded-lg">
                                    <p className="text-xs text-muted-foreground mb-1">Formula:</p>
                                    <code className="text-sm font-mono text-cyan-500">{metric.formula}</code>
                                    <p className="text-xs text-muted-foreground mt-2">
                                      Source: {metric.fileName}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
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

        {/* Operations Tab - JSON with toggle UI */}
        <TabsContent value="operations" className="h-full m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Cog className="w-4 h-4" />
                      Operations Definitions
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleUpload('operations')}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload JSON
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="text-muted-foreground mb-4">
                    Upload JSON files defining valid operations. Toggle operations on/off to control what the strategy can use.
                  </p>

                  <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-medium mb-2">Operations JSON Example</h4>
                    <pre className="text-xs overflow-x-auto font-mono text-muted-foreground">
{`{
  "operations": [
    {
      "id": "and",
      "name": "AND Gate",
      "description": "Bitwise AND",
      "enabled": true
    },
    {
      "id": "xor",
      "name": "XOR Gate", 
      "description": "Bitwise XOR",
      "enabled": true
    },
    {
      "id": "shift_left",
      "name": "Shift Left",
      "description": "Logical shift left",
      "enabled": true
    }
  ]
}`}
                    </pre>
                  </div>

                  {algorithmManager.getOperationsFiles().length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                      <Cog className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No operations files uploaded</p>
                      <p className="text-xs mt-1">Upload a .json operations file</p>
                    </div>
                  ) : (
                    <>
                      {/* File list */}
                      <div className="mb-4">
                        <h4 className="font-medium mb-2 text-xs text-muted-foreground uppercase">Uploaded Files</h4>
                        <FileList files={algorithmManager.getOperationsFiles()} showCodePreview={false} />
                      </div>

                      {/* Operations toggle list */}
                      <div>
                        <h4 className="font-medium mb-2 text-xs text-muted-foreground uppercase">All Operations</h4>
                        <div className="space-y-1">
                          {algorithmManager.getAllOperations().map((op) => (
                            <div
                              key={`${op.fileId}:${op.id}`}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <Badge variant={op.enabled ? "default" : "secondary"} className="font-mono">
                                  {op.id.toUpperCase()}
                                </Badge>
                                <div>
                                  <p className="font-medium">{op.name}</p>
                                  <p className="text-xs text-muted-foreground">{op.description}</p>
                                </div>
                              </div>
                              <Switch
                                checked={op.enabled}
                                onCheckedChange={(checked) => {
                                  algorithmManager.toggleOperation(op.fileId, op.id, checked);
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="h-full m-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <BarChart2 className="w-4 h-4" />
                    Execution Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <div className="text-center py-8 border border-dashed rounded-lg">
                    <BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No results yet</p>
                    <p className="text-xs mt-1">Run an algorithm to see results</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="h-full m-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4" />
                      Execution History
                    </div>
                    <Button size="sm" variant="outline" disabled>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <div className="text-center py-8 border border-dashed rounded-lg">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No execution history</p>
                    <p className="text-xs mt-1">Algorithm executions will appear here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>
      </div>
    </Tabs>
  );
};
