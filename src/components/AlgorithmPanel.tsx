import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { algorithmManager, AlgorithmFile, ScoringConfig, ScoringState } from '@/lib/algorithmManager';

type AlgorithmTab = 'strategy' | 'presets' | 'results' | 'scoring' | 'metrics' | 'policies' | 'operations' | 'history' | 'uploads';

export const AlgorithmPanel = () => {
  const [activeTab, setActiveTab] = useState<AlgorithmTab>('strategy');
  const [algorithms, setAlgorithms] = useState<AlgorithmFile[]>([]);
  const [scoringConfigs, setScoringConfigs] = useState<ScoringConfig[]>([]);
  const [scoringState, setScoringState] = useState<ScoringState>(algorithmManager.getScoringState());
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string | null>(null);
  const [, forceUpdate] = useState({});
  
  const cppInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const updateState = () => {
      setAlgorithms(algorithmManager.getAlgorithms());
      setScoringConfigs(algorithmManager.getScoringConfigs());
      setScoringState(algorithmManager.getScoringState());
      forceUpdate({});
    };

    updateState();
    const unsubscribe = algorithmManager.subscribe(updateState);
    return unsubscribe;
  }, []);

  const handleUploadAlgorithm = () => {
    cppInputRef.current?.click();
  };

  const handleCppFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.cpp') && !file.name.endsWith('.c') && !file.name.endsWith('.h')) {
      toast.error('Please upload a C/C++ file (.cpp, .c, or .h)');
      return;
    }

    try {
      const content = await file.text();
      algorithmManager.addAlgorithm(file.name, content);
      toast.success(`Algorithm "${file.name}" uploaded`);
    } catch (error) {
      toast.error('Failed to read file');
    }

    if (cppInputRef.current) {
      cppInputRef.current.value = '';
    }
  };

  const handleUploadScoring = () => {
    jsonInputRef.current?.click();
  };

  const handleJsonFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Please upload a JSON file');
      return;
    }

    try {
      const content = await file.text();
      const config = JSON.parse(content);

      // Validate required fields
      if (typeof config.initialBudget !== 'number') {
        toast.error('JSON must include "initialBudget" as a number');
        return;
      }

      if (!Array.isArray(config.operations)) {
        toast.error('JSON must include "operations" array');
        return;
      }

      algorithmManager.addScoringConfig(file.name.replace('.json', ''), {
        initialBudget: config.initialBudget,
        operations: config.operations || [],
        combinedOperations: config.combinedOperations || [],
      });
      toast.success(`Scoring config "${file.name}" uploaded`);
    } catch (error) {
      toast.error('Failed to parse JSON file');
    }

    if (jsonInputRef.current) {
      jsonInputRef.current.value = '';
    }
  };

  const handleDeleteAlgorithm = (id: string) => {
    algorithmManager.deleteAlgorithm(id);
    if (selectedAlgorithm === id) {
      setSelectedAlgorithm(null);
    }
    toast.success('Algorithm deleted');
  };

  const handleDeleteScoring = (id: string) => {
    algorithmManager.deleteScoringConfig(id);
    toast.success('Scoring config deleted');
  };

  const handleActivateScoring = (id: string) => {
    algorithmManager.activateScoringConfig(id);
    toast.success('Scoring config activated');
  };

  const handleResetScoring = () => {
    algorithmManager.resetScoringState();
    toast.success('Scoring reset to initial budget');
  };

  const activeConfig = algorithmManager.getActiveScoringConfig();
  const budgetPercentage = activeConfig 
    ? (scoringState.currentBudget / activeConfig.initialBudget) * 100 
    : 0;

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AlgorithmTab)} className="h-full flex flex-col">
      <input
        type="file"
        ref={cppInputRef}
        onChange={handleCppFileChange}
        accept=".cpp,.c,.h"
        className="hidden"
      />
      <input
        type="file"
        ref={jsonInputRef}
        onChange={handleJsonFileChange}
        accept=".json"
        className="hidden"
      />

      <TabsList className="w-full justify-start rounded-none border-b">
        <TabsTrigger value="strategy">Strategy</TabsTrigger>
        <TabsTrigger value="scoring">Scoring</TabsTrigger>
        <TabsTrigger value="presets">Presets</TabsTrigger>
        <TabsTrigger value="results">Results</TabsTrigger>
        <TabsTrigger value="metrics">Metrics</TabsTrigger>
        <TabsTrigger value="policies">Policies</TabsTrigger>
        <TabsTrigger value="operations">Operations</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
        <TabsTrigger value="uploads">Uploads</TabsTrigger>
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
                      Algorithm Strategy
                    </div>
                    <Button size="sm" variant="outline" onClick={handleUploadAlgorithm}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload C++
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="text-muted-foreground mb-4">
                    Upload C++ compression algorithms to process binary data. Files persist until deleted.
                  </p>

                  {algorithms.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                      <FileCode className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No algorithms uploaded</p>
                      <p className="text-xs mt-1">Upload a .cpp, .c, or .h file</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {algorithms.map((alg) => (
                        <div
                          key={alg.id}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedAlgorithm === alg.id
                              ? 'bg-primary/10 border-primary'
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedAlgorithm(alg.id)}
                        >
                          <div className="flex items-center gap-3">
                            <FileCode className="w-4 h-4 text-cyan-500" />
                            <div>
                              <p className="font-medium">{alg.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {alg.content.length} chars • {new Date(alg.created).toLocaleDateString()}
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
                                handleDeleteAlgorithm(alg.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedAlgorithm && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Code Preview</h4>
                        <Button size="sm" variant="default" disabled>
                          <Play className="w-4 h-4 mr-2" />
                          Run Algorithm
                        </Button>
                      </div>
                      <pre className="bg-muted/50 p-3 rounded-lg text-xs overflow-x-auto max-h-64 overflow-y-auto font-mono">
                        {algorithmManager.getAlgorithm(selectedAlgorithm)?.content}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Scoring Tab - JSON Economy System */}
        <TabsContent value="scoring" className="h-full m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {/* Active Scoring Display */}
              {activeConfig && (
                <Card className="border-cyan-500/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-cyan-500" />
                        Active Economy: {activeConfig.name}
                      </div>
                      <Button size="sm" variant="outline" onClick={handleResetScoring}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reset
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Current Budget</span>
                        <span className={`text-lg font-bold ${
                          budgetPercentage > 50 ? 'text-green-500' : 
                          budgetPercentage > 20 ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                          {scoringState.currentBudget.toFixed(2)} / {activeConfig.initialBudget}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            budgetPercentage > 50 ? 'bg-green-500' : 
                            budgetPercentage > 20 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.max(0, budgetPercentage)}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Operations applied: {scoringState.operationsApplied.length}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Scoring Configurations
                    </div>
                    <Button size="sm" variant="outline" onClick={handleUploadScoring}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload JSON
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="text-muted-foreground mb-4">
                    Upload JSON economy files defining operation costs, combined discounts, and initial budgets.
                  </p>

                  <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      JSON Format Example
                    </h4>
                    <pre className="text-xs overflow-x-auto font-mono">
{`{
  "initialBudget": 1000,
  "operations": [
    { "operation": "AND", "cost": 5 },
    { "operation": "XOR", "cost": 3 },
    { "operation": "SHIFT", "cost": 2 }
  ],
  "combinedOperations": [
    { "operations": ["AND", "XOR"], "cost": 6 }
  ]
}`}
                    </pre>
                  </div>

                  {scoringConfigs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                      <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No scoring configs uploaded</p>
                      <p className="text-xs mt-1">Upload a JSON economy file</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {scoringConfigs.map((cfg) => (
                        <div
                          key={cfg.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            scoringState.configId === cfg.id
                              ? 'bg-cyan-500/10 border-cyan-500'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{cfg.name}</p>
                              {scoringState.configId === cfg.id && (
                                <Badge variant="secondary" className="text-xs">Active</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Budget: {cfg.initialBudget} • {cfg.operations.length} ops • {cfg.combinedOperations.length} combos
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {scoringState.configId !== cfg.id && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleActivateScoring(cfg.id)}
                              >
                                Activate
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteScoring(cfg.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeConfig && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Operation Costs</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {activeConfig.operations.map((op, idx) => (
                          <div key={idx} className="flex justify-between p-2 bg-muted/30 rounded text-xs">
                            <span>{op.operation}</span>
                            <span className="font-mono">{op.cost}</span>
                          </div>
                        ))}
                      </div>
                      {activeConfig.combinedOperations.length > 0 && (
                        <>
                          <h4 className="font-medium mb-2 mt-4">Combined Discounts</h4>
                          <div className="space-y-2">
                            {activeConfig.combinedOperations.map((combo, idx) => (
                              <div key={idx} className="flex justify-between p-2 bg-green-500/10 rounded text-xs">
                                <span>{combo.operations.join(' + ')}</span>
                                <span className="font-mono text-green-500">{combo.cost}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="presets" className="h-full m-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Settings2 className="w-4 h-4" />
                    Presets
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>Load and save algorithm presets.</p>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="results" className="h-full m-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <BarChart2 className="w-4 h-4" />
                    Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>View algorithm execution results.</p>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="metrics" className="h-full m-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <ListChecks className="w-4 h-4" />
                    Metrics List
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>Available metrics for analysis.</p>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="policies" className="h-full m-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4" />
                    Policies
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>Define algorithm policies.</p>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="operations" className="h-full m-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Cog className="w-4 h-4" />
                    Operation Lists
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>Manage operation sequences.</p>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="history" className="h-full m-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <History className="w-4 h-4" />
                    History
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>Algorithm execution history.</p>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="uploads" className="h-full m-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Upload className="w-4 h-4" />
                    Uploads
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>Manage uploaded files and data.</p>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>
      </div>
    </Tabs>
  );
};