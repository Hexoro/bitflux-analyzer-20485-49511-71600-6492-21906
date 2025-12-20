/**
 * Player Tab V3 - Enhanced playback with full details
 * Shows operation costs, bit ranges, highlights, metrics per step
 * Creates temp file in sidebar for viewing
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  ExternalLink,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Trash2,
} from 'lucide-react';
import { fileSystemManager } from '@/lib/fileSystemManager';
import { predefinedManager } from '@/lib/predefinedManager';
import { toast } from 'sonner';

export interface TransformationStep {
  stepIndex: number;
  operation: string;
  params: Record<string, any>;
  beforeBits: string;
  afterBits: string;
  metrics: Record<string, number>;
  duration: number;
  timestamp?: Date;
  bitRanges?: { start: number; end: number }[];
  cost?: number;
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

// Operation costs mapping
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
  const [tempFileId, setTempFileId] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const operations = predefinedManager.getAllOperations();
  const metrics = predefinedManager.getAllMetrics();

  // Create temp file when result changes
  useEffect(() => {
    if (result && result.initialBits) {
      // Create temp file in sidebar
      const fileName = `player_${result.strategyName.replace(/\s+/g, '_')}_${Date.now()}.tmp`;
      const tempFile = fileSystemManager.createFile(fileName, result.initialBits, 'binary');
      fileSystemManager.setFileGroup(tempFile.id, 'Player');
      fileSystemManager.setActiveFile(tempFile.id);
      setTempFileId(tempFile.id);
      setCurrentStep(0);
      setIsPlaying(false);
      toast.success(`Player temp file created: ${fileName}`);
    }
    
    return () => {
      // Clean up temp file on unmount or result change
      if (tempFileId) {
        try {
          fileSystemManager.deleteFile(tempFileId);
        } catch (e) {
          // Ignore if already deleted
        }
      }
    };
  }, [result?.id]);

  // Playback logic
  useEffect(() => {
    if (isPlaying && result && result.steps.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= result.steps.length - 1) {
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
  }, [isPlaying, playbackSpeed, result]);

  // Update temp file when step changes
  useEffect(() => {
    if (result && result.steps[currentStep] && tempFileId) {
      const step = result.steps[currentStep];
      // Update the temp file with the current step's bits
      fileSystemManager.updateFile(tempFileId, step.afterBits);
      onStepChange?.(step);
    }
  }, [currentStep, result, tempFileId, onStepChange]);

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleStop = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    if (result && tempFileId) {
      fileSystemManager.updateFile(tempFileId, result.initialBits);
    }
  };
  const handleReset = () => {
    if (result && tempFileId) {
      fileSystemManager.updateFile(tempFileId, result.initialBits);
    }
    setCurrentStep(0);
    setIsPlaying(false);
  };
  const handlePrevious = () => setCurrentStep(prev => Math.max(0, prev - 1));
  const handleNext = () => setCurrentStep(prev => 
    result ? Math.min(result.steps.length - 1, prev + 1) : prev
  );
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

  const step = result.steps[currentStep];
  const currentBits = step?.afterBits || result.initialBits;
  const progress = result.steps.length > 0 ? ((currentStep + 1) / result.steps.length) * 100 : 0;
  
  // Calculate totals
  const totalCost = result.steps.reduce((sum, s) => sum + (s.cost || OPERATION_COSTS[s.operation] || 1), 0);
  const totalBitsChanged = result.steps.reduce((sum, s) => sum + countChangedBits(s.beforeBits, s.afterBits), 0);
  const cumulativeCost = result.steps.slice(0, currentStep + 1).reduce((sum, s) => sum + (s.cost || OPERATION_COSTS[s.operation] || 1), 0);

  return (
    <div className="h-full flex flex-col gap-3 p-4 overflow-hidden">
      {/* Header with Strategy Info */}
      <Card className="bg-purple-500/10 border-purple-500/30 flex-shrink-0">
        <CardContent className="py-3">
          <div className="flex items-center gap-4 flex-wrap">
            <FileCode className="w-5 h-5 text-purple-500" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium truncate">{result.strategyName}</span>
              <p className="text-xs text-muted-foreground">
                Playback Mode - Binary data displayed in temp file in sidebar
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{currentBits.length} bits</Badge>
              <Badge variant="outline">{result.steps.length} steps</Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                {cumulativeCost}/{totalCost} cost
              </Badge>
              {tempFileId && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    if (tempFileId) {
                      fileSystemManager.setActiveFile(tempFileId);
                    }
                  }}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View File
                </Button>
              )}
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
          <span>Step {currentStep + 1} of {result.steps.length || 1}</span>
          <span>{progress.toFixed(0)}% complete</span>
        </div>
      </div>

      {/* Playback Controls */}
      <Card className="flex-shrink-0">
        <CardContent className="py-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Control Buttons */}
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
                <Button size="icon" onClick={handlePlay} disabled={!result.steps.length || currentStep >= result.steps.length - 1} className="h-8 w-8">
                  <Play className="w-4 h-4" />
                </Button>
              )}
              <Button size="icon" variant="outline" onClick={() => setCurrentStep(prev => Math.min(result.steps.length - 1, prev + 1))} disabled={currentStep >= result.steps.length - 1} className="h-8 w-8">
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={handleNext} disabled={currentStep >= result.steps.length - 1} className="h-8 w-8">
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>

            {/* Speed Control */}
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

            {/* Timeline Slider */}
            <div className="flex-1 min-w-[100px]">
              <Slider
                value={[currentStep]}
                min={0}
                max={Math.max(0, result.steps.length - 1)}
                step={1}
                onValueChange={handleSliderChange}
              />
            </div>

            {/* Duration */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {step?.duration?.toFixed(1) || 0}ms
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content - 2 Column Layout */}
      <div className="flex-1 grid grid-cols-2 gap-3 min-h-0 overflow-hidden">
        {/* Left: Operation Details */}
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
                {/* Operation Name & Cost */}
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                  <div className="flex items-center justify-between">
                    <h4 className="font-mono text-lg text-primary">{step.operation}</h4>
                    <Badge className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {step.cost || OPERATION_COSTS[step.operation] || 1}
                    </Badge>
                  </div>
                </div>

                {/* Parameters */}
                {step.params && Object.keys(step.params).length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-1">Parameters</h5>
                    <div className="space-y-1">
                      {Object.entries(step.params).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm bg-muted/30 px-2 py-1 rounded">
                          <span className="text-muted-foreground">{key}:</span>
                          <span className="font-mono">{JSON.stringify(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bit Ranges */}
                {step.bitRanges && step.bitRanges.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-1">Bit Ranges Changed</h5>
                    <div className="flex flex-wrap gap-1">
                      {step.bitRanges.map((range, i) => (
                        <Badge key={i} variant="outline" className="font-mono text-xs">
                          [{range.start}:{range.end}] ({range.end - range.start} bits)
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size Change */}
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground mb-1">Size Change</h5>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-mono">{step.beforeBits.length}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-mono">{step.afterBits.length}</span>
                    {step.afterBits.length !== step.beforeBits.length && (
                      <Badge variant={step.afterBits.length < step.beforeBits.length ? 'default' : 'secondary'}>
                        {step.afterBits.length - step.beforeBits.length >= 0 ? '+' : ''}
                        {step.afterBits.length - step.beforeBits.length}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Bits Changed */}
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground mb-1">Bits Modified</h5>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{countChangedBits(step.beforeBits, step.afterBits)}</span>
                    <span className="text-xs text-muted-foreground">
                      ({((countChangedBits(step.beforeBits, step.afterBits) / step.beforeBits.length) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>

                {/* Execution Time */}
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground mb-1">Execution Time</h5>
                  <span className="font-mono text-sm">{step.duration?.toFixed(4) || 0} ms</span>
                </div>

                {/* Before/After Preview */}
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground mb-1">Data Preview (first 64 bits)</h5>
                  <div className="space-y-1 font-mono text-xs">
                    <div className="bg-red-500/10 p-1 rounded overflow-hidden">
                      <span className="text-red-500">Before: </span>
                      <span className="break-all">{step.beforeBits.slice(0, 64)}{step.beforeBits.length > 64 ? '...' : ''}</span>
                    </div>
                    <div className="bg-green-500/10 p-1 rounded overflow-hidden">
                      <span className="text-green-500">After: </span>
                      <span className="break-all">{step.afterBits.slice(0, 64)}{step.afterBits.length > 64 ? '...' : ''}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No step selected</p>
            )}
          </CardContent>
        </Card>

        {/* Right: Metrics */}
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
                    const prevStep = currentStep > 0 ? result.steps[currentStep - 1] : null;
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
                    <p className="text-muted-foreground text-sm">No metrics recorded for this step</p>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground text-sm">No metrics available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card className="flex-shrink-0">
        <CardContent className="py-2">
          <div className="flex items-center justify-between text-xs flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-muted-foreground" />
                {result.steps.length} total steps
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
                {result.totalDuration.toFixed(0)}ms total
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Available Operations:</span>
              <div className="flex flex-wrap gap-1">
                {operations.slice(0, 8).map(op => (
                  <Badge
                    key={op.id}
                    variant={step?.operation === op.id ? 'default' : 'outline'}
                    className="text-xs px-1"
                  >
                    {op.id}
                  </Badge>
                ))}
                {operations.length > 8 && (
                  <Badge variant="outline" className="text-xs">+{operations.length - 8}</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper function
function countChangedBits(before: string, after: string): number {
  let count = 0;
  const maxLen = Math.max(before.length, after.length);
  for (let i = 0; i < maxLen; i++) {
    if ((before[i] || '0') !== (after[i] || '0')) count++;
  }
  return count;
}
