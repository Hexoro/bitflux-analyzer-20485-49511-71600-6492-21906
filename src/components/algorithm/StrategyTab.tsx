/**
 * Strategy Tab - Create and manage strategies (presets)
 * Each strategy requires one file from each group: algorithm, scoring, policies
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Save,
  Play,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Code,
  Calculator,
  Shield,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { pythonModuleSystem, PythonFile, StrategyConfig } from '@/lib/pythonModuleSystem';
import { fileSystemManager } from '@/lib/fileSystemManager';

interface StrategyTabProps {
  onRunStrategy?: (strategy: StrategyConfig) => void;
  isExecuting?: boolean;
}

export const StrategyTab = ({ onRunStrategy, isExecuting = false }: StrategyTabProps) => {
  const [strategies, setStrategies] = useState<StrategyConfig[]>([]);
  const [files, setFiles] = useState<PythonFile[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyConfig | null>(null);
  const [, forceUpdate] = useState({});

  // Form state for new strategy
  const [strategyName, setStrategyName] = useState('');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('');
  const [selectedScoring, setSelectedScoring] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState('');

  useEffect(() => {
    setStrategies(pythonModuleSystem.getAllStrategies());
    setFiles(pythonModuleSystem.getAllFiles());
    const unsubscribe = pythonModuleSystem.subscribe(() => {
      setStrategies(pythonModuleSystem.getAllStrategies());
      setFiles(pythonModuleSystem.getAllFiles());
    });
    return unsubscribe;
  }, []);

  const algorithmFiles = files.filter(f => f.group === 'algorithm');
  const scoringFiles = files.filter(f => f.group === 'scoring');
  const policyFiles = files.filter(f => f.group === 'policies');

  const handleCreateStrategy = () => {
    if (!strategyName.trim()) {
      toast.error('Enter a strategy name');
      return;
    }
    if (!selectedAlgorithm) {
      toast.error('Select an algorithm file');
      return;
    }
    if (!selectedScoring) {
      toast.error('Select a scoring file');
      return;
    }
    if (!selectedPolicy) {
      toast.error('Select a policy file');
      return;
    }

    try {
      const strategy = pythonModuleSystem.createStrategy(
        strategyName,
        selectedAlgorithm,
        selectedScoring,
        selectedPolicy
      );
      toast.success(`Strategy "${strategyName}" created`);
      
      // Reset form
      setStrategyName('');
      setSelectedAlgorithm('');
      setSelectedScoring('');
      setSelectedPolicy('');
      setSelectedStrategy(strategy);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleDeleteStrategy = (id: string) => {
    pythonModuleSystem.deleteStrategy(id);
    if (selectedStrategy?.id === id) {
      setSelectedStrategy(null);
    }
    toast.success('Strategy deleted');
  };

  const handleRunStrategy = () => {
    if (!selectedStrategy) {
      toast.error('Select a strategy first');
      return;
    }

    const activeFile = fileSystemManager.getActiveFile();
    if (!activeFile) {
      toast.error('No data file selected. Load or generate binary data first.');
      return;
    }

    const validation = pythonModuleSystem.validateStrategy(selectedStrategy.id);
    if (!validation.valid) {
      toast.error(validation.errors.join(', '));
      return;
    }

    onRunStrategy?.(selectedStrategy);
  };

  const getValidationStatus = (strategy: StrategyConfig) => {
    const validation = pythonModuleSystem.validateStrategy(strategy.id);
    return validation;
  };

  return (
    <div className="h-full flex gap-4 p-4">
      {/* Left: Strategy List */}
      <div className="w-1/2 flex flex-col gap-4">
        {/* Create New Strategy */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create New Strategy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Strategy Name</Label>
              <Input
                value={strategyName}
                onChange={(e) => setStrategyName(e.target.value)}
                placeholder="My Analysis Strategy"
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-2">
                <Code className="w-3 h-3" />
                Algorithm File
              </Label>
              {algorithmFiles.length === 0 ? (
                <p className="text-xs text-muted-foreground">No algorithm files uploaded</p>
              ) : (
                <Select value={selectedAlgorithm} onValueChange={setSelectedAlgorithm}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select algorithm" />
                  </SelectTrigger>
                  <SelectContent>
                    {algorithmFiles.map(f => (
                      <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-2">
                <Calculator className="w-3 h-3" />
                Scoring File
              </Label>
              {scoringFiles.length === 0 ? (
                <p className="text-xs text-muted-foreground">No scoring files uploaded</p>
              ) : (
                <Select value={selectedScoring} onValueChange={setSelectedScoring}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select scoring" />
                  </SelectTrigger>
                  <SelectContent>
                    {scoringFiles.map(f => (
                      <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-2">
                <Shield className="w-3 h-3" />
                Policy File
              </Label>
              {policyFiles.length === 0 ? (
                <p className="text-xs text-muted-foreground">No policy files uploaded</p>
              ) : (
                <Select value={selectedPolicy} onValueChange={setSelectedPolicy}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select policy" />
                  </SelectTrigger>
                  <SelectContent>
                    {policyFiles.map(f => (
                      <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <Button
              onClick={handleCreateStrategy}
              className="w-full"
              disabled={!strategyName || !selectedAlgorithm || !selectedScoring || !selectedPolicy}
            >
              <Save className="w-4 h-4 mr-2" />
              Create Strategy
            </Button>
          </CardContent>
        </Card>

        {/* Strategy List */}
        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {strategies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No strategies created yet</p>
                <p className="text-sm mt-1">Upload files and create a strategy above</p>
              </div>
            ) : (
              strategies.map(strategy => {
                const validation = getValidationStatus(strategy);
                return (
                  <Card
                    key={strategy.id}
                    className={`cursor-pointer transition-colors ${
                      selectedStrategy?.id === strategy.id ? 'border-primary' : 'hover:bg-muted/30'
                    }`}
                    onClick={() => setSelectedStrategy(strategy)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{strategy.name}</h4>
                            {validation.valid ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-destructive" />
                            )}
                          </div>
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Code className="w-3 h-3" />
                              {strategy.algorithmFile}
                            </div>
                            <div className="flex items-center gap-2">
                              <Calculator className="w-3 h-3" />
                              {strategy.scoringFile}
                            </div>
                            <div className="flex items-center gap-2">
                              <Shield className="w-3 h-3" />
                              {strategy.policyFile}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStrategy(strategy.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right: Selected Strategy Details */}
      <Card className="w-1/2 flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            {selectedStrategy ? selectedStrategy.name : 'Strategy Details'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {selectedStrategy ? (
            <>
              {/* Validation Status */}
              {(() => {
                const validation = getValidationStatus(selectedStrategy);
                return (
                  <div className={`p-3 rounded-lg mb-4 ${validation.valid ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
                    <div className="flex items-center gap-2">
                      {validation.valid ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          <span className="text-green-500 font-medium">Ready to run</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-destructive" />
                          <span className="text-destructive font-medium">Missing files</span>
                        </>
                      )}
                    </div>
                    {!validation.valid && (
                      <ul className="mt-2 text-sm text-destructive">
                        {validation.errors.map((err, i) => (
                          <li key={i}>• {err}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })()}

              {/* File Details */}
              <div className="space-y-4 flex-1">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Code className="w-4 h-4 text-primary" />
                    <span className="font-medium">Algorithm</span>
                  </div>
                  <p className="font-mono text-sm">{selectedStrategy.algorithmFile}</p>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium">Scoring</span>
                  </div>
                  <p className="font-mono text-sm">{selectedStrategy.scoringFile}</p>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span className="font-medium">Policy</span>
                  </div>
                  <p className="font-mono text-sm">{selectedStrategy.policyFile}</p>
                </div>
              </div>

              {/* Run Button */}
              <Button
                onClick={handleRunStrategy}
                className="w-full mt-4"
                disabled={isExecuting || !getValidationStatus(selectedStrategy).valid}
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Strategy
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a strategy to view details</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
