import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Trash2, 
  Download,
  Copy,
  Terminal,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { fileSystemManager } from '@/lib/fileSystemManager';

interface ConsoleOutput {
  id: string;
  type: 'input' | 'output' | 'error' | 'info';
  content: string;
  timestamp: Date;
}

const EXAMPLE_CODE = `// TensorFlow.js Example: Binary Classification Model
// This creates a simple neural network to predict bit patterns

// Create a sequential model
const model = tf.sequential({
  layers: [
    tf.layers.dense({ inputShape: [8], units: 16, activation: 'relu' }),
    tf.layers.dense({ units: 8, activation: 'relu' }),
    tf.layers.dense({ units: 1, activation: 'sigmoid' })
  ]
});

// Compile the model
model.compile({
  optimizer: tf.train.adam(0.01),
  loss: 'binaryCrossentropy',
  metrics: ['accuracy']
});

// Log model summary
model.summary();

// Return model info
({ 
  status: 'Model created successfully',
  layers: model.layers.length,
  params: model.countParams()
});`;

export const TensorFlowConsoleTab = () => {
  const [code, setCode] = useState(EXAMPLE_CODE);
  const [outputs, setOutputs] = useState<ConsoleOutput[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [tfLoaded, setTfLoaded] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if TensorFlow.js is loaded
    const checkTf = () => {
      if ((window as any).tf) {
        setTfLoaded(true);
        addOutput('info', 'TensorFlow.js loaded successfully');
      }
    };

    if ((window as any).tf) {
      checkTf();
    } else {
      // Load TensorFlow.js
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js';
      script.onload = checkTf;
      script.onerror = () => addOutput('error', 'Failed to load TensorFlow.js');
      document.head.appendChild(script);
    }
  }, []);

  const addOutput = (type: ConsoleOutput['type'], content: string) => {
    const output: ConsoleOutput = {
      id: crypto.randomUUID(),
      type,
      content,
      timestamp: new Date(),
    };
    setOutputs(prev => [...prev, output]);
    
    // Scroll to bottom
    setTimeout(() => {
      outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);
  };

  const runCode = async () => {
    if (!tfLoaded) {
      toast.error('TensorFlow.js not loaded yet');
      return;
    }

    setIsRunning(true);
    addOutput('input', code);

    try {
      const tf = (window as any).tf;
      
      // Create context with useful functions
      const context = {
        tf,
        console: {
          log: (...args: any[]) => addOutput('output', args.map(a => 
            typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
          ).join(' ')),
          error: (...args: any[]) => addOutput('error', args.join(' ')),
          warn: (...args: any[]) => addOutput('info', args.join(' ')),
        },
        // Helper to get binary data
        getBinaryData: (fileId: string) => {
          const file = fileSystemManager.getFiles().find(f => f.id === fileId);
          return file?.state.model.getBits() || '';
        },
        listFiles: () => fileSystemManager.getFiles().map(f => ({ id: f.id, name: f.name })),
      };

      // Execute code in context
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const fn = new AsyncFunction('tf', 'console', 'getBinaryData', 'listFiles', `
        ${code}
      `);
      
      const result = await fn(context.tf, context.console, context.getBinaryData, context.listFiles);
      
      if (result !== undefined) {
        addOutput('output', typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result));
      }
      
    } catch (error: any) {
      addOutput('error', `Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearConsole = () => {
    setOutputs([]);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const exportOutputs = () => {
    const text = outputs.map(o => `[${o.type.toUpperCase()}] ${o.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tf_console_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Console output exported');
  };

  const getOutputIcon = (type: ConsoleOutput['type']) => {
    switch (type) {
      case 'input': return <Terminal className="w-3 h-3" />;
      case 'output': return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'error': return <XCircle className="w-3 h-3 text-red-500" />;
      case 'info': return <AlertTriangle className="w-3 h-3 text-yellow-500" />;
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* Status Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={tfLoaded ? 'default' : 'secondary'} className={tfLoaded ? 'bg-green-500/20 text-green-500' : ''}>
            {tfLoaded ? 'TensorFlow.js Ready' : 'Loading TensorFlow.js...'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyCode}>
            <Copy className="w-4 h-4 mr-1" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={exportOutputs}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Code Editor */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="py-3 bg-muted/30 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              Code Editor
            </CardTitle>
            <Button 
              size="sm" 
              onClick={runCode} 
              disabled={isRunning || !tfLoaded}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="w-4 h-4 mr-1" />
              Run
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter TensorFlow.js code..."
              className="h-full w-full resize-none border-0 rounded-none font-mono text-sm bg-background focus-visible:ring-0"
              spellCheck={false}
            />
          </CardContent>
        </Card>

        {/* Console Output */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="py-3 bg-muted/30 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              Console Output
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={clearConsole}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full" ref={outputRef}>
              <div className="p-3 space-y-2 font-mono text-sm">
                {outputs.length === 0 ? (
                  <div className="text-muted-foreground text-center py-8">
                    <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Console output will appear here</p>
                  </div>
                ) : (
                  outputs.map(output => (
                    <div 
                      key={output.id} 
                      className={`p-2 rounded text-xs ${
                        output.type === 'input' ? 'bg-blue-500/10 border-l-2 border-blue-500' :
                        output.type === 'error' ? 'bg-red-500/10 border-l-2 border-red-500' :
                        output.type === 'info' ? 'bg-yellow-500/10 border-l-2 border-yellow-500' :
                        'bg-green-500/10 border-l-2 border-green-500'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                        {getOutputIcon(output.type)}
                        <span className="uppercase text-[10px]">{output.type}</span>
                        <span className="text-[10px]">{output.timestamp.toLocaleTimeString()}</span>
                      </div>
                      <pre className="whitespace-pre-wrap break-all">{output.content}</pre>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Quick Reference */}
      <Card className="bg-muted/20">
        <CardContent className="py-3">
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span><code className="text-primary">tf</code> - TensorFlow.js instance</span>
            <span><code className="text-primary">listFiles()</code> - Get available data files</span>
            <span><code className="text-primary">getBinaryData(id)</code> - Get binary data from file</span>
            <span><code className="text-primary">console.log()</code> - Output to console</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
