/**
 * Python Console Tab - Interactive Python REPL with:
 * - Syntax highlighting (Prism)
 * - Command history (up/down arrows)
 * - Multiple terminal tabs
 * - Script manager integration
 * - Enhanced keyboard shortcuts
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Clipboard
} from 'lucide-react';
import { pythonExecutor } from '@/lib/pythonExecutor';
import { pythonModuleSystem, PythonFile } from '@/lib/pythonModuleSystem';
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

interface SavedScript {
  id: string;
  name: string;
  code: string;
  created: Date;
}

const STORAGE_KEY = 'python_console_scripts';

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
  { keys: 'Ctrl+Shift+C', description: 'Copy all output' },
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
        ref={ref}
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

// Script Manager Component
const ScriptManager = ({ 
  onLoad, 
  currentCode,
  onSave
}: { 
  onLoad: (code: string) => void;
  currentCode: string;
  onSave: (name: string) => void;
}) => {
  const [scripts, setScripts] = useState<SavedScript[]>([]);
  const [newName, setNewName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [pythonFiles, setPythonFiles] = useState<PythonFile[]>([]);

  useEffect(() => {
    // Load saved scripts from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setScripts(parsed.map((s: any) => ({ ...s, created: new Date(s.created) })));
      }
    } catch (e) {
      console.error('Failed to load scripts', e);
    }

    // Load Python files from module system
    setPythonFiles(pythonModuleSystem.getAllFiles());
    const unsubscribe = pythonModuleSystem.subscribe(() => {
      setPythonFiles(pythonModuleSystem.getAllFiles());
    });
    return unsubscribe;
  }, []);

  const saveScript = () => {
    if (!newName.trim()) {
      toast.error('Please enter a script name');
      return;
    }

    const script: SavedScript = {
      id: `script_${Date.now()}`,
      name: newName.trim(),
      code: currentCode,
      created: new Date(),
    };

    const updated = [...scripts, script];
    setScripts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setNewName('');
    setShowSaveDialog(false);
    toast.success(`Script "${script.name}" saved`);
    onSave(script.name);
  };

  const deleteScript = (id: string) => {
    const updated = scripts.filter(s => s.id !== id);
    setScripts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    toast.success('Script deleted');
  };

  const exportScript = (script: SavedScript) => {
    const blob = new Blob([script.code], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${script.name}.py`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Script exported');
  };

  return (
    <div className="space-y-4">
      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={!currentCode.trim()}>
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Script</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Script name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveScript()}
            />
            <Button onClick={saveScript} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Save Script
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load from saved scripts */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <FolderOpen className="w-4 h-4 mr-1" />
            Load
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 max-h-80 overflow-auto">
          {scripts.length === 0 && pythonFiles.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">No saved scripts</div>
          ) : (
            <>
              {scripts.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Console Scripts</div>
                  {scripts.map(script => (
                    <DropdownMenuItem key={script.id} className="flex items-center justify-between group">
                      <span 
                        className="flex-1 cursor-pointer"
                        onClick={() => {
                          onLoad(script.code);
                          toast.success(`Loaded: ${script.name}`);
                        }}
                      >
                        <FileCode className="w-4 h-4 inline mr-2" />
                        {script.name}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            exportScript(script);
                          }}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteScript(script.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </>
              )}
              
              {pythonFiles.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Python Files</div>
                  {pythonFiles.slice(0, 10).map(file => (
                    <DropdownMenuItem 
                      key={file.id}
                      onClick={() => {
                        onLoad(file.content);
                        toast.success(`Loaded: ${file.name}`);
                      }}
                    >
                      <FileCode className="w-4 h-4 mr-2 text-yellow-500" />
                      <span className="flex-1">{file.name}</span>
                      <Badge variant="outline" className="text-xs ml-2">{file.group}</Badge>
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
    toast.success('Output copied to clipboard');
  }, [activeTab]);

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
    toast.success('New terminal created');
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
    toast.success('Terminal duplicated');
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
    toast.success('Terminal closed');
  }, [tabs.length, activeTabId]);

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

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Only handle if textarea is focused or we're in the console area
      const isCtrl = e.ctrlKey || e.metaKey;
      
      if (isCtrl && e.key === 'l') {
        e.preventDefault();
        clearConsole();
      } else if (isCtrl && e.key === 't') {
        e.preventDefault();
        addTab();
      } else if (isCtrl && e.key === 'd') {
        e.preventDefault();
        duplicateTab();
      } else if (isCtrl && e.key === 'w') {
        e.preventDefault();
        closeTab(activeTabId);
      } else if (isCtrl && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        copyAllOutput();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [clearConsole, addTab, duplicateTab, closeTab, activeTabId, copyAllOutput]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const isCtrl = e.ctrlKey || e.metaKey;

    // Run on Ctrl+Enter
    if (e.key === 'Enter' && isCtrl) {
      e.preventDefault();
      runCode();
      return;
    }

    // Clear input on Ctrl+K
    if (e.key === 'k' && isCtrl) {
      e.preventDefault();
      clearInput();
      return;
    }

    // History navigation
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
        if (newIndex < 0) {
          return { ...tab, historyIndex: -1, code: '' };
        }
        return { ...tab, historyIndex: newIndex, code: tab.history[newIndex] || '' };
      });
      return;
    }
  }, [runCode, clearInput, updateActiveTab]);

  const loadSnippet = useCallback((snippet: (typeof EXAMPLE_SNIPPETS)[0]) => {
    setCode(snippet.code);
    toast.success(`Loaded: ${snippet.name}`);
  }, [setCode]);

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
              Loading {pyodideProgress}%
            </Badge>
          ) : (
            <Badge variant="outline">Not loaded</Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Script Manager */}
          <ScriptManager 
            currentCode={activeTab?.code || ''}
            onLoad={setCode}
            onSave={() => {}}
          />
          
          {/* Example Snippets */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Examples
              </Button>
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

          {/* Keyboard Shortcuts */}
          <KeyboardShortcutsDialog />
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
          title="New terminal (Ctrl+T)"
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={clearConsole}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear console (Ctrl+L)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyAllOutput}>
                  <Clipboard className="w-4 h-4 mr-2" />
                  Copy all output (Ctrl+Shift+C)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={duplicateTab}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate terminal (Ctrl+D)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={addTab}>
                  <Plus className="w-4 h-4 mr-2" />
                  New terminal (Ctrl+T)
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
                  Console output will appear here. Python is connected to REAL operations and metrics.
                  <div className="mt-2 text-xs">
                    Try running one of the example snippets or press <kbd className="px-1 bg-muted rounded">Ctrl+Enter</kbd> to run your code.
                  </div>
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
          textareaRef={textareaRef}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              <kbd className="px-1 bg-muted rounded">Ctrl+Enter</kbd> run
            </span>
            <span>
              <kbd className="px-1 bg-muted rounded">Ctrl+↑/↓</kbd> history
            </span>
            <span>
              <kbd className="px-1 bg-muted rounded">Ctrl+L</kbd> clear
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={clearInput}
              disabled={!activeTab?.code?.trim()}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Clear
            </Button>
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
    </div>
  );
};
