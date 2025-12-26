import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Cpu, 
  HardDrive, 
  Monitor, 
  Zap,
  RefreshCw,
  Settings2,
  Activity,
} from 'lucide-react';

interface SystemResources {
  cpuCores: number;
  deviceMemory: number | null;
  hardwareConcurrency: number;
  webGLSupported: boolean;
  webGPUSupported: boolean;
  platform: string;
  userAgent: string;
}

interface ResourceAllocation {
  maxCpuCores: number;
  maxMemoryMB: number;
  useWebGL: boolean;
  useWebGPU: boolean;
  batchSize: number;
}

export const ResourcesTab = () => {
  const [resources, setResources] = useState<SystemResources | null>(null);
  const [allocation, setAllocation] = useState<ResourceAllocation>({
    maxCpuCores: 4,
    maxMemoryMB: 512,
    useWebGL: true,
    useWebGPU: false,
    batchSize: 32,
  });
  const [memoryUsage, setMemoryUsage] = useState<number>(0);

  useEffect(() => {
    detectResources();
    
    // Monitor memory usage if available
    const interval = setInterval(() => {
      if ((performance as any).memory) {
        const mem = (performance as any).memory;
        setMemoryUsage(Math.round((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const detectResources = async () => {
    // Check WebGL support
    const canvas = document.createElement('canvas');
    const webGLSupported = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));

    // Check WebGPU support
    let webGPUSupported = false;
    if ('gpu' in navigator) {
      try {
        const adapter = await (navigator as any).gpu?.requestAdapter();
        webGPUSupported = !!adapter;
      } catch {
        webGPUSupported = false;
      }
    }

    const systemResources: SystemResources = {
      cpuCores: navigator.hardwareConcurrency || 4,
      deviceMemory: (navigator as any).deviceMemory || null,
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
      webGLSupported,
      webGPUSupported,
      platform: navigator.platform || 'Unknown',
      userAgent: navigator.userAgent,
    };

    setResources(systemResources);

    // Set default allocation based on detected resources
    setAllocation(prev => ({
      ...prev,
      maxCpuCores: Math.max(1, Math.floor(systemResources.cpuCores / 2)),
      maxMemoryMB: systemResources.deviceMemory ? Math.floor(systemResources.deviceMemory * 1024 / 4) : 512,
      useWebGL: webGLSupported,
      useWebGPU: webGPUSupported,
    }));
  };

  if (!resources) {
    return (
      <div className="flex items-center justify-center h-full">
        <Activity className="w-8 h-8 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      {/* System Info */}
      <Card className="bg-gradient-to-r from-primary/10 to-transparent border-primary/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Monitor className="w-4 h-4 text-primary" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Cpu className="w-3 h-3" />
                CPU Cores
              </div>
              <div className="text-2xl font-bold text-primary">{resources.cpuCores}</div>
            </div>

            <div className="p-3 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <HardDrive className="w-3 h-3" />
                Device Memory
              </div>
              <div className="text-2xl font-bold text-primary">
                {resources.deviceMemory ? `${resources.deviceMemory} GB` : 'N/A'}
              </div>
            </div>

            <div className="p-3 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Zap className="w-3 h-3" />
                WebGL
              </div>
              <Badge variant={resources.webGLSupported ? 'default' : 'secondary'} className={resources.webGLSupported ? 'bg-green-500/20 text-green-500' : ''}>
                {resources.webGLSupported ? 'Supported' : 'Not Available'}
              </Badge>
            </div>

            <div className="p-3 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Zap className="w-3 h-3" />
                WebGPU
              </div>
              <Badge variant={resources.webGPUSupported ? 'default' : 'secondary'} className={resources.webGPUSupported ? 'bg-green-500/20 text-green-500' : ''}>
                {resources.webGPUSupported ? 'Supported' : 'Not Available'}
              </Badge>
            </div>
          </div>

          <div className="mt-4 p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground">
            <div><strong>Platform:</strong> {resources.platform}</div>
          </div>
        </CardContent>
      </Card>

      {/* Current Usage */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Current Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>JavaScript Heap Memory</span>
                <span>{memoryUsage}%</span>
              </div>
              <Progress value={memoryUsage} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resource Allocation */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" />
              Training Resource Allocation
            </CardTitle>
            <Button variant="outline" size="sm" onClick={detectResources}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* CPU Cores */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Max CPU Cores for Training</Label>
              <span className="text-sm font-mono text-primary">{allocation.maxCpuCores} / {resources.cpuCores}</span>
            </div>
            <Slider
              value={[allocation.maxCpuCores]}
              onValueChange={([val]) => setAllocation(prev => ({ ...prev, maxCpuCores: val }))}
              min={1}
              max={resources.cpuCores}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              Limit CPU usage to prevent system slowdown during training
            </p>
          </div>

          {/* Memory */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Max Memory (MB)</Label>
              <span className="text-sm font-mono text-primary">{allocation.maxMemoryMB} MB</span>
            </div>
            <Slider
              value={[allocation.maxMemoryMB]}
              onValueChange={([val]) => setAllocation(prev => ({ ...prev, maxMemoryMB: val }))}
              min={128}
              max={resources.deviceMemory ? resources.deviceMemory * 1024 : 2048}
              step={64}
            />
            <p className="text-xs text-muted-foreground">
              Memory limit for TensorFlow.js tensors and model weights
            </p>
          </div>

          {/* Batch Size */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Default Batch Size</Label>
              <span className="text-sm font-mono text-primary">{allocation.batchSize}</span>
            </div>
            <Slider
              value={[allocation.batchSize]}
              onValueChange={([val]) => setAllocation(prev => ({ ...prev, batchSize: val }))}
              min={1}
              max={256}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              Larger batches use more memory but may train faster
            </p>
          </div>

          {/* GPU Acceleration */}
          <div className="grid grid-cols-2 gap-4">
            <Card className={`p-3 cursor-pointer transition-all ${allocation.useWebGL ? 'border-primary bg-primary/10' : 'border-border'}`}
              onClick={() => resources.webGLSupported && setAllocation(prev => ({ ...prev, useWebGL: !prev.useWebGL }))}
            >
              <div className="flex items-center gap-2 mb-1">
                <Zap className={`w-4 h-4 ${allocation.useWebGL ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="font-medium">WebGL</span>
              </div>
              <p className="text-xs text-muted-foreground">
                GPU acceleration via WebGL
              </p>
              <Badge className="mt-2" variant={allocation.useWebGL ? 'default' : 'secondary'}>
                {allocation.useWebGL ? 'Enabled' : 'Disabled'}
              </Badge>
            </Card>

            <Card className={`p-3 cursor-pointer transition-all ${allocation.useWebGPU ? 'border-primary bg-primary/10' : 'border-border'} ${!resources.webGPUSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => resources.webGPUSupported && setAllocation(prev => ({ ...prev, useWebGPU: !prev.useWebGPU }))}
            >
              <div className="flex items-center gap-2 mb-1">
                <Zap className={`w-4 h-4 ${allocation.useWebGPU ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="font-medium">WebGPU</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Next-gen GPU compute API
              </p>
              <Badge className="mt-2" variant={allocation.useWebGPU ? 'default' : 'secondary'}>
                {!resources.webGPUSupported ? 'Not Available' : allocation.useWebGPU ? 'Enabled' : 'Disabled'}
              </Badge>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-muted/20 border-muted">
        <CardContent className="py-3">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> Resource limits are applied to TensorFlow.js training. 
            WebGL provides GPU acceleration for matrix operations, significantly speeding up neural network training.
            WebGPU is the newer API with better performance but has limited browser support.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
