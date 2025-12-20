/**
 * Python Console Tab - Interactive Python REPL with:
 * - Syntax highlighting (Prism)
 * - Command history (up/down arrows)
 * - Multiple terminal tabs
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Trash2, 
  Terminal, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Info, 
  Plus, 
  X, 
  ChevronUp, 
  ChevronDown,
  Copy,
  Check
} from 'lucide-react';
import { pythonExecutor } from '@/lib/pythonExecutor';
import { toast } from 'sonner';
import { Highlight, themes } from 'prism-react-renderer';

interface ConsoleEntry {
  id: string;
  type: 'input' | 'output' | 'error' | 'info';
  content: string;
  timestamp: Date;
}

interface TerminalTab {
  id: string;
  name: string;
  entries: ConsoleEntry[];
  history: string[];
  historyIndex: number;
  code: string;
}

const EXAMPLE_SNIPPETS = [
  {
    name: 'Test Operations',
    code: `from bitwise_api import apply_operation, get_available_operations, log

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
    code: `from bitwise_api import get_metric, get_all_metrics, get_available_metrics, log

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

// Python syntax highlighting component
const PythonCodeHighlight = ({ code, className = '' }: { code: string; className?: string }) => {
  return (
    <Highlight theme={themes.nightOwl} code={code} language="python">
      {({ className: hlClassName, style, tokens, getLineProps, getTokenProps }) => (
        <pre className={`${hlClassName} ${className} bg-transparent m-0 p-0`} style={{ ...style, background: 'transparent' }}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
};

// Syntax-highlighted textarea overlay
const SyntaxTextarea = ({ 
  value, 
  onChange, 
  onKeyDown, 
  placeholder,
  disabled 
}: { 
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  placeholder: string;
  disabled?: boolean;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleScroll = () => {
    if (textareaRef.current) {
      setScrollTop(textareaRef.current.scrollTop);
      setScrollLeft(textareaRef.current.scrollLeft);
    }
  };

  return (
    <div className="relative font-mono text-sm min-h-[120px] border rounded-md overflow-hidden bg-card">
      {/* Highlighted code underneath */}
      <div 
        className="absolute inset-0 p-3 pointer-events-none overflow-hidden whitespace-pre-wrap break-words"
        style={{ 
          transform: `translate(${-scrollLeft}px, ${-scrollTop}px)`,
        }}
      >
        {value ? (
          <PythonCodeHighlight code={value} />
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </div>
      
      {/* Transparent textarea on top */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onScroll={handleScroll}
        disabled={disabled}
        className="relative z-10 w-full h-full min-h-[120px] p-3 bg-transparent text-transparent caret-foreground resize-none outline-none"
        spellCheck={false}
        style={{ caretColor: 'hsl(var(--foreground))' }}
      />
    </div>
  );
};

export const PythonConsoleTab = () => {
  const [tabs, setTabs] = useState<TerminalTab[]>([{
    id: 'terminal-1',
    name: 'Terminal 1',
    entries: [],
    history: [],
    historyIndex: -1,
    code: '',
  }]);
  const [activeTabId, setActiveTabId] = useState('terminal-1');
  const [isLoading, setIsLoading] = useState(false);
  const [pyodideProgress, setPyodideProgress] = useState(0);
  const [isPyodideReady, setIsPyodideReady] = useState(pythonExecutor.isReady());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabCounter = useRef(2);

  const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId]);

  useEffect(() => {
    const unsubscribe = pythonExecutor.subscribeProgress((progress) => {
      setPyodideProgress(progress);
      if (progress >= 100) {
        setIsPyodideReady(true);
      }
    });
    return unsubscribe;
  }, []);

  const updateActiveTab = useCallback((updater: (tab: TerminalTab) => TerminalTab) => {
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId ? updater(tab) : tab
    ));
  }, [activeTabId]);

  const addEntry = useCallback((type: ConsoleEntry['type'], content: string) => {
    updateActiveTab(tab => ({
      ...tab,
      entries: [
        ...tab.entries,
        {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type,
          content,
          timestamp: new Date(),
        },
      ],
    }));
  }, [updateActiveTab]);

  const setCode = useCallback((code: string) => {
    updateActiveTab(tab => ({ ...tab, code }));
  }, [updateActiveTab]);

  const runCode = useCallback(async () => {
    const code = activeTab?.code || '';
    if (!code.trim()) return;

    setIsLoading(true);
    addEntry('input', code);

    // Add to history
    updateActiveTab(tab => ({
      ...tab,
      history: [code, ...tab.history.filter(h => h !== code)].slice(0, 50),
      historyIndex: -1,
    }));

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
      setCode('');
    }
  }, [activeTab?.code, addEntry, setCode, updateActiveTab]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Run on Ctrl+Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      runCode();
      return;
    }

    // History navigation
    if (e.key === 'ArrowUp' && e.ctrlKey) {
      e.preventDefault();
      updateActiveTab(tab => {
        const newIndex = Math.min(tab.historyIndex + 1, tab.history.length - 1);
        if (newIndex >= 0 && tab.history[newIndex]) {
          return { ...tab, historyIndex: newIndex, code: tab.history[newIndex] };
        }
        return tab;
      });
      return;
    }

    if (e.key === 'ArrowDown' && e.ctrlKey) {
      e.preventDefault();
      updateActiveTab(tab => {
        const newIndex = tab.historyIndex - 1;
        if (newIndex < 0) {
          return { ...tab, historyIndex: -1, code: '' };
        }
        return { ...tab, historyIndex: newIndex, code: tab.history[newIndex] || '' };
      });
      return;
    }
  }, [runCode, updateActiveTab]);

  const loadSnippet = useCallback((snippet: (typeof EXAMPLE_SNIPPETS)[0]) => {
    setCode(snippet.code);
    toast.success(`Loaded: ${snippet.name}`);
  }, [setCode]);

  const clearConsole = useCallback(() => {
    updateActiveTab(tab => ({ ...tab, entries: [] }));
  }, [updateActiveTab]);

  const addTab = useCallback(() => {
    const newTab: TerminalTab = {
      id: `terminal-${tabCounter.current}`,
      name: `Terminal ${tabCounter.current}`,
      entries: [],
      history: [],
      historyIndex: -1,
      code: '',
    };
    tabCounter.current++;
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, []);

  const closeTab = useCallback((tabId: string) => {
    if (tabs.length <= 1) {
      toast.error('Cannot close the last terminal');
      return;
    }
    
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      }
      return newTabs;
    });
  }, [tabs.length, activeTabId]);

  const copyEntry = useCallback((entry: ConsoleEntry) => {
    navigator.clipboard.writeText(entry.content);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeTab?.entries]);

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
        <div className="flex items-center gap-2 flex-wrap">
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

      {/* Terminal Tabs */}
      <div className="flex items-center gap-1 border-b overflow-x-auto flex-shrink-0">
        {tabs.map(tab => (
          <div 
            key={tab.id}
            className={`flex items-center gap-1 px-3 py-1.5 cursor-pointer border-b-2 transition-colors ${
              tab.id === activeTabId 
                ? 'border-primary text-foreground bg-muted/30' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTabId(tab.id)}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="text-sm">{tab.name}</span>
            {tabs.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="w-4 h-4 p-0 ml-1 hover:bg-destructive/20"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        ))}
        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7 flex-shrink-0"
          onClick={addTab}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Console Output */}
      <Card className="flex-1 overflow-hidden">
        <CardHeader className="py-2 px-3 flex-row items-center justify-between">
          <CardTitle className="text-sm">Output</CardTitle>
          <div className="flex items-center gap-2">
            {activeTab && activeTab.history.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {activeTab.history.length} in history
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearConsole}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 h-[calc(100%-40px)]">
          <ScrollArea className="h-full" ref={scrollRef}>
            <div className="p-3 font-mono text-sm space-y-2">
              {(!activeTab || activeTab.entries.length === 0) ? (
                <div className="text-muted-foreground italic">
                  Console output will appear here. Python is connected to REAL operations and metrics.
                </div>
              ) : (
                activeTab.entries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`group whitespace-pre-wrap relative pr-8 ${
                      entry.type === 'input'
                        ? 'border-l-2 border-blue-400 pl-2 bg-blue-400/5 py-1 rounded'
                        : entry.type === 'error'
                        ? 'text-red-400'
                        : entry.type === 'info'
                        ? 'text-muted-foreground text-xs'
                        : 'text-green-400'
                    }`}
                  >
                    {entry.type === 'input' ? (
                      <PythonCodeHighlight code={entry.content} />
                    ) : (
                      <span>{entry.content}</span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyEntry(entry)}
                    >
                      {copiedId === entry.id ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Input Area */}
      <div className="flex-shrink-0 space-y-2">
        <SyntaxTextarea
          value={activeTab?.code || ''}
          onChange={setCode}
          onKeyDown={handleKeyDown}
          placeholder="Enter Python code here... Use bitwise_api module for operations and metrics."
          disabled={isLoading}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              <Info className="w-3 h-3 inline mr-1" />
              <kbd className="px-1 bg-muted rounded">Ctrl+Enter</kbd> run
            </span>
            <span>
              <ChevronUp className="w-3 h-3 inline" />
              <ChevronDown className="w-3 h-3 inline mr-1" />
              <kbd className="px-1 bg-muted rounded">Ctrl+↑/↓</kbd> history
            </span>
          </div>
          <Button onClick={runCode} disabled={isLoading || !(activeTab?.code?.trim())}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
