/**
 * Player Tab V2 - Playback controls only
 * When a result is selected, it creates a temp file in the sidebar
 * The BinaryViewer shows that temp file with highlights
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
} from 'lucide-react';
import { fileSystemManager } from '@/lib/fileSystemManager';
import { predefinedManager } from '@/lib/predefinedManager';

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
}

interface PlayerTabProps {
  result: ExecutionResult | null;
  onStepChange?: (step: TransformationStep | null) => void;
}

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
      tempFile.group = 'Player';
      fileSystemManager.setActiveFile(tempFile.id);
      setTempFileId(tempFile.id);
      setCurrentStep(0);
      setIsPlaying(false);
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

  if (!result) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No execution result selected</p>
          <p className="text-sm mt-2">Run a strategy or select a result from the Results tab</p>
        </div>
      </div>
    );
  }

  const step = result.steps[currentStep];
  const currentBits = step?.afterBits || result.initialBits;

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* Temp File Info */}
      <Card className="bg-purple-500/10 border-purple-500/30">
        <CardContent className="py-3">
          <div className="flex items-center gap-4">
            <FileCode className="w-5 h-5 text-purple-500" />
            <div className="flex-1">
              <span className="text-sm font-medium">Playback Mode</span>
              <p className="text-xs text-muted-foreground">
                Binary data is displayed in the temp file in the sidebar. Use controls below to step through transformations.
              </p>
            </div>
            <Badge variant="outline" className="border-purple-500/50">
              {result.strategyName}
            </Badge>
            <Badge variant="secondary">
              {currentBits.length} bits
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
          </div>
        </CardContent>
      </Card>

      {/* Playback Controls */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            {/* Control Buttons */}
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" onClick={handleReset} title="Reset to initial">
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={handleStop} disabled={currentStep === 0 && !isPlaying}>
                <Square className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))} disabled={currentStep === 0}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {isPlaying ? (
                <Button size="icon" onClick={handlePause}>
                  <Pause className="w-4 h-4" />
                </Button>
              ) : (
                <Button size="icon" onClick={handlePlay} disabled={!result.steps.length || currentStep >= result.steps.length - 1}>
                  <Play className="w-4 h-4" />
                </Button>
              )}
              <Button size="icon" variant="outline" onClick={() => setCurrentStep(prev => Math.min(result.steps.length - 1, prev + 1))} disabled={currentStep >= result.steps.length - 1}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={handleNext} disabled={currentStep >= result.steps.length - 1}>
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>

            {/* Speed Control */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Speed:</span>
              <Select value={playbackSpeed.toString()} onValueChange={(v) => setPlaybackSpeed(parseFloat(v))}>
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.25">0.25x</SelectItem>
                  <SelectItem value="0.5">0.5x</SelectItem>
                  <SelectItem value="1">1x</SelectItem>
                  <SelectItem value="2">2x</SelectItem>
                  <SelectItem value="4">4x</SelectItem>
                  <SelectItem value="8">8x</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Step Counter */}
            <div className="flex-1 text-center">
              <span className="text-lg font-mono">
                Step {currentStep + 1} / {result.steps.length || 1}
              </span>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {step?.duration?.toFixed(2) || 0}ms
            </div>
          </div>

          {/* Timeline Slider */}
          <div className="mt-4">
            <Slider
              value={[currentStep]}
              min={0}
              max={Math.max(0, result.steps.length - 1)}
              step={1}
              onValueChange={handleSliderChange}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Current Step Details */}
      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        {/* Left: Operation Details */}
        <Card className="flex flex-col min-h-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Current Operation
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {step ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-mono text-lg text-primary">{step.operation}</h4>
                  {step.params && Object.keys(step.params).length > 0 && (
                    <div className="mt-2 space-y-1">
                      {Object.entries(step.params).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{key}:</span>
                          <span className="font-mono">{JSON.stringify(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bit Ranges */}
                {step.bitRanges && step.bitRanges.length > 0 && (
                  <div className="border-t pt-4">
                    <h5 className="text-sm font-medium mb-2">Bit Ranges Changed</h5>
                    <div className="flex flex-wrap gap-2">
                      {step.bitRanges.map((range, i) => (
                        <Badge key={i} variant="outline">
                          [{range.start}:{range.end}]
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h5 className="text-sm font-medium mb-2">Size Change</h5>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{step.beforeBits.length}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-mono">{step.afterBits.length}</span>
                    <Badge variant={step.afterBits.length !== step.beforeBits.length ? 'default' : 'secondary'}>
                      {step.afterBits.length - step.beforeBits.length >= 0 ? '+' : ''}
                      {step.afterBits.length - step.beforeBits.length}
                    </Badge>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h5 className="text-sm font-medium mb-2">Bits Changed</h5>
                  <p className="font-mono text-sm">
                    {countChangedBits(step.beforeBits, step.afterBits)} bits modified
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h5 className="text-sm font-medium mb-2">Execution Time</h5>
                  <p className="font-mono text-sm">{step.duration?.toFixed(4) || 0} ms</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No step selected</p>
            )}
          </CardContent>
        </Card>

        {/* Right: Metrics */}
        <Card className="flex flex-col min-h-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Metrics at Step
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
                    
                    return (
                      <div key={key} className="flex items-center justify-between p-2 rounded bg-muted/30">
                        <div>
                          <span className="font-medium">{metricDef?.name || key}</span>
                          {metricDef?.unit && (
                            <span className="text-xs text-muted-foreground ml-1">({metricDef.unit})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{typeof value === 'number' ? value.toFixed(4) : value}</span>
                          {change !== 0 && (
                            <Badge variant={change < 0 ? 'default' : 'secondary'} className="text-xs">
                              {change > 0 ? '+' : ''}{change.toFixed(4)}
                            </Badge>
                          )}
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

      {/* Operations Reference */}
      <Card className="flex-shrink-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Available Operations ({operations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {operations.map(op => (
              <Badge
                key={op.id}
                variant={step?.operation === op.id ? 'default' : 'outline'}
                className="cursor-default"
              >
                {op.id}
              </Badge>
            ))}
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