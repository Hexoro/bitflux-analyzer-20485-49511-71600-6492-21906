import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card } from './ui/card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BinaryMetrics } from '@/lib/binaryMetrics';
import type { Partition } from '@/lib/partitionManager';

interface DataGraphsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  binaryData: string;
  partitions: Partition[];
}

export const DataGraphsDialog = ({ open, onOpenChange, binaryData, partitions }: DataGraphsDialogProps) => {
  const [activeView, setActiveView] = useState('2d');

  const stats = useMemo(() => BinaryMetrics.analyze(binaryData), [binaryData]);

  const bitDistribution = [
    { name: 'Zeros', value: stats.zeroCount, fill: 'hsl(var(--destructive))' },
    { name: 'Ones', value: stats.oneCount, fill: 'hsl(var(--primary))' },
  ];

  const entropyOverTime = useMemo(() => {
    const windowSize = 256;
    const data = [];
    for (let i = 0; i < binaryData.length - windowSize; i += windowSize) {
      const window = binaryData.slice(i, i + windowSize);
      const zeros = (window.match(/0/g) || []).length;
      const ones = window.length - zeros;
      const entropy = BinaryMetrics.calculateEntropy(zeros, ones);
      data.push({ position: i, entropy: entropy.toFixed(3) });
    }
    return data;
  }, [binaryData]);

  const runLengthData = useMemo(() => {
    const runs: { [key: string]: number } = {};
    let currentRun = 1;
    
    for (let i = 1; i < Math.min(binaryData.length, 10000); i++) {
      if (binaryData[i] === binaryData[i - 1]) {
        currentRun++;
      } else {
        const key = `${currentRun}`;
        runs[key] = (runs[key] || 0) + 1;
        currentRun = 1;
      }
    }

    return Object.entries(runs)
      .map(([length, count]) => ({ length: parseInt(length), count }))
      .sort((a, b) => a.length - b.length)
      .slice(0, 20);
  }, [binaryData]);

  const partitionData = useMemo(() => {
    return partitions.slice(0, 10).map((p, i) => ({
      name: `P${i + 1}`,
      size: p.bits.length,
      zeros: p.stats.zeroCount,
      ones: p.stats.oneCount,
      entropy: parseFloat(p.stats.entropy.toFixed(2)),
    }));
  }, [partitions]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Data Visualizations</DialogTitle>
        </DialogHeader>

        <Tabs value={activeView} onValueChange={setActiveView}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="2d">2D Graphs</TabsTrigger>
            <TabsTrigger value="3d">3D Views</TabsTrigger>
          </TabsList>

          <TabsContent value="2d" className="space-y-4">
            <Card className="p-4">
              <h3 className="text-sm font-medium mb-4">Bit Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={bitDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="value" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-medium mb-4">Entropy Over Position</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={entropyOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="position" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                  <Line type="monotone" dataKey="entropy" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-medium mb-4">Run Length Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={runLengthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="length" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="count" fill="hsl(var(--accent))" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {partitionData.length > 0 && (
              <Card className="p-4">
                <h3 className="text-sm font-medium mb-4">Partition Comparison</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={partitionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                    <Legend />
                    <Bar dataKey="zeros" fill="hsl(var(--destructive))" />
                    <Bar dataKey="ones" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="3d" className="space-y-4">
            <Card className="p-8">
              <h3 className="text-sm font-medium mb-8 text-center">Binary Cube Visualization</h3>
              <div className="flex justify-center" style={{ perspective: '1000px' }}>
                <div 
                  className="relative animate-[spin_20s_linear_infinite]"
                  style={{
                    width: '200px',
                    height: '200px',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {['front', 'back', 'right', 'left', 'top', 'bottom'].map((face, i) => {
                    const rotation = 
                      face === 'front' ? 'rotateY(0deg)' :
                      face === 'back' ? 'rotateY(180deg)' :
                      face === 'right' ? 'rotateY(90deg)' :
                      face === 'left' ? 'rotateY(-90deg)' :
                      face === 'top' ? 'rotateX(90deg)' :
                      'rotateX(-90deg)';
                    
                    const sample = binaryData.slice(i * 64, i * 64 + 64);
                    
                    return (
                      <div
                        key={face}
                        className="absolute inset-0 border border-primary/30 bg-background/10 flex items-center justify-center text-xs font-mono p-2 overflow-hidden"
                        style={{
                          transform: `${rotation} translateZ(100px)`,
                          backdropFilter: 'blur(2px)',
                        }}
                      >
                        <div className="break-all leading-tight text-primary/70">
                          {sample.slice(0, 48)}...
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <h3 className="text-sm font-medium mb-8 text-center">Data Helix</h3>
              <div className="flex justify-center" style={{ perspective: '800px' }}>
                <div 
                  className="relative animate-[spin_15s_linear_infinite]"
                  style={{
                    width: '300px',
                    height: '400px',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {Array.from({ length: 40 }).map((_, i) => {
                    const angle = (i / 40) * Math.PI * 4;
                    const y = i * 10;
                    const radius = 100;
                    const x = Math.cos(angle) * radius;
                    const z = Math.sin(angle) * radius;
                    const bit = binaryData[i % binaryData.length];
                    
                    return (
                      <div
                        key={i}
                        className={`absolute w-3 h-3 rounded-full ${bit === '1' ? 'bg-primary' : 'bg-destructive'}`}
                        style={{
                          transform: `translate3d(${x}px, ${y}px, ${z}px)`,
                          boxShadow: bit === '1' ? '0 0 10px hsl(var(--primary))' : '0 0 10px hsl(var(--destructive))',
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </Card>

            {partitionData.length > 0 && (
              <Card className="p-8">
                <h3 className="text-sm font-medium mb-8 text-center">Partition Sphere</h3>
                <div className="flex justify-center" style={{ perspective: '600px' }}>
                  <div 
                    className="relative animate-[spin_25s_linear_infinite]"
                    style={{
                      width: '250px',
                      height: '250px',
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    {partitionData.map((p, i) => {
                      const phi = Math.acos(-1 + (2 * i) / partitionData.length);
                      const theta = Math.sqrt(partitionData.length * Math.PI) * phi;
                      const radius = 120;
                      const x = radius * Math.cos(theta) * Math.sin(phi);
                      const y = radius * Math.sin(theta) * Math.sin(phi);
                      const z = radius * Math.cos(phi);
                      
                      return (
                        <div
                          key={i}
                          className="absolute w-8 h-8 rounded-full bg-primary/80 flex items-center justify-center text-xs font-bold"
                          style={{
                            transform: `translate3d(${x}px, ${y}px, ${z}px)`,
                            boxShadow: '0 0 15px hsl(var(--primary))',
                          }}
                        >
                          {i + 1}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
