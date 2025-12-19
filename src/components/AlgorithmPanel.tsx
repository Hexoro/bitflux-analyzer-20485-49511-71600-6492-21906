/**
 * Algorithm Panel V3 - Redesigned with new tab structure
 * Tabs: Files, Strategy, Player, Results, Metrics, Operations (fixed order)
 * Support for custom tabs
 */

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Play,
  FileText,
  FolderOpen,
  Code,
  Activity,
  Cog,
  ChevronRight,
  ChevronDown,
  Plus,
  X,
} from 'lucide-react';
import { predefinedManager, PredefinedMetric, PredefinedOperation } from '@/lib/predefinedManager';
import { ExecutionResultV2 } from '@/lib/resultsManager';
import { pythonModuleSystem } from '@/lib/pythonModuleSystem';
import { PlayerTab } from './algorithm/PlayerTab';
import { ResultsTab } from './algorithm/ResultsTab';
import { FilesTab } from './algorithm/FilesTab';
import { StrategyTab } from './algorithm/StrategyTab';

interface CustomTab {
  id: string;
  name: string;
  content: string;
}

type AlgorithmTab = 'files' | 'strategy' | 'player' | 'results' | 'metrics' | 'operations' | string;

export const AlgorithmPanel = () => {
  const [activeTab, setActiveTab] = useState<AlgorithmTab>('files');
  const [currentResult, setCurrentResult] = useState<ExecutionResultV2 | null>(null);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [expandedOperation, setExpandedOperation] = useState<string | null>(null);
  const [customTabs, setCustomTabs] = useState<CustomTab[]>([]);
  const [addTabDialogOpen, setAddTabDialogOpen] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const unsubscribe = predefinedManager.subscribe(() => forceUpdate({}));
    return unsubscribe;
  }, []);

  // Load custom tabs from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('algorithm_custom_tabs');
      if (saved) {
        setCustomTabs(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load custom tabs');
    }
  }, []);

  // Save custom tabs to localStorage
  useEffect(() => {
    localStorage.setItem('algorithm_custom_tabs', JSON.stringify(customTabs));
  }, [customTabs]);

  const metrics = predefinedManager.getAllMetrics();
  const operations = predefinedManager.getAllOperations();
  const metricCategories = predefinedManager.getMetricCategories();
  const operationCategories = predefinedManager.getOperationCategories();

  const handleResultSelect = useCallback((result: ExecutionResultV2 | null) => {
    setCurrentResult(result);
    if (result) {
      setActiveTab('player');
    }
  }, []);

  const handleAddTab = () => {
    if (!newTabName.trim()) return;
    
    const id = `custom_${Date.now()}`;
    setCustomTabs([...customTabs, { id, name: newTabName, content: '' }]);
    setNewTabName('');
    setAddTabDialogOpen(false);
    setActiveTab(id);
  };

  const handleRemoveTab = (id: string) => {
    setCustomTabs(customTabs.filter(t => t.id !== id));
    if (activeTab === id) {
      setActiveTab('files');
    }
  };

  const handleStepChange = useCallback((step: any, highlights: any) => {
    // This would sync with binary viewer
    // The highlights are already being set in the PlayerTab via pythonModuleSystem
  }, []);

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AlgorithmTab)} className="h-full flex flex-col">
      <TabsList className="w-full justify-start rounded-none border-b overflow-x-auto flex-shrink-0">
        <TabsTrigger value="files">
          <FolderOpen className="w-4 h-4 mr-1" />
          Files
        </TabsTrigger>
        <TabsTrigger value="strategy">
          <Code className="w-4 h-4 mr-1" />
          Strategy
        </TabsTrigger>
        <TabsTrigger value="player">
          <Play className="w-4 h-4 mr-1" />
          Player
        </TabsTrigger>
        <TabsTrigger value="results">
          <FileText className="w-4 h-4 mr-1" />
          Results
        </TabsTrigger>
        <TabsTrigger value="metrics">
          <Activity className="w-4 h-4 mr-1" />
          Metrics
        </TabsTrigger>
        <TabsTrigger value="operations">
          <Cog className="w-4 h-4 mr-1" />
          Operations
        </TabsTrigger>
        
        {/* Custom Tabs */}
        {customTabs.map(tab => (
          <TabsTrigger key={tab.id} value={tab.id} className="group">
            {tab.name}
            <Button
              size="icon"
              variant="ghost"
              className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveTab(tab.id);
              }}
            >
              <X className="w-3 h-3" />
            </Button>
          </TabsTrigger>
        ))}
        
        {/* Add Tab Button */}
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 ml-1"
          onClick={() => setAddTabDialogOpen(true)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </TabsList>

      <div className="flex-1 overflow-hidden">
        <TabsContent value="files" className="h-full m-0">
          <FilesTab />
        </TabsContent>

        <TabsContent value="strategy" className="h-full m-0">
          <StrategyTab />
        </TabsContent>

        <TabsContent value="player" className="h-full m-0">
          <PlayerTab result={currentResult} onStepChange={handleStepChange} />
        </TabsContent>

        <TabsContent value="results" className="h-full m-0">
          <ResultsTab onSelectResult={handleResultSelect} />
        </TabsContent>

        {/* Metrics Tab - Display only */}
        <TabsContent value="metrics" className="h-full m-0">
          <ScrollArea className="h-full p-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Available Metrics ({metrics.length})
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  These metrics are available to all strategies. Edit them in Backend mode.
                </p>
              </CardHeader>
              <CardContent>
                {metricCategories.map(category => (
                  <div key={category} className="mb-4">
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
                              {expandedMetric === metric.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              <div>
                                <span className="font-medium">{metric.name}</span>
                                {metric.unit && <Badge variant="secondary" className="ml-2 text-xs">{metric.unit}</Badge>}
                              </div>
                            </div>
                          </div>
                          {expandedMetric === metric.id && (
                            <div className="px-3 pb-3 pt-1 bg-muted/20 border-t">
                              <p className="text-sm text-muted-foreground mb-2">{metric.description}</p>
                              <div className="font-mono text-xs bg-background/50 p-2 rounded">{metric.formula}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </ScrollArea>
        </TabsContent>

        {/* Operations Tab - Display only */}
        <TabsContent value="operations" className="h-full m-0">
          <ScrollArea className="h-full p-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Cog className="w-4 h-4" />
                  Available Operations ({operations.length})
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  These operations are available to all strategies. Edit them in Backend mode.
                </p>
              </CardHeader>
              <CardContent>
                {operationCategories.map(category => (
                  <div key={category} className="mb-4">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">{category}</h4>
                    <div className="space-y-1">
                      {operations.filter(op => op.category === category).map(op => (
                        <div key={op.id} className="border rounded-lg overflow-hidden">
                          <div
                            className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30"
                            onClick={() => setExpandedOperation(expandedOperation === op.id ? null : op.id)}
                          >
                            <div className="flex items-center gap-3">
                              {expandedOperation === op.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              <span className="font-mono font-medium">{op.id}</span>
                              <span className="text-muted-foreground">-</span>
                              <span>{op.name}</span>
                            </div>
                          </div>
                          {expandedOperation === op.id && (
                            <div className="px-3 pb-3 pt-1 bg-muted/20 border-t">
                              <p className="text-sm text-muted-foreground mb-2">{op.description}</p>
                              {op.parameters && op.parameters.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {op.parameters.map(p => (
                                    <Badge key={p.name} variant="outline" className="text-xs">{p.name}: {p.type}</Badge>
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
              </CardContent>
            </Card>
          </ScrollArea>
        </TabsContent>

        {/* Custom Tab Contents */}
        {customTabs.map(tab => (
          <TabsContent key={tab.id} value={tab.id} className="h-full m-0 p-4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-sm">{tab.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Custom tab content. You can extend this functionality.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </div>

      {/* Add Tab Dialog */}
      <Dialog open={addTabDialogOpen} onOpenChange={setAddTabDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Custom Tab</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={newTabName}
              onChange={(e) => setNewTabName(e.target.value)}
              placeholder="Tab name"
              onKeyDown={(e) => e.key === 'Enter' && handleAddTab()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTabDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddTab} disabled={!newTabName.trim()}>Add Tab</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
};
