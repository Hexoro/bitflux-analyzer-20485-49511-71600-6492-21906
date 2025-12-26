/**
 * Player Tab V5 - Reconstructs transformations from result data
 * - Grabs initialBits from result
 * - Replays each transformation step-by-step using operationsRouter
 * - Shows cost, metrics, and full file context
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Square,
  ChevronLeft,
  ChevronRight,
  Activity,
  Clock,
  Zap,
  Layers,
  FileCode,
  RotateCcw,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Trash2,
  Info,
} from 'lucide-react';
import { fileSystemManager } from '@/lib/fileSystemManager';
import { predefinedManager } from '@/lib/predefinedManager';
import { executeOperation, getOperationCost } from '@/lib/operationsRouter';
import { calculateAllMetrics } from '@/lib/metricsCalculator';
import { toast } from 'sonner';
import { BitDiffView } from './BitDiffView';
import { MetricsTimelineChart } from './MetricsTimelineChart';

export interface TransformationStep {
  stepIndex: number;
  operation: string;
  params: Record<string, any>;
  fullBeforeBits?: string;
  fullAfterBits?: string;
  beforeBits: string;
  afterBits: string;
  metrics: Record<string, number>;
  duration: number;
  timestamp?: Date;
  bitRanges?: { start: number; end: number }[];
  cost?: number;
  cumulativeBits?: string;
}

export interface ExecutionResult {
  id: string;
  strategyId: string;
  strategyName: string;
  dataFileId: string;
  dataFileName: string;
  initialBits: string;
  finalBits: string;
  steps: TransformationStep[];
  totalDuration: number;
  startTime: Date;
  endTime: Date;
  metricsHistory: Record<string, number[]>;
  success: boolean;
  error?: string;
  resourceUsage: {
    peakMemory: number;
    cpuTime: number;
    operationsCount: number;
  };
  budgetConfig?: {
    initial: number;
    used: number;
    remaining: number;
  };
}

interface PlayerTabProps {
  result: ExecutionResult | null;
  onStepChange?: (step: TransformationStep | null) => void;
}

const OPERATION_COSTS: Record<string, number> = {
  'NOT': 1, 'AND': 2, 'OR': 2, 'XOR': 2,
  'NAND': 3, 'NOR': 3, 'XNOR': 3,
  'left_shift': 1, 'right_shift': 1,
  'rotate_left': 2, 'rotate_right': 2,
  'reverse': 1, 'invert': 1,
  'swap_pairs': 2, 'swap_nibbles': 2, 'mirror': 1,
};

export const PlayerTab = ({ result, onStepChange }: PlayerTabProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [reconstructedBits, setReconstructedBits] = useState<string>('');
  const [reconstructedSteps, setReconstructedSteps] = useState<TransformationStep[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const operations = predefinedManager.getAllOperations();
  const metrics = predefinedManager.getAllMetrics();

  // Reconstruct transformations from result when result changes
  useEffect(() => {
    if (!result) {
      setReconstructedBits('');
      setReconstructedSteps([]);
      return;
    }

    setCurrentStep(0);
    setIsPlaying(false);

    // Start from initial bits and reconstruct each step
    let currentBits = result.initialBits;
    const steps: TransformationStep[] = [];

    for (let i = 0; i < result.steps.length; i++) {
      const originalStep = result.steps[i];
      const beforeBits = currentBits;
      
      // Apply the operation to reconstruct
      let afterBits = currentBits;
      try {
        const opResult = executeOperation(
          originalStep.operation,
          currentBits,
          originalStep.params || {}
        );
        if (opResult.success) {
          afterBits = opResult.bits;
        }
      } catch (e) {
        // Use stored afterBits as fallback
        afterBits = originalStep.cumulativeBits || originalStep.fullAfterBits || originalStep.afterBits || currentBits;
      }

      // Calculate metrics at this step
      const metricsResult = calculateAllMetrics(afterBits);
      
      steps.push({
        ...originalStep,
        stepIndex: i,
        fullBeforeBits: beforeBits,
        fullAfterBits: afterBits,
        beforeBits: beforeBits,
        afterBits: afterBits,
        metrics: metricsResult.metrics,
        cost: originalStep.cost || getOperationCost(originalStep.operation),
        cumulativeBits: afterBits,
      });

      currentBits = afterBits;
    }

    setReconstructedSteps(steps);
    setReconstructedBits(result.initialBits);
  }, [result?.id]);

  // Playback logic
  useEffect(() => {
    if (isPlaying && reconstructedSteps.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= reconstructedSteps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, reconstructedSteps.length]);

  // Update displayed bits when step changes
  useEffect(() => {
    if (!result || reconstructedSteps.length === 0) return;

    if (currentStep === 0) {
      setReconstructedBits(result.initialBits);
    } else if (currentStep <= reconstructedSteps.length) {
      const step = reconstructedSteps[currentStep - 1] || reconstructedSteps[currentStep];
      setReconstructedBits(step?.cumulativeBits || step?.fullAfterBits || step?.afterBits || result.initialBits);
    }

    const step = reconstructedSteps[currentStep];
    onStepChange?.(step || null);

    // Highlight changed ranges in active file
    const activeFile = fileSystemManager.getActiveFile();
    if (activeFile && step) {
      const ranges = step.bitRanges?.length 
        ? step.bitRanges 
        : computeChangedRanges(step.fullBeforeBits || step.beforeBits, step.fullAfterBits || step.afterBits);
      
      activeFile.state.setExternalHighlightRanges(
        ranges.map(r => ({ ...r, color: 'hsl(var(--primary) / 0.22)' }))
      );
    }
  }, [currentStep, reconstructedSteps, result, onStepChange]);

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleStop = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    if (result) {
      setReconstructedBits(result.initialBits);
    }
  };
  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
    if (result) {
      setReconstructedBits(result.initialBits);
    }
  };
  const handlePrevious = () => setCurrentStep(prev => Math.max(0, prev - 1));
  const handleNext = () => setCurrentStep(prev => Math.min(reconstructedSteps.length - 1, prev + 1));
  const handleSliderChange = (value: number[]) => setCurrentStep(value[0]);

  const handleCleanupTempFiles = () => {
    const count = fileSystemManager.clearAllTempFiles();
    toast.success(`Cleaned up ${count} temp files`);
  };

  if (!result) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No execution result selected</p>
          <p className="text-sm mt-2">Run a strategy or select a result from the Results tab</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={handleCleanupTempFiles}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Cleanup Temp Files
          </Button>
        </div>
      </div>
    );
  }

  const step = reconstructedSteps[currentStep];
  const currentBits = reconstructedBits || result.initialBits;
  const progress = reconstructedSteps.length > 0 ? ((currentStep + 1) / reconstructedSteps.length) * 100 : 0;
  
  // Calculate totals
  const totalCost = reconstructedSteps.reduce((sum, s) => sum + (s.cost || 0), 0);
  const totalBitsChanged = reconstructedSteps.reduce((sum, s) => {
    return sum + countChangedBits(s.fullBeforeBits || s.beforeBits, s.fullAfterBits || s.afterBits);
  }, 0);
  const cumulativeCost = reconstructedSteps.slice(0, currentStep + 1).reduce((sum, s) => sum + (s.cost || 0), 0);
  const budgetInitial = result.budgetConfig?.initial || 1000;
  const budgetRemaining = budgetInitial - cumulativeCost;

  return (
    <div className="h-full flex flex-col gap-3 p-4 overflow-hidden">
      {/* Header with Strategy Info and Budget */}
      <Card className="bg-primary/10 border-primary/30 flex-shrink-0">
        <CardContent className="py-3">
          <div className="flex items-center gap-4 flex-wrap">
            <FileCode className="w-5 h-5 text-primary" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium truncate">{result.strategyName}</span>
              <p className="text-xs text-muted-foreground">
                Reconstructed playback from {result.initialBits.length} bits
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{currentBits.length} bits</Badge>
              <Badge variant="outline">{reconstructedSteps.length} steps</Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                {cumulativeCost}/{totalCost}
              </Badge>
              <Badge variant={budgetRemaining > 0 ? 'default' : 'destructive'} className="flex items-center gap-1">
                Budget: {budgetRemaining}/{budgetInitial}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCleanupTempFiles}
                title="Cleanup all temp files"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Bar */}
      <div className="flex-shrink-0">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Step {currentStep + 1} of {reconstructedSteps.length || 1}</span>
          <span>{progress.toFixed(0)}% complete</span>
        </div>
      </div>

      {/* Playback Controls */}
      <Card className="flex-shrink-0">
        <CardContent className="py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <Button size="icon" variant="outline" onClick={handleReset} title="Reset to initial" className="h-8 w-8">
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={handleStop} disabled={currentStep === 0 && !isPlaying} className="h-8 w-8">
                <Square className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={handlePrevious} disabled={currentStep === 0} className="h-8 w-8">
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))} disabled={currentStep === 0} className="h-8 w-8">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {isPlaying ? (
                <Button size="icon" onClick={handlePause} className="h-8 w-8">
                  <Pause className="w-4 h-4" />
                </Button>
              ) : (
                <Button size="icon" onClick={handlePlay} disabled={!reconstructedSteps.length || currentStep >= reconstructedSteps.length - 1} className="h-8 w-8">
                  <Play className="w-4 h-4" />
                </Button>
              )}
              <Button size="icon" variant="outline" onClick={() => setCurrentStep(prev => Math.min(reconstructedSteps.length - 1, prev + 1))} disabled={currentStep >= reconstructedSteps.length - 1} className="h-8 w-8">
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={handleNext} disabled={currentStep >= reconstructedSteps.length - 1} className="h-8 w-8">
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Speed:</span>
              <Select value={playbackSpeed.toString()} onValueChange={(v) => setPlaybackSpeed(parseFloat(v))}>
                <SelectTrigger className="w-16 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.25">0.25x</SelectItem>
                  <SelectItem value="0.5">0.5x</SelectItem>
                  <SelectItem value="1">1x</SelectItem>
                  <SelectItem value="2">2x</SelectItem>
                  <SelectItem value="4">4x</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[100px]">
              <Slider
                value={[currentStep]}
                min={0}
                max={Math.max(0, reconstructedSteps.length - 1)}
                step={1}
                onValueChange={handleSliderChange}
              />
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {step?.duration?.toFixed(1) || 0}ms
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed View */}
      <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <TabsList className="w-full justify-start flex-shrink-0">
          <TabsTrigger value="details">Step Details</TabsTrigger>
          <TabsTrigger value="diff">Visual Diff</TabsTrigger>
          <TabsTrigger value="timeline">Metrics Timeline</TabsTrigger>
          <TabsTrigger value="data">Binary Data</TabsTrigger>
        </TabsList>
        
        {/* Details Tab */}
        <TabsContent value="details" className="flex-1 m-0 mt-2 overflow-hidden">
          <div className="h-full grid grid-cols-2 gap-3 overflow-hidden">
            <Card className="flex flex-col min-h-0 overflow-hidden">
              <CardHeader className="pb-2 flex-shrink-0">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Step {currentStep + 1} Details
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                {step ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                      <div className="flex items-center justify-between">
                        <h4 className="font-mono text-lg text-primary">{step.operation}</h4>
                        <Badge className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {step.cost || getOperationCost(step.operation)}
                        </Badge>
                      </div>
                    </div>

                    {step.params && Object.keys(step.params).length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-muted-foreground mb-1">Parameters</h5>
                        <div className="space-y-1">
                          {Object.entries(step.params).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-sm bg-muted/30 px-2 py-1 rounded">
                              <span className="text-muted-foreground">{key}:</span>
                              <span className="font-mono truncate max-w-[150px]">{JSON.stringify(value).slice(0, 50)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {step.bitRanges && step.bitRanges.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-muted-foreground mb-1">Bit Ranges Changed</h5>
                        <div className="flex flex-wrap gap-1">
                          {step.bitRanges.slice(0, 10).map((range, i) => (
                            <Badge key={i} variant="outline" className="font-mono text-xs">
                              [{range.start}:{range.end}]
                            </Badge>
                          ))}
                          {step.bitRanges.length > 10 && (
                            <Badge variant="secondary" className="text-xs">+{step.bitRanges.length - 10} more</Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div>
                      <h5 className="text-xs font-medium text-muted-foreground mb-1">File Size</h5>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-mono">{(step.fullBeforeBits || step.beforeBits).length} bits</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-mono">{(step.fullAfterBits || step.afterBits).length} bits</span>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-xs font-medium text-muted-foreground mb-1">Bits Modified</h5>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {countChangedBits(step.fullBeforeBits || step.beforeBits, step.fullAfterBits || step.afterBits)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({((countChangedBits(step.fullBeforeBits || step.beforeBits, step.fullAfterBits || step.afterBits) / 
                            (step.fullBeforeBits || step.beforeBits).length) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <h5 className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <Info className="w-3 h-3" /> Cumulative Stats
                      </h5>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-muted/30 p-2 rounded">
                          <span className="text-muted-foreground text-xs">Cost Used</span>
                          <p className="font-mono">{cumulativeCost} / {budgetInitial}</p>
                        </div>
                        <div className="bg-muted/30 p-2 rounded">
                          <span className="text-muted-foreground text-xs">Budget Left</span>
                          <p className="font-mono">{budgetRemaining}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No step selected</p>
                )}
              </CardContent>
            </Card>

            <Card className="flex flex-col min-h-0 overflow-hidden">
              <CardHeader className="pb-2 flex-shrink-0">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Metrics at Step {currentStep + 1}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                {step ? (
                  <ScrollArea className="h-full">
                    <div className="space-y-2">
                      {Object.entries(step.metrics || {}).map(([key, value]) => {
                        const metricDef = metrics.find(m => m.id === key);
                        const prevStep = currentStep > 0 ? reconstructedSteps[currentStep - 1] : null;
                        const prevValue = prevStep?.metrics?.[key] ?? value;
                        const change = Number(value) - Number(prevValue);
                        const isImprovement = key === 'entropy' ? change < 0 : change > 0;
                        
                        return (
                          <div key={key} className="p-2 rounded bg-muted/30 border">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium text-sm">{metricDef?.name || key}</span>
                                {metricDef?.unit && (
                                  <span className="text-xs text-muted-foreground ml-1">({metricDef.unit})</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm">{typeof value === 'number' ? value.toFixed(4) : value}</span>
                                {change !== 0 && (
                                  <Badge 
                                    variant={isImprovement ? 'default' : 'secondary'} 
                                    className="text-xs flex items-center gap-0.5"
                                  >
                                    {isImprovement ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                                    {change > 0 ? '+' : ''}{change.toFixed(4)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {(!step.metrics || Object.keys(step.metrics).length === 0) && (
                        <p className="text-muted-foreground text-sm">No metrics recorded</p>
                      )}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-muted-foreground text-sm">No metrics available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Visual Diff Tab */}
        <TabsContent value="diff" className="flex-1 m-0 mt-2 overflow-auto">
          {step && (
            <BitDiffView
              beforeBits={step.fullBeforeBits || step.beforeBits}
              afterBits={step.fullAfterBits || step.afterBits}
              highlightRanges={step.bitRanges}
            />
          )}
        </TabsContent>
        
        {/* Metrics Timeline Tab */}
        <TabsContent value="timeline" className="flex-1 m-0 mt-2 overflow-auto">
          <MetricsTimelineChart
            steps={reconstructedSteps.map(s => ({
              operation: s.operation,
              metrics: s.metrics,
              cost: s.cost,
            }))}
            currentStepIndex={currentStep}
          />
        </TabsContent>

        {/* Binary Data Tab */}
        <TabsContent value="data" className="flex-1 m-0 mt-2 overflow-hidden">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-2 flex-shrink-0">
              <CardTitle className="text-sm">Current Binary State ({currentBits.length} bits)</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              <ScrollArea className="h-full">
                <div className="font-mono text-xs break-all leading-relaxed p-2 bg-muted/30 rounded">
                  {currentBits.split('').map((bit, i) => {
                    const changed = step && (step.fullBeforeBits || step.beforeBits)[i] !== (step.fullAfterBits || step.afterBits)[i];
                    return (
                      <span
                        key={i}
                        className={changed ? 'bg-primary/30 text-primary font-bold' : (bit === '1' ? 'text-green-500' : 'text-muted-foreground')}
                      >
                        {bit}
                      </span>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Stats */}
      <Card className="flex-shrink-0">
        <CardContent className="py-2">
          <div className="flex items-center justify-between text-xs flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-muted-foreground" />
                {reconstructedSteps.length} steps
              </span>
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-muted-foreground" />
                {totalBitsChanged} bits changed
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-muted-foreground" />
                {totalCost} total cost
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                {result.totalDuration.toFixed(0)}ms
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Operations:</span>
              <div className="flex flex-wrap gap-1">
                {operations.slice(0, 6).map(op => (
                  <Badge
                    key={op.id}
                    variant={step?.operation === op.id ? 'default' : 'outline'}
                    className="text-xs px-1"
                  >
                    {op.id}
                  </Badge>
                ))}
                {operations.length > 6 && (
                  <Badge variant="outline" className="text-xs">+{operations.length - 6}</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

function countChangedBits(before: string, after: string): number {
  let count = 0;
  const maxLen = Math.max(before.length, after.length);
  for (let i = 0; i < maxLen; i++) {
    if ((before[i] || '0') !== (after[i] || '0')) count++;
  }
  return count;
}

function computeChangedRanges(before: string, after: string): Array<{ start: number; end: number }> {
  const maxLen = Math.max(before.length, after.length);
  const ranges: Array<{ start: number; end: number }> = [];
  let inRange = false;
  let rangeStart = 0;

  for (let i = 0; i < maxLen; i++) {
    const a = before[i] || '0';
    const b = after[i] || '0';
    const changed = a !== b;

    if (changed && !inRange) {
      inRange = true;
      rangeStart = i;
    } else if (!changed && inRange) {
      inRange = false;
      ranges.push({ start: rangeStart, end: i - 1 });
    }
  }

  if (inRange) ranges.push({ start: rangeStart, end: maxLen - 1 });
  return ranges.slice(0, 200);
}
