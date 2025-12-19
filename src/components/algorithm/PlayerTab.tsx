/**
 * Player Tab - Plays transformations with full controls
 * Step-by-step, timeline slider, auto-play with speed
 */

import { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { TransformationStep, ExecutionResultV2 } from '@/lib/resultsManager';
import { predefinedManager } from '@/lib/predefinedManager';

interface PlayerTabProps {
  result: ExecutionResultV2 | null;
  onStepChange?: (step: TransformationStep | null) => void;
}

export const PlayerTab = ({ result, onStepChange }: PlayerTabProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [, forceUpdate] = useState({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const operations = predefinedManager.getAllOperations();
  const metrics = predefinedManager.getAllMetrics();

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

  useEffect(() => {
    if (result && result.steps[currentStep]) {
      onStepChange?.(result.steps[currentStep]);
    }
  }, [currentStep, result, onStepChange]);

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleStop = () => {
    setIsPlaying(false);
    setCurrentStep(0);
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
  const progress = result.steps.length > 0 ? (currentStep / (result.steps.length - 1)) * 100 : 0;

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* Playback Controls */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            {/* Control Buttons */}
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={handleStop}
                disabled={currentStep === 0 && !isPlaying}
              >
                <Square className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {isPlaying ? (
                <Button size="icon" onClick={handlePause}>
                  <Pause className="w-4 h-4" />
                </Button>
              ) : (
                <Button 
                  size="icon" 
                  onClick={handlePlay}
                  disabled={!result.steps.length || currentStep >= result.steps.length - 1}
                >
                  <Play className="w-4 h-4" />
                </Button>
              )}
              <Button
                size="icon"
                variant="outline"
                onClick={() => setCurrentStep(prev => 
                  Math.min(result.steps.length - 1, prev + 1)
                )}
                disabled={currentStep >= result.steps.length - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={handleNext}
                disabled={currentStep >= result.steps.length - 1}
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>

            {/* Speed Control */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Speed:</span>
              <Select
                value={playbackSpeed.toString()}
                onValueChange={(v) => setPlaybackSpeed(parseFloat(v))}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
                {currentStep + 1} / {result.steps.length}
              </span>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {step?.duration.toFixed(2)}ms
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
                  <h4 className="font-mono text-lg">{step.operation}</h4>
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

                <div className="border-t pt-4">
                  <h5 className="text-sm font-medium mb-2">Size Change</h5>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{step.beforeBits.length}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-mono">{step.afterBits.length}</span>
                    <Badge variant={step.afterBits.length < step.beforeBits.length ? 'default' : 'secondary'}>
                      {step.afterBits.length - step.beforeBits.length >= 0 ? '+' : ''}
                      {step.afterBits.length - step.beforeBits.length}
                    </Badge>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h5 className="text-sm font-medium mb-2">Bit Preview</h5>
                  <div className="font-mono text-xs bg-muted p-2 rounded overflow-hidden">
                    <div className="mb-1 text-muted-foreground">Before:</div>
                    <div className="truncate">{step.beforeBits.slice(0, 64)}...</div>
                    <div className="mt-2 mb-1 text-muted-foreground">After:</div>
                    <div className="truncate">{step.afterBits.slice(0, 64)}...</div>
                  </div>
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
                  {Object.entries(step.metrics).map(([key, value]) => {
                    const metricDef = metrics.find(m => m.id === key);
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between p-2 rounded bg-muted/30"
                      >
                        <div>
                          <span className="font-medium">{metricDef?.name || key}</span>
                          {metricDef?.unit && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({metricDef.unit})
                            </span>
                          )}
                        </div>
                        <span className="font-mono">{value.toFixed(4)}</span>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground text-sm">No metrics available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Operations Database */}
      <Card>
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
