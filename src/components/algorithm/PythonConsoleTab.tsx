/**
 * Python Console Tab - Interactive Python REPL for testing bitwise_api
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Play, Trash2, Terminal, Loader2, CheckCircle, XCircle, Info } from 'lucide-react';
import { pythonExecutor } from '@/lib/pythonExecutor';
import { toast } from 'sonner';

interface ConsoleEntry {
  id: string;
  type: 'input' | 'output' | 'error' | 'info';
  content: string;
  timestamp: Date;
}

const EXAMPLE_SNIPPETS = [
  {
    name: 'Test Operations',
    code: `from bitwise_api import apply_operation, get_available_operations

# List available operations
ops = get_available_operations()
log(f"Available operations: {len(ops)}")
for op in ops[:5]:
    log(f"  - {op}")

# Test NOT operation
bits = "10101010"
result = apply_operation("NOT", bits)
log(f"NOT {bits} = {result}")`,
  },
  {
    name: 'Test Metrics',
    code: `from bitwise_api import get_metric, get_all_metrics, get_available_metrics

bits = "10101010"

# Get single metric
entropy = get_metric("entropy", bits)
log(f"Entropy of {bits}: {entropy}")

# Get all metrics
all_metrics = get_all_metrics(bits)
log(f"All metrics: {len(all_metrics)} calculated")
for name, value in list(all_metrics.items())[:5]:
    log(f"  {name}: {value}")`,
  },
  {
    name: 'Strategy Example',
    code: `from bitwise_api import apply_operation, get_metric, deduct_budget, get_budget, log

def execute():
    bits = "11110000"
    log(f"Starting with: {bits}")
    log(f"Initial entropy: {get_metric('entropy', bits)}")
    
    # Try XOR operation
    if deduct_budget(5):
        result = apply_operation("XOR", bits, {"mask": "10101010"})
        log(f"After XOR: {result}")
        log(f"New entropy: {get_metric('entropy', result)}")
    else:
        log("Not enough budget!")
    
    log(f"Remaining budget: {get_budget()}")
    return result

execute()`,
  },
];

export const PythonConsoleTab = () => {
  const [code, setCode] = useState('');
  const [entries, setEntries] = useState<ConsoleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pyodideProgress, setPyodideProgress] = useState(0);
  const [isPyodideReady, setIsPyodideReady] = useState(pythonExecutor.isReady());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = pythonExecutor.subscribeProgress((progress) => {
      setPyodideProgress(progress);
      if (progress >= 100) {
        setIsPyodideReady(true);
      }
    });
    return unsubscribe;
  }, []);

  const addEntry = useCallback((type: ConsoleEntry['type'], content: string) => {
    setEntries((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        content,
        timestamp: new Date(),
      },
    ]);
  }, []);

  const runCode = useCallback(async () => {
    if (!code.trim()) return;

    setIsLoading(true);
    addEntry('input', code);

    try {
      // Load Pyodide if not ready
      if (!pythonExecutor.isReady()) {
        addEntry('info', 'Loading Python runtime (first time only)...');
        await pythonExecutor.loadPyodide();
      }

      const result = await pythonExecutor.sandboxTest(code, {
        bits: '10101010',
        budget: 100,
        metrics: {},
        operations: ['NOT', 'AND', 'OR', 'XOR', 'SHL', 'SHR', 'ROL', 'ROR', 'GRAY', 'REVERSE'],
      });

      // Add logs first
      if (result.logs.length > 0) {
        result.logs.forEach((log) => {
          if (log.startsWith('[ERROR]')) {
            addEntry('error', log);
          } else if (log.startsWith('[WARN]')) {
            addEntry('info', log);
          } else {
            addEntry('output', log);
          }
        });
      }

      if (result.success) {
        if (result.output !== undefined && result.output !== null) {
          addEntry('output', `Result: ${JSON.stringify(result.output)}`);
        }
        addEntry('info', `Executed in ${result.duration.toFixed(1)}ms`);
      } else {
        addEntry('error', result.error || 'Unknown error');
      }
    } catch (error) {
      addEntry('error', error instanceof Error ? error.message : String(error));
      toast.error('Python execution failed');
    } finally {
      setIsLoading(false);
    }
  }, [code, addEntry]);

  const loadSnippet = useCallback((snippet: (typeof EXAMPLE_SNIPPETS)[0]) => {
    setCode(snippet.code);
    toast.success(`Loaded: ${snippet.name}`);
  }, []);

  const clearConsole = useCallback(() => {
    setEntries([]);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div className="h-full flex flex-col p-4 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5" />
          <h3 className="font-semibold">Python Console</h3>
          {isPyodideReady ? (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="w-3 h-3 mr-1" />
              Ready
            </Badge>
          ) : pyodideProgress > 0 ? (
            <Badge variant="secondary">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Loading {pyodideProgress}%
            </Badge>
          ) : (
            <Badge variant="outline">Not loaded</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {EXAMPLE_SNIPPETS.map((snippet) => (
            <Button
              key={snippet.name}
              variant="outline"
              size="sm"
              onClick={() => loadSnippet(snippet)}
            >
              {snippet.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Console Output */}
      <Card className="flex-1 overflow-hidden">
        <CardHeader className="py-2 px-3 flex-row items-center justify-between">
          <CardTitle className="text-sm">Output</CardTitle>
          <Button variant="ghost" size="sm" onClick={clearConsole}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0 h-[calc(100%-40px)]">
          <ScrollArea className="h-full" ref={scrollRef}>
            <div className="p-3 font-mono text-sm space-y-1">
              {entries.length === 0 ? (
                <div className="text-muted-foreground italic">
                  Console output will appear here...
                </div>
              ) : (
                entries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`whitespace-pre-wrap ${
                      entry.type === 'input'
                        ? 'text-blue-400 border-l-2 border-blue-400 pl-2'
                        : entry.type === 'error'
                        ? 'text-red-400'
                        : entry.type === 'info'
                        ? 'text-muted-foreground'
                        : 'text-green-400'
                    }`}
                  >
                    {entry.type === 'input' && <span className="text-muted-foreground">{'>>> '}</span>}
                    {entry.content}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Input Area */}
      <div className="flex-shrink-0 space-y-2">
        <Textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter Python code here... Use bitwise_api module for operations and metrics."
          className="font-mono text-sm min-h-[120px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              runCode();
            }
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            <Info className="w-3 h-3 inline mr-1" />
            Press Ctrl+Enter to run. Use <code className="bg-muted px-1 rounded">from bitwise_api import *</code> for all functions.
          </span>
          <Button onClick={runCode} disabled={isLoading || !code.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run (Ctrl+Enter)
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
