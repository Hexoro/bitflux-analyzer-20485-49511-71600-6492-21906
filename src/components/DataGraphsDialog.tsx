import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BinaryMetrics } from '@/lib/binaryMetrics';
import type { Partition } from '@/lib/partitionManager';
import { Download } from 'lucide-react';

interface DataGraphsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  binaryData: string;
  partitions: Partition[];
}

export const DataGraphsDialog = ({ open, onOpenChange, binaryData, partitions }: DataGraphsDialogProps) => {
  const [showGrid, setShowGrid] = useState(true);
  const [animate, setAnimate] = useState(true);
  const [showLegend, setShowLegend] = useState(true);

  const stats = useMemo(() => BinaryMetrics.analyze(binaryData), [binaryData]);

  const bitDistribution = [
    { name: 'Zeros', value: stats.zeroCount, percentage: stats.zeroPercent },
    { name: 'Ones', value: stats.oneCount, percentage: stats.onePercent },
  ];

  const entropyOverTime = useMemo(() => {
    const windowSize = Math.max(64, Math.floor(binaryData.length / 100));
    const step = Math.max(32, Math.floor(windowSize / 4));
    const data = [];
    
    for (let i = 0; i < binaryData.length - windowSize; i += step) {
      const window = binaryData.slice(i, i + windowSize);
      const zeros = (window.match(/0/g) || []).length;
      const ones = window.length - zeros;
      const entropy = BinaryMetrics.calculateEntropy(zeros, ones);
      data.push({ 
        position: i, 
        entropy: parseFloat(entropy.toFixed(4)),
        zeroRatio: parseFloat((zeros / window.length).toFixed(4))
      });
    }
    return data;
  }, [binaryData]);

  const byteDistribution = useMemo(() => {
    const byteCounts: { [key: number]: number } = {};
    for (let i = 0; i < Math.min(binaryData.length, 10000); i += 8) {
      const byte = binaryData.slice(i, i + 8).padEnd(8, '0');
      const value = parseInt(byte, 2);
      byteCounts[value] = (byteCounts[value] || 0) + 1;
    }
    
    return Object.entries(byteCounts)
      .map(([value, count]) => ({ 
        value: parseInt(value), 
        count,
        hex: `0x${parseInt(value).toString(16).toUpperCase().padStart(2, '0')}`
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);
  }, [binaryData]);

  const runLengthAnalysis = useMemo(() => {
    const zeroRuns: number[] = [];
    const oneRuns: number[] = [];
    let currentRun = 1;
    let currentBit = binaryData[0];
    
    for (let i = 1; i < Math.min(binaryData.length, 50000); i++) {
      if (binaryData[i] === currentBit) {
        currentRun++;
      } else {
        if (currentBit === '0') zeroRuns.push(currentRun);
        else oneRuns.push(currentRun);
        currentRun = 1;
        currentBit = binaryData[i];
      }
    }

    const maxLength = Math.max(...zeroRuns, ...oneRuns);
    const data = [];
    for (let len = 1; len <= Math.min(maxLength, 50); len++) {
      data.push({
        length: len,
        zeros: zeroRuns.filter(r => r === len).length,
        ones: oneRuns.filter(r => r === len).length,
      });
    }
    return data;
  }, [binaryData]);

  const partitionComparison = useMemo(() => {
    return partitions.slice(0, 15).map((p, i) => ({
      name: `P${i + 1}`,
      id: i + 1,
      size: p.bits.length,
      zeros: p.stats.zeroCount,
      ones: p.stats.oneCount,
      entropy: parseFloat(p.stats.entropy.toFixed(4)),
      zeroPercent: parseFloat(p.stats.zeroPercent.toFixed(2)),
      onePercent: parseFloat(p.stats.onePercent.toFixed(2)),
    }));
  }, [partitions]);

  const autocorrelation = useMemo(() => {
    const data = [];
    const sampleSize = Math.min(binaryData.length, 1000);
    const sample = binaryData.slice(0, sampleSize);
    
    for (let lag = 0; lag < Math.min(100, sampleSize / 2); lag++) {
      let sum = 0;
      for (let i = 0; i < sampleSize - lag; i++) {
        const val1 = sample[i] === '1' ? 1 : -1;
        const val2 = sample[i + lag] === '1' ? 1 : -1;
        sum += val1 * val2;
      }
      const correlation = sum / (sampleSize - lag);
      data.push({ lag, correlation: parseFloat(correlation.toFixed(4)) });
    }
    return data;
  }, [binaryData]);

  const complexityMetrics = useMemo(() => {
    const windowSize = 256;
    const data = [];
    
    for (let i = 0; i < Math.min(binaryData.length - windowSize, 1000); i += windowSize) {
      const window = binaryData.slice(i, i + windowSize);
      
      // Calculate transitions
      let transitions = 0;
      for (let j = 1; j < window.length; j++) {
        if (window[j] !== window[j - 1]) transitions++;
      }
      
      // Calculate unique patterns
      const patterns = new Set();
      for (let j = 0; j < window.length - 4; j++) {
        patterns.add(window.slice(j, j + 4));
      }
      
      data.push({
        position: i,
        transitions,
        uniquePatterns: patterns.size,
        complexity: parseFloat(((transitions / window.length) * (patterns.size / 16)).toFixed(4))
      });
    }
    return data;
  }, [binaryData]);

  const exportChart = (chartId: string) => {
    // Future enhancement: export chart as PNG
    console.log('Export chart:', chartId);
  };

  const colors = {
    primary: 'hsl(var(--primary))',
    destructive: 'hsl(var(--destructive))',
    accent: 'hsl(var(--accent))',
    muted: 'hsl(var(--muted-foreground))',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Binary Data Analysis & Visualizations</span>
            <div className="flex items-center gap-4 text-sm font-normal">
              <div className="flex items-center gap-2">
                <Switch id="grid" checked={showGrid} onCheckedChange={setShowGrid} />
                <Label htmlFor="grid">Grid</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="animate" checked={animate} onCheckedChange={setAnimate} />
                <Label htmlFor="animate">Animate</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="legend" checked={showLegend} onCheckedChange={setShowLegend} />
                <Label htmlFor="legend">Legend</Label>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-xs text-muted-foreground">Total Bits</div>
              <div className="text-2xl font-bold">{stats.totalBits.toLocaleString()}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground">Entropy</div>
              <div className="text-2xl font-bold">{stats.entropy.toFixed(4)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground">Mean Run Length</div>
              <div className="text-2xl font-bold">{stats.meanRunLength.toFixed(2)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground">Balance</div>
              <div className="text-2xl font-bold">{(Math.abs(50 - stats.zeroPercent)).toFixed(2)}%</div>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Bit Distribution */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Bit Distribution</h3>
                <Button size="sm" variant="ghost" onClick={() => exportChart('distribution')}>
                  <Download className="w-3 h-3" />
                </Button>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={bitDistribution}>
                  {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
                  <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: any, name: string, props: any) => [
                      `${value.toLocaleString()} (${props.payload.percentage.toFixed(2)}%)`,
                      name
                    ]}
                  />
                  {showLegend && <Legend />}
                  <Bar dataKey="value" fill={colors.primary} animationDuration={animate ? 1000 : 0} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Entropy Over Position */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Entropy Analysis (Sliding Window)</h3>
                <Button size="sm" variant="ghost" onClick={() => exportChart('entropy')}>
                  <Download className="w-3 h-3" />
                </Button>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={entropyOverTime}>
                  {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
                  <XAxis dataKey="position" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" domain={[0, 1]} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                  {showLegend && <Legend />}
                  <Area type="monotone" dataKey="entropy" stroke={colors.primary} fill={colors.primary} fillOpacity={0.6} animationDuration={animate ? 1000 : 0} />
                  <Area type="monotone" dataKey="zeroRatio" stroke={colors.destructive} fill={colors.destructive} fillOpacity={0.3} animationDuration={animate ? 1000 : 0} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Byte Value Distribution */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Top 30 Byte Values (Frequency)</h3>
                <Button size="sm" variant="ghost" onClick={() => exportChart('bytes')}>
                  <Download className="w-3 h-3" />
                </Button>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byteDistribution}>
                  {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
                  <XAxis dataKey="hex" stroke="hsl(var(--foreground))" angle={-45} textAnchor="end" height={60} />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: any, name: string, props: any) => [
                      `${value} occurrences (${props.payload.hex})`,
                      'Count'
                    ]}
                  />
                  <Bar dataKey="count" fill={colors.accent} animationDuration={animate ? 1000 : 0} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Run Length Analysis */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Run Length Distribution</h3>
                <Button size="sm" variant="ghost" onClick={() => exportChart('runs')}>
                  <Download className="w-3 h-3" />
                </Button>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={runLengthAnalysis}>
                  {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
                  <XAxis dataKey="length" stroke="hsl(var(--foreground))" label={{ value: 'Run Length', position: 'insideBottom', offset: -5 }} />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                  {showLegend && <Legend />}
                  <Line type="monotone" dataKey="zeros" stroke={colors.destructive} strokeWidth={2} dot={false} animationDuration={animate ? 1000 : 0} />
                  <Line type="monotone" dataKey="ones" stroke={colors.primary} strokeWidth={2} dot={false} animationDuration={animate ? 1000 : 0} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Autocorrelation */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Autocorrelation (Pattern Detection)</h3>
                <Button size="sm" variant="ghost" onClick={() => exportChart('autocorr')}>
                  <Download className="w-3 h-3" />
                </Button>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={autocorrelation}>
                  {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
                  <XAxis dataKey="lag" stroke="hsl(var(--foreground))" label={{ value: 'Lag', position: 'insideBottom', offset: -5 }} />
                  <YAxis stroke="hsl(var(--foreground))" domain={[-1, 1]} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                  <Line type="monotone" dataKey="correlation" stroke={colors.primary} strokeWidth={2} dot={false} animationDuration={animate ? 1000 : 0} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Complexity Metrics */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Complexity Analysis</h3>
                <Button size="sm" variant="ghost" onClick={() => exportChart('complexity')}>
                  <Download className="w-3 h-3" />
                </Button>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart>
                  {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
                  <XAxis dataKey="transitions" stroke="hsl(var(--foreground))" label={{ value: 'Transitions', position: 'insideBottom', offset: -5 }} />
                  <YAxis dataKey="uniquePatterns" stroke="hsl(var(--foreground))" label={{ value: 'Unique Patterns', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: any, name: string, props: any) => [
                      `${value} (Complexity: ${props.payload.complexity})`,
                      name
                    ]}
                  />
                  <Scatter data={complexityMetrics} fill={colors.primary} animationDuration={animate ? 1000 : 0} />
                </ScatterChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Partition Analysis */}
          {partitionComparison.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Partition Analysis</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold">Partition Sizes & Bit Counts</h3>
                    <Button size="sm" variant="ghost" onClick={() => exportChart('partitions')}>
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={partitionComparison}>
                      {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
                      <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                      <YAxis stroke="hsl(var(--foreground))" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                      {showLegend && <Legend />}
                      <Bar dataKey="zeros" fill={colors.destructive} stackId="bits" animationDuration={animate ? 1000 : 0} />
                      <Bar dataKey="ones" fill={colors.primary} stackId="bits" animationDuration={animate ? 1000 : 0} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold">Partition Entropy Comparison</h3>
                    <Button size="sm" variant="ghost" onClick={() => exportChart('partition-entropy')}>
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <RadarChart data={partitionComparison}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="name" stroke="hsl(var(--foreground))" />
                      <PolarRadiusAxis domain={[0, 1]} stroke="hsl(var(--foreground))" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                      <Radar dataKey="entropy" stroke={colors.primary} fill={colors.primary} fillOpacity={0.6} animationDuration={animate ? 1000 : 0} />
                    </RadarChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
