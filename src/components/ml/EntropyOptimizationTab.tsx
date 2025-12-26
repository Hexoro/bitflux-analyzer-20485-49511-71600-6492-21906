import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Play, 
  Square, 
  Download, 
  BarChart3, 
  Zap,
  TrendingDown,
  Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { fileSystemManager } from '@/lib/fileSystemManager';
import { predefinedManager } from '@/lib/predefinedManager';
import { BinaryMetrics } from '@/lib/binaryMetrics';
import { LogicGates, ShiftOperations, AdvancedBitOperations } from '@/lib/binaryOperations';
import { toast } from 'sonner';

interface OperationResult {
  operation: string;
  initialEntropy: number;
  finalEntropy: number;
  entropyChange: number;
  percentChange: number;
  metrics: Record<string, number>;
}

interface OptimizationRun {
  id: string;
  timestamp: Date;
  fileName: string;
  results: OperationResult[];
  bestOperation: string;
  bestReduction: number;
}

const AVAILABLE_OPERATIONS = [
  { id: 'NOT', name: 'NOT Gate', category: 'Logic' },
  { id: 'SHL1', name: 'Shift Left 1', category: 'Shift' },
  { id: 'SHR1', name: 'Shift Right 1', category: 'Shift' },
  { id: 'ROL1', name: 'Rotate Left 1', category: 'Rotate' },
  { id: 'ROR1', name: 'Rotate Right 1', category: 'Rotate' },
  { id: 'GRAY', name: 'Gray Code', category: 'Advanced' },
  { id: 'REVERSE', name: 'Reverse Bits', category: 'Advanced' },
  { id: 'SHL2', name: 'Shift Left 2', category: 'Shift' },
  { id: 'SHR2', name: 'Shift Right 2', category: 'Shift' },
  { id: 'ROL4', name: 'Rotate Left 4', category: 'Rotate' },
  { id: 'ROR4', name: 'Rotate Right 4', category: 'Rotate' },
];

export const EntropyOptimizationTab = () => {
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [selectedOperations, setSelectedOperations] = useState<string[]>(AVAILABLE_OPERATIONS.map(o => o.id));
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState('');
  const [results, setResults] = useState<OperationResult[]>([]);
  const [runs, setRuns] = useState<OptimizationRun[]>([]);
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const unsubscribe = fileSystemManager.subscribe(() => forceUpdate({}));
    return unsubscribe;
  }, []);

  const dataFiles = fileSystemManager.getFiles().filter(f => f.state.model.getBits().length > 0);

  const applyOperation = (bits: string, opId: string): string => {
    switch (opId) {
      case 'NOT': return LogicGates.NOT(bits);
      case 'SHL1': return ShiftOperations.logicalShiftLeft(bits, 1);
      case 'SHL2': return ShiftOperations.logicalShiftLeft(bits, 2);
      case 'SHR1': return ShiftOperations.logicalShiftRight(bits, 1);
      case 'SHR2': return ShiftOperations.logicalShiftRight(bits, 2);
      case 'ROL1': return ShiftOperations.rotateLeft(bits, 1);
      case 'ROL4': return ShiftOperations.rotateLeft(bits, 4);
      case 'ROR1': return ShiftOperations.rotateRight(bits, 1);
      case 'ROR4': return ShiftOperations.rotateRight(bits, 4);
      case 'GRAY': return AdvancedBitOperations.binaryToGray(bits);
      case 'REVERSE': return AdvancedBitOperations.reverseBits(bits);
      default: return bits;
    }
  };

  const runOptimization = useCallback(async () => {
    if (!selectedFileId) {
      toast.error('Select a data file first');
      return;
    }

    const file = dataFiles.find(f => f.id === selectedFileId);
    if (!file) return;

    const bits = file.state.model.getBits();
    if (!bits || bits.length === 0) {
      toast.error('Selected file has no data');
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setResults([]);

    const initialStats = BinaryMetrics.analyze(bits);
    const initialEntropy = initialStats.entropy;
    const operationResults: OperationResult[] = [];

    for (let i = 0; i < selectedOperations.length; i++) {
      const opId = selectedOperations[i];
      const op = AVAILABLE_OPERATIONS.find(o => o.id === opId);
      if (!op) continue;

      setCurrentOperation(op.name);
      setProgress(((i + 1) / selectedOperations.length) * 100);

      // Allow UI to update
      await new Promise(resolve => setTimeout(resolve, 50));

      try {
        const transformedBits = applyOperation(bits, opId);
        const newStats = BinaryMetrics.analyze(transformedBits);
        const entropyChange = newStats.entropy - initialEntropy;
        const percentChange = (entropyChange / initialEntropy) * 100;

        operationResults.push({
          operation: op.name,
          initialEntropy,
          finalEntropy: newStats.entropy,
          entropyChange,
          percentChange,
          metrics: {
            compressionRatio: 1,
            balance: newStats.onePercent / 100,
            transitions: newStats.totalBits,
          },
        });
      } catch (error) {
        console.error(`Error applying ${op.name}:`, error);
      }
    }

    // Sort by entropy reduction (most negative first)
    operationResults.sort((a, b) => a.entropyChange - b.entropyChange);

    setResults(operationResults);
    setIsRunning(false);
    setCurrentOperation('');

    // Save run
    const bestResult = operationResults[0];
    const run: OptimizationRun = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      fileName: file.name,
      results: operationResults,
      bestOperation: bestResult?.operation || 'None',
      bestReduction: bestResult?.entropyChange || 0,
    };
    setRuns(prev => [run, ...prev].slice(0, 20));

    toast.success(`Optimization complete. Best: ${bestResult?.operation || 'None'}`);
  }, [selectedFileId, selectedOperations, dataFiles]);

  const exportResults = () => {
    if (results.length === 0) {
      toast.error('No results to export');
      return;
    }

    const exportData = {
      timestamp: new Date().toISOString(),
      file: dataFiles.find(f => f.id === selectedFileId)?.name || 'Unknown',
      results: results.map(r => ({
        operation: r.operation,
        initialEntropy: r.initialEntropy,
        finalEntropy: r.finalEntropy,
        entropyChange: r.entropyChange,
        percentChange: r.percentChange,
        ...r.metrics,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `entropy_optimization_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Results exported');
  };

  const toggleOperation = (opId: string) => {
    setSelectedOperations(prev => 
      prev.includes(opId) 
        ? prev.filter(id => id !== opId)
        : [...prev, opId]
    );
  };

  const chartData = results.map(r => ({
    name: r.operation.replace(' ', '\n'),
    entropy: r.finalEntropy,
    change: r.percentChange,
  }));

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-auto">
      {/* Header Controls */}
      <Card className="bg-gradient-to-r from-primary/10 to-transparent border-primary/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <Select value={selectedFileId} onValueChange={setSelectedFileId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select data file" />
                </SelectTrigger>
                <SelectContent>
                  {dataFiles.map(file => (
                    <SelectItem key={file.id} value={file.id}>
                      {file.name} ({file.state.model.getBits().length} bits)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                onClick={runOptimization} 
                disabled={isRunning || !selectedFileId}
                className="bg-primary hover:bg-primary/90"
              >
                {isRunning ? (
                  <>
                    <Activity className="w-4 h-4 mr-2 animate-pulse" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Optimization
                  </>
                )}
              </Button>

              {isRunning && (
                <Button variant="destructive" size="sm" onClick={() => setIsRunning(false)}>
                  <Square className="w-4 h-4" />
                </Button>
              )}
            </div>

            <Button variant="outline" onClick={exportResults} disabled={results.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {isRunning && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Testing: {currentOperation}</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Operations Selection */}
        <Card className="overflow-hidden">
          <CardHeader className="py-3 bg-muted/30">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Operations to Test
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {Object.entries(
                  AVAILABLE_OPERATIONS.reduce((acc, op) => {
                    acc[op.category] = acc[op.category] || [];
                    acc[op.category].push(op);
                    return acc;
                  }, {} as Record<string, typeof AVAILABLE_OPERATIONS>)
                ).map(([category, ops]) => (
                  <div key={category}>
                    <div className="text-xs font-medium text-muted-foreground mb-1">{category}</div>
                    {ops.map(op => (
                      <div key={op.id} className="flex items-center gap-2 py-1">
                        <Checkbox 
                          id={op.id}
                          checked={selectedOperations.includes(op.id)}
                          onCheckedChange={() => toggleOperation(op.id)}
                        />
                        <label htmlFor={op.id} className="text-sm cursor-pointer">{op.name}</label>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Results Chart */}
        <Card className="col-span-2 overflow-hidden">
          <CardHeader className="py-3 bg-muted/30">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Entropy Change by Operation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            {results.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    label={{ value: '% Change', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'Change']}
                  />
                  <Bar 
                    dataKey="change" 
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingDown className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Run optimization to see results</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results Table */}
      {results.length > 0 && (
        <Card>
          <CardHeader className="py-3 bg-muted/30">
            <CardTitle className="text-sm">Detailed Results (Sorted by Entropy Reduction)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[200px]">
              <table className="w-full text-sm">
                <thead className="bg-muted/20 sticky top-0">
                  <tr>
                    <th className="text-left p-2">Rank</th>
                    <th className="text-left p-2">Operation</th>
                    <th className="text-right p-2">Initial Entropy</th>
                    <th className="text-right p-2">Final Entropy</th>
                    <th className="text-right p-2">Change</th>
                    <th className="text-right p-2">% Change</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, idx) => (
                    <tr key={idx} className={`border-t border-border ${idx === 0 ? 'bg-primary/10' : ''}`}>
                      <td className="p-2">
                        {idx === 0 ? (
                          <Badge className="bg-primary">Best</Badge>
                        ) : (
                          <span className="text-muted-foreground">#{idx + 1}</span>
                        )}
                      </td>
                      <td className="p-2 font-medium">{r.operation}</td>
                      <td className="p-2 text-right font-mono">{r.initialEntropy.toFixed(4)}</td>
                      <td className="p-2 text-right font-mono">{r.finalEntropy.toFixed(4)}</td>
                      <td className={`p-2 text-right font-mono ${r.entropyChange < 0 ? 'text-green-500' : r.entropyChange > 0 ? 'text-red-500' : ''}`}>
                        {r.entropyChange >= 0 ? '+' : ''}{r.entropyChange.toFixed(4)}
                      </td>
                      <td className={`p-2 text-right font-mono ${r.percentChange < 0 ? 'text-green-500' : r.percentChange > 0 ? 'text-red-500' : ''}`}>
                        {r.percentChange >= 0 ? '+' : ''}{r.percentChange.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
