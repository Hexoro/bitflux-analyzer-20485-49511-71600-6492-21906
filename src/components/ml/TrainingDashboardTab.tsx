import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Play, 
  Square, 
  Pause,
  RotateCcw,
  Clock,
  Activity,
  TrendingDown,
  Target,
  Zap,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { fileSystemManager } from '@/lib/fileSystemManager';
import { toast } from 'sonner';

interface TrainingConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
  validationSplit: number;
}

interface EpochLog {
  epoch: number;
  loss: number;
  accuracy: number;
  valLoss?: number;
  valAccuracy?: number;
  duration: number;
}

export const TrainingDashboardTab = () => {
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [config, setConfig] = useState<TrainingConfig>({
    epochs: 50,
    batchSize: 32,
    learningRate: 0.001,
    validationSplit: 0.2,
  });
  const [isTraining, setIsTraining] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [logs, setLogs] = useState<EpochLog[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string>('--:--');
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [, forceUpdate] = useState({});
  const abortRef = useRef(false);
  const modelRef = useRef<any>(null);

  useEffect(() => {
    const unsubscribe = fileSystemManager.subscribe(() => forceUpdate({}));
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Monitor memory
    const interval = setInterval(() => {
      if ((performance as any).memory) {
        const mem = (performance as any).memory;
        setMemoryUsage(Math.round((mem.usedJSHeapSize / 1024 / 1024)));
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const dataFiles = fileSystemManager.getFiles().filter(f => f.state.model.getBits().length > 0);

  const startTraining = useCallback(async () => {
    if (!selectedFileId) {
      toast.error('Select a data file first');
      return;
    }

    const tf = (window as any).tf;
    if (!tf) {
      toast.error('TensorFlow.js not loaded');
      return;
    }

    const file = dataFiles.find(f => f.id === selectedFileId);
    if (!file) return;

    const bits = file.state.model.getBits();
    if (bits.length < 100) {
      toast.error('Need at least 100 bits of data');
      return;
    }

    setIsTraining(true);
    setIsPaused(false);
    setCurrentEpoch(0);
    setLogs([]);
    setStartTime(new Date());
    abortRef.current = false;

    try {
      // Prepare data - predict next bit from previous N bits
      const windowSize = 8;
      const xs: number[][] = [];
      const ys: number[] = [];

      for (let i = 0; i < bits.length - windowSize; i++) {
        const window = bits.slice(i, i + windowSize).split('').map(Number);
        const target = Number(bits[i + windowSize]);
        xs.push(window);
        ys.push(target);
      }

      // Create tensors
      const xTensor = tf.tensor2d(xs);
      const yTensor = tf.tensor1d(ys);

      // Create model
      const model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [windowSize], units: 32, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 16, activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'sigmoid' })
        ]
      });

      model.compile({
        optimizer: tf.train.adam(config.learningRate),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });

      modelRef.current = model;

      // Train with custom callback
      const epochStartTimes: number[] = [];
      
      await model.fit(xTensor, yTensor, {
        epochs: config.epochs,
        batchSize: config.batchSize,
        validationSplit: config.validationSplit,
        shuffle: true,
        callbacks: {
          onEpochBegin: async (epoch) => {
            epochStartTimes[epoch] = Date.now();
            if (abortRef.current) {
              model.stopTraining = true;
            }
          },
          onEpochEnd: async (epoch, logs) => {
            const duration = Date.now() - epochStartTimes[epoch];
            
            const epochLog: EpochLog = {
              epoch: epoch + 1,
              loss: logs?.loss || 0,
              accuracy: (logs?.acc || logs?.accuracy || 0) * 100,
              valLoss: logs?.val_loss,
              valAccuracy: logs?.val_acc ? logs.val_acc * 100 : (logs?.val_accuracy ? logs.val_accuracy * 100 : undefined),
              duration,
            };

            setLogs(prev => [...prev, epochLog]);
            setCurrentEpoch(epoch + 1);

            // Calculate ETA
            const avgDuration = epochStartTimes
              .slice(0, epoch + 1)
              .reduce((sum, t, i) => sum + (Date.now() - t), 0) / (epoch + 1);
            const remaining = (config.epochs - epoch - 1) * avgDuration;
            const mins = Math.floor(remaining / 60000);
            const secs = Math.floor((remaining % 60000) / 1000);
            setEstimatedTimeRemaining(`${mins}:${secs.toString().padStart(2, '0')}`);

            // Allow UI update
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }
      });

      // Cleanup
      xTensor.dispose();
      yTensor.dispose();

      toast.success('Training complete!');
    } catch (error: any) {
      toast.error(`Training error: ${error.message}`);
    } finally {
      setIsTraining(false);
    }
  }, [selectedFileId, config, dataFiles]);

  const stopTraining = () => {
    abortRef.current = true;
    if (modelRef.current) {
      modelRef.current.stopTraining = true;
    }
    setIsTraining(false);
    toast.info('Training stopped');
  };

  const resetTraining = () => {
    setLogs([]);
    setCurrentEpoch(0);
    setStartTime(null);
    setEstimatedTimeRemaining('--:--');
    if (modelRef.current) {
      modelRef.current.dispose();
      modelRef.current = null;
    }
  };

  const elapsedTime = startTime 
    ? Math.floor((Date.now() - startTime.getTime()) / 1000)
    : 0;
  const elapsedMins = Math.floor(elapsedTime / 60);
  const elapsedSecs = elapsedTime % 60;

  const latestLog = logs[logs.length - 1];

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-auto">
      {/* Control Panel */}
      <Card className="bg-gradient-to-r from-primary/10 to-transparent border-primary/30">
        <CardContent className="py-4">
          <div className="grid grid-cols-6 gap-4">
            <div className="col-span-2">
              <Label className="text-xs">Data File</Label>
              <Select value={selectedFileId} onValueChange={setSelectedFileId} disabled={isTraining}>
                <SelectTrigger>
                  <SelectValue placeholder="Select file" />
                </SelectTrigger>
                <SelectContent>
                  {dataFiles.map(file => (
                    <SelectItem key={file.id} value={file.id}>
                      {file.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Epochs</Label>
              <Input 
                type="number" 
                value={config.epochs}
                onChange={e => setConfig(c => ({ ...c, epochs: parseInt(e.target.value) || 1 }))}
                disabled={isTraining}
                min={1}
                max={1000}
              />
            </div>
            <div>
              <Label className="text-xs">Batch Size</Label>
              <Input 
                type="number" 
                value={config.batchSize}
                onChange={e => setConfig(c => ({ ...c, batchSize: parseInt(e.target.value) || 1 }))}
                disabled={isTraining}
                min={1}
                max={512}
              />
            </div>
            <div>
              <Label className="text-xs">Learning Rate</Label>
              <Input 
                type="number" 
                value={config.learningRate}
                onChange={e => setConfig(c => ({ ...c, learningRate: parseFloat(e.target.value) || 0.001 }))}
                disabled={isTraining}
                step={0.0001}
                min={0.0001}
                max={1}
              />
            </div>
            <div className="flex items-end gap-2">
              {!isTraining ? (
                <Button onClick={startTraining} className="flex-1 bg-green-600 hover:bg-green-700">
                  <Play className="w-4 h-4 mr-1" />
                  Train
                </Button>
              ) : (
                <Button onClick={stopTraining} variant="destructive" className="flex-1">
                  <Square className="w-4 h-4 mr-1" />
                  Stop
                </Button>
              )}
              <Button variant="outline" onClick={resetTraining} disabled={isTraining}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {isTraining && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Epoch {currentEpoch} / {config.epochs}</span>
                <span>{((currentEpoch / config.epochs) * 100).toFixed(0)}%</span>
              </div>
              <Progress value={(currentEpoch / config.epochs) * 100} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Clock className="w-3 h-3" />
              Elapsed Time
            </div>
            <div className="text-xl font-bold font-mono">
              {elapsedMins}:{elapsedSecs.toString().padStart(2, '0')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Clock className="w-3 h-3" />
              Est. Remaining
            </div>
            <div className="text-xl font-bold font-mono">{estimatedTimeRemaining}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <TrendingDown className="w-3 h-3" />
              Current Loss
            </div>
            <div className="text-xl font-bold text-primary font-mono">
              {latestLog?.loss.toFixed(4) || '--'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Target className="w-3 h-3" />
              Accuracy
            </div>
            <div className="text-xl font-bold text-green-500 font-mono">
              {latestLog?.accuracy.toFixed(1) || '--'}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Zap className="w-3 h-3" />
              Memory
            </div>
            <div className="text-xl font-bold font-mono">{memoryUsage} MB</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4 flex-1 min-h-[300px]">
        <Card>
          <CardHeader className="py-2 bg-muted/30">
            <CardTitle className="text-sm">Loss Over Time</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={logs}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="epoch" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="loss" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={false}
                  name="Training Loss"
                />
                <Line 
                  type="monotone" 
                  dataKey="valLoss" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  dot={false}
                  name="Validation Loss"
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-2 bg-muted/30">
            <CardTitle className="text-sm">Accuracy Over Time</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={logs}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="epoch" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="accuracy" 
                  stroke="hsl(120, 100%, 40%)" 
                  strokeWidth={2}
                  dot={false}
                  name="Training Accuracy"
                />
                <Line 
                  type="monotone" 
                  dataKey="valAccuracy" 
                  stroke="hsl(200, 100%, 50%)" 
                  strokeWidth={2}
                  dot={false}
                  name="Validation Accuracy"
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
