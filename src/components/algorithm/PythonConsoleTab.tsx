/**
 * Python Console Tab - Interactive Python REPL with:
 * - Syntax highlighting (Prism)
 * - Command history (up/down arrows)
 * - Multiple terminal tabs
 * - Script manager integration
 * - Strategy runner integration
 * - CSV export
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Play, 
  Trash2, 
  Terminal, 
  Loader2, 
  CheckCircle, 
  Plus, 
  X, 
  ChevronUp, 
  ChevronDown,
  Copy,
  Check,
  Save,
  FolderOpen,
  FileCode,
  Download,
  Keyboard,
  MoreVertical,
  RotateCcw,
  Clipboard,
  FileText,
  Activity,
  Zap
} from 'lucide-react';
import { pythonExecutor, PythonExecutionResult } from '@/lib/pythonExecutor';
import { pythonModuleSystem, PythonFile } from '@/lib/pythonModuleSystem';
import { strategyRunner, REAL_TEST_STRATEGY, StrategyRunResult } from '@/lib/strategyRunner';
import { strategyExecutionEngine, ExecutionPipelineResult } from '@/lib/strategyExecutionEngine';
import { fileSystemManager, BinaryFile } from '@/lib/fileSystemManager';
import { loadExampleAlgorithmFiles } from '@/lib/exampleAlgorithmFiles';
import { toast } from 'sonner';
import { Highlight, themes } from 'prism-react-renderer';

interface ConsoleEntry {
  id: string;
  type: 'input' | 'output' | 'error' | 'info' | 'stats';
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
  lastResult?: StrategyRunResult;
}

interface SavedScript {
  id: string;
  name: string;
  code: string;
  created: Date;
}

const STORAGE_KEY = 'python_console_scripts';

const EXAMPLE_SNIPPETS = [
  {
    name: 'Quick Test',
    code: `from bitwise_api import apply_operation, get_metric, get_bits, log

bits = get_bits()
log(f"Input: {bits[:20]}... ({len(bits)} bits)")
log(f"Entropy: {get_metric('entropy'):.4f}")

result = apply_operation("NOT", bits)
log(f"After NOT: {result[:20]}...")
log(f"New Entropy: {get_metric('entropy', result):.4f}")`,
  },
  {
    name: 'Full Analysis',
    code: `from bitwise_api import get_all_metrics, get_bits, log

bits = get_bits()
log(f"Analyzing {len(bits)} bits...")
log("")

metrics = get_all_metrics()
log("=== Metrics ===")
for name, value in sorted(metrics.items()):
    log(f"  {name}: {value:.4f}")`,
  },
  {
    name: 'Real Strategy',
    code: REAL_TEST_STRATEGY,
  },
];

// Load example files on first render
let examplesLoaded = false;
const ensureExamplesLoaded = () => {
  if (!examplesLoaded) {
    loadExampleAlgorithmFiles(pythonModuleSystem);
    examplesLoaded = true;
  }
};

const KEYBOARD_SHORTCUTS = [
  { keys: 'Ctrl+Enter', description: 'Run code' },
  { keys: 'Ctrl+L', description: 'Clear console' },
  { keys: 'Ctrl+S', description: 'Save script' },
  { keys: 'Ctrl+↑', description: 'Previous history' },
  { keys: 'Ctrl+↓', description: 'Next history' },
  { keys: 'Ctrl+K', description: 'Clear input' },
  { keys: 'Ctrl+D', description: 'Duplicate terminal' },
  { keys: 'Ctrl+W', description: 'Close terminal' },
  { keys: 'Ctrl+T', description: 'New terminal' },
  { keys: 'Ctrl+E', description: 'Export CSV' },
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
  disabled,
  textareaRef
}: { 
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  placeholder: string;
  disabled?: boolean;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
}) => {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const ref = textareaRef || internalRef;
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleScroll = () => {
    if (ref.current) {
      setScrollTop(ref.current.scrollTop);
      setScrollLeft(ref.current.scrollLeft);
    }
  };

  return (
    <div className="relative font-mono text-sm min-h-[150px] border rounded-md overflow-hidden bg-card">
      <div 
        className="absolute inset-0 p-3 pointer-events-none overflow-hidden whitespace-pre-wrap break-words"
        style={{ transform: `translate(${-scrollLeft}px, ${-scrollTop}px)` }}
      >
        {value ? (
          <PythonCodeHighlight code={value} />
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onScroll={handleScroll}
        disabled={disabled}
        className="relative z-10 w-full h-full min-h-[150px] p-3 bg-transparent text-transparent caret-foreground resize-none outline-none"
        spellCheck={false}
        style={{ caretColor: 'hsl(var(--foreground))' }}
      />
    </div>
  );
};

// Stats Display Component
const StatsDisplay = ({ result }: { result: StrategyRunResult }) => (
  <div className="grid grid-cols-2 gap-2 p-3 bg-muted/30 rounded-lg text-sm">
    <div className="flex items-center gap-2">
      <Activity className="w-4 h-4 text-primary" />
      <span>Operations: {result.totalOperations}</span>
    </div>
    <div className="flex items-center gap-2">
      <Zap className="w-4 h-4 text-yellow-500" />
      <span>Bits Changed: {result.totalBitsChanged}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">Duration:</span>
      <span>{result.duration}ms</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">Budget:</span>
      <span>{result.budgetUsed} used / {result.budgetRemaining} left</span>
    </div>
    {result.tempFileName && (
      <div className="col-span-2 flex items-center gap-2 text-primary">
        <FileText className="w-4 h-4" />
        <span>Created: {result.tempFileName}</span>
      </div>
    )}
  </div>
);

// Keyboard Shortcuts Dialog
const KeyboardShortcutsDialog = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="ghost" size="sm">
        <Keyboard className="w-4 h-4" />
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Keyboard className="w-5 h-5" />
          Keyboard Shortcuts
        </DialogTitle>
      </DialogHeader>
      <div className="grid gap-2">
        {KEYBOARD_SHORTCUTS.map(shortcut => (
          <div key={shortcut.keys} className="flex items-center justify-between py-1.5 border-b last:border-0">
            <span className="text-sm">{shortcut.description}</span>
            <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">{shortcut.keys}</kbd>
          </div>
        ))}
      </div>
    </DialogContent>
  </Dialog>
);

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
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [budget, setBudget] = useState(100);
  const [binaryFiles, setBinaryFiles] = useState<BinaryFile[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const tabCounter = useRef(2);

  const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId]);

  useEffect(() => {
    const unsubscribe = pythonExecutor.subscribeProgress((progress) => {
      setPyodideProgress(progress);
      if (progress >= 100) setIsPyodideReady(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    setBinaryFiles(fileSystemManager.getFiles());
    const activeFile = fileSystemManager.getActiveFile();
    if (activeFile) setSelectedFileId(activeFile.id);
    
    const unsubscribe = fileSystemManager.subscribe(() => {
      setBinaryFiles(fileSystemManager.getFiles());
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
      entries: [...tab.entries, {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        content,
        timestamp: new Date(),
      }],
    }));
  }, [updateActiveTab]);

  const setCode = useCallback((code: string) => {
    updateActiveTab(tab => ({ ...tab, code }));
  }, [updateActiveTab]);

  const clearConsole = useCallback(() => {
    updateActiveTab(tab => ({ ...tab, entries: [] }));
    toast.success('Console cleared');
  }, [updateActiveTab]);

  const clearInput = useCallback(() => {
    setCode('');
  }, [setCode]);

  const copyAllOutput = useCallback(() => {
    if (!activeTab) return;
    const output = activeTab.entries
      .filter(e => e.type !== 'input')
      .map(e => e.content)
      .join('\n');
    navigator.clipboard.writeText(output);
    toast.success('Output copied');
  }, [activeTab]);

  const exportCSV = useCallback(() => {
    if (!activeTab?.lastResult) {
      toast.error('No results to export. Run a strategy first.');
      return;
    }
    const csv = strategyRunner.exportToCSV(activeTab.lastResult);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strategy_result_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  }, [activeTab?.lastResult]);

  // Load examples on mount
  useEffect(() => {
    ensureExamplesLoaded();
  }, []);

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

  const duplicateTab = useCallback(() => {
    if (!activeTab) return;
    const newTab: TerminalTab = {
      id: `terminal-${tabCounter.current}`,
      name: `Terminal ${tabCounter.current}`,
      entries: [...activeTab.entries],
      history: [...activeTab.history],
      historyIndex: -1,
      code: activeTab.code,
    };
    tabCounter.current++;
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, [activeTab]);

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

  const runCode = useCallback(async () => {
    const code = activeTab?.code || '';
    if (!code.trim()) return;

    if (!selectedFileId) {
      toast.error('Select a data file first');
      return;
    }

    setIsLoading(true);
    addEntry('input', code);

    updateActiveTab(tab => ({
      ...tab,
      history: [code, ...tab.history.filter(h => h !== code)].slice(0, 50),
      historyIndex: -1,
    }));

    try {
      if (!pythonExecutor.isReady()) {
        addEntry('info', 'Loading Python runtime (first time only)...');
        await pythonExecutor.loadPyodide();
      }

      addEntry('info', 'Running strategy...');

      const result = await strategyRunner.runStrategy({
        strategyCode: code,
        sourceFileId: selectedFileId,
        budget,
      });

      // Add logs
      result.logs.forEach(log => {
        if (log.startsWith('[ERROR]')) {
          addEntry('error', log);
        } else if (log.startsWith('[WARN]')) {
          addEntry('info', log);
        } else {
          addEntry('output', log);
        }
      });

      if (result.success) {
        addEntry('info', `✓ Completed in ${result.duration}ms`);
        
        // Store result for export
        updateActiveTab(tab => ({ ...tab, lastResult: result }));
        
        // Show stats summary
        addEntry('stats', JSON.stringify({
          operations: result.totalOperations,
          bitsChanged: result.totalBitsChanged,
          budgetUsed: result.budgetUsed,
          tempFile: result.tempFileName,
        }));

        if (result.tempFileName) {
          toast.success(`Created ${result.tempFileName} - switch to Analysis mode to view`);
        }
      } else {
        addEntry('error', result.error || 'Execution failed');
      }
    } catch (error) {
      addEntry('error', error instanceof Error ? error.message : String(error));
      toast.error('Execution failed');
    } finally {
      setIsLoading(false);
      setCode('');
    }
  }, [activeTab?.code, selectedFileId, budget, addEntry, setCode, updateActiveTab]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      
      if (isCtrl && e.key === 'l') { e.preventDefault(); clearConsole(); }
      else if (isCtrl && e.key === 't') { e.preventDefault(); addTab(); }
      else if (isCtrl && e.key === 'd') { e.preventDefault(); duplicateTab(); }
      else if (isCtrl && e.key === 'w') { e.preventDefault(); closeTab(activeTabId); }
      else if (isCtrl && e.key === 'e') { e.preventDefault(); exportCSV(); }
      else if (isCtrl && e.shiftKey && e.key === 'C') { e.preventDefault(); copyAllOutput(); }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [clearConsole, addTab, duplicateTab, closeTab, activeTabId, exportCSV, copyAllOutput]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const isCtrl = e.ctrlKey || e.metaKey;

    if (e.key === 'Enter' && isCtrl) { e.preventDefault(); runCode(); return; }
    if (e.key === 'k' && isCtrl) { e.preventDefault(); clearInput(); return; }
    if (e.key === 'ArrowUp' && isCtrl) {
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
    if (e.key === 'ArrowDown' && isCtrl) {
      e.preventDefault();
      updateActiveTab(tab => {
        const newIndex = tab.historyIndex - 1;
        if (newIndex < 0) return { ...tab, historyIndex: -1, code: '' };
        return { ...tab, historyIndex: newIndex, code: tab.history[newIndex] || '' };
      });
    }
  }, [runCode, clearInput, updateActiveTab]);

  const loadSnippet = useCallback((snippet: typeof EXAMPLE_SNIPPETS[0]) => {
    setCode(snippet.code);
    toast.success(`Loaded: ${snippet.name}`);
  }, [setCode]);

  const copyEntry = useCallback((entry: ConsoleEntry) => {
    navigator.clipboard.writeText(entry.content);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeTab?.entries]);

  const renderEntry = (entry: ConsoleEntry) => {
    if (entry.type === 'stats') {
      try {
        const stats = JSON.parse(entry.content);
        return (
          <div className="p-2 bg-primary/10 rounded-lg text-sm border border-primary/20">
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-muted-foreground">Operations:</span> {stats.operations}</div>
              <div><span className="text-muted-foreground">Bits Changed:</span> {stats.bitsChanged}</div>
              <div><span className="text-muted-foreground">Budget Used:</span> {stats.budgetUsed}</div>
              {stats.tempFile && (
                <div className="col-span-2 text-primary">
                  <FileText className="w-3 h-3 inline mr-1" />
                  {stats.tempFile}
                </div>
              )}
            </div>
          </div>
        );
      } catch {
        return <span>{entry.content}</span>;
      }
    }

    if (entry.type === 'input') {
      return <PythonCodeHighlight code={entry.content} />;
    }

    return <span>{entry.content}</span>;
  };

  return (
    <div className="h-full flex flex-col p-4 gap-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0 flex-wrap gap-2">
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
              {pyodideProgress}%
            </Badge>
          ) : (
            <Badge variant="outline">Not loaded</Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">Examples</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {EXAMPLE_SNIPPETS.map((snippet) => (
                <DropdownMenuItem key={snippet.name} onClick={() => loadSnippet(snippet)}>
                  <FileCode className="w-4 h-4 mr-2" />
                  {snippet.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={!activeTab?.lastResult}>
            <Download className="w-4 h-4 mr-1" />
            CSV
          </Button>

          <KeyboardShortcutsDialog />
        </div>
      </div>

      {/* Data File Selection */}
      <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg flex-shrink-0">
        <div className="flex items-center gap-2 flex-1">
          <Label className="text-sm whitespace-nowrap">Data File:</Label>
          <Select value={selectedFileId} onValueChange={setSelectedFileId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select data file..." />
            </SelectTrigger>
            <SelectContent>
              {binaryFiles.map(file => (
                <SelectItem key={file.id} value={file.id}>
                  {file.name} ({file.state.model.getBits().length} bits)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm">Budget:</Label>
          <Input
            type="number"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-20 h-8"
            min={1}
          />
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
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        ))}
        <Button variant="ghost" size="icon" className="w-7 h-7 flex-shrink-0" onClick={addTab}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Console Output */}
      <Card className="flex-1 overflow-hidden">
        <CardHeader className="py-2 px-3 flex-row items-center justify-between">
          <CardTitle className="text-sm">Output</CardTitle>
          <div className="flex items-center gap-2">
            {activeTab?.history.length ? (
              <Badge variant="outline" className="text-xs">{activeTab.history.length} in history</Badge>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={clearConsole}>
                  <Trash2 className="w-4 h-4 mr-2" />Clear (Ctrl+L)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyAllOutput}>
                  <Clipboard className="w-4 h-4 mr-2" />Copy all
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={exportCSV} disabled={!activeTab?.lastResult}>
                  <Download className="w-4 h-4 mr-2" />Export CSV (Ctrl+E)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-0 h-[calc(100%-40px)]">
          <ScrollArea className="h-full" ref={scrollRef}>
            <div className="p-3 font-mono text-sm space-y-2">
              {(!activeTab || activeTab.entries.length === 0) ? (
                <div className="text-muted-foreground italic">
                  <p>Python console connected to REAL operations and metrics.</p>
                  <p className="mt-2 text-xs">Select a data file, then run code with <kbd className="px-1 bg-muted rounded">Ctrl+Enter</kbd></p>
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
                        : entry.type === 'stats'
                        ? ''
                        : 'text-green-400'
                    }`}
                  >
                    {renderEntry(entry)}
                    {entry.type !== 'stats' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 w-6 h-6 opacity-0 group-hover:opacity-100"
                        onClick={() => copyEntry(entry)}
                      >
                        {copiedId === entry.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    )}
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
          placeholder="Enter Python code... Use 'from bitwise_api import *' for all functions"
          disabled={isLoading}
          textareaRef={textareaRef}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span><kbd className="px-1 bg-muted rounded">Ctrl+Enter</kbd> run</span>
            <span><kbd className="px-1 bg-muted rounded">Ctrl+↑/↓</kbd> history</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={clearInput} disabled={!activeTab?.code?.trim()}>
              <RotateCcw className="w-4 h-4 mr-1" />Clear
            </Button>
            <Button onClick={runCode} disabled={isLoading || !activeTab?.code?.trim() || !selectedFileId}>
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Running...</>
              ) : (
                <><Play className="w-4 h-4 mr-2" />Run</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
