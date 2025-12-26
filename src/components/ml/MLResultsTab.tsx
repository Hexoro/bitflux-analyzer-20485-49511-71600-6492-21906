import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Download, 
  Trash2, 
  BarChart3,
  TrendingDown,
  Clock,
  FileText,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface MLResult {
  id: string;
  type: 'entropy_optimization' | 'training' | 'inference';
  timestamp: Date;
  fileName: string;
  summary: {
    bestOperation?: string;
    bestReduction?: number;
    finalAccuracy?: number;
    finalLoss?: number;
    epochs?: number;
  };
  data: any;
}

const STORAGE_KEY = 'ml_results';

export const MLResultsTab = () => {
  const [results, setResults] = useState<MLResult[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setResults(parsed.map((r: any) => ({
          ...r,
          timestamp: new Date(r.timestamp),
        })));
      }
    } catch (error) {
      console.error('Failed to load ML results:', error);
    }
  };

  const saveResults = (newResults: MLResult[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newResults));
      setResults(newResults);
    } catch (error) {
      console.error('Failed to save ML results:', error);
    }
  };

  const deleteResult = (id: string) => {
    const filtered = results.filter(r => r.id !== id);
    saveResults(filtered);
    toast.success('Result deleted');
  };

  const clearAll = () => {
    saveResults([]);
    toast.success('All results cleared');
  };

  const exportResult = (result: MLResult) => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ml_result_${result.type}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Result exported');
  };

  const exportAll = () => {
    if (results.length === 0) {
      toast.error('No results to export');
      return;
    }
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ml_results_all_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('All results exported');
  };

  const getTypeIcon = (type: MLResult['type']) => {
    switch (type) {
      case 'entropy_optimization': return <TrendingDown className="w-4 h-4 text-green-500" />;
      case 'training': return <BarChart3 className="w-4 h-4 text-blue-500" />;
      case 'inference': return <FileText className="w-4 h-4 text-purple-500" />;
    }
  };

  const getTypeBadge = (type: MLResult['type']) => {
    switch (type) {
      case 'entropy_optimization': 
        return <Badge className="bg-green-500/20 text-green-500">Entropy Optimization</Badge>;
      case 'training': 
        return <Badge className="bg-blue-500/20 text-blue-500">Training</Badge>;
      case 'inference': 
        return <Badge className="bg-purple-500/20 text-purple-500">Inference</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString();
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-transparent border-primary/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">ML Results Database</h2>
              <p className="text-sm text-muted-foreground">
                {results.length} result{results.length !== 1 ? 's' : ''} stored
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportAll} disabled={results.length === 0}>
                <Download className="w-4 h-4 mr-1" />
                Export All
              </Button>
              <Button variant="outline" size="sm" onClick={clearAll} disabled={results.length === 0}>
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results List */}
      <ScrollArea className="flex-1">
        {results.length === 0 ? (
          <Card className="bg-muted/20">
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">No Results Yet</h3>
                <p className="text-sm">
                  Run entropy optimization or train models to see results here.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {results.map(result => (
              <Card key={result.id} className="overflow-hidden">
                <div 
                  className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(expandedId === result.id ? null : result.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {expandedId === result.id ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                      {getTypeIcon(result.type)}
                      <div>
                        <div className="flex items-center gap-2">
                          {getTypeBadge(result.type)}
                          <span className="text-sm font-medium">{result.fileName}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDate(result.timestamp)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Summary Stats */}
                      {result.summary.bestReduction !== undefined && (
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Best Reduction</div>
                          <div className={`text-sm font-mono ${result.summary.bestReduction < 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {result.summary.bestReduction.toFixed(4)}
                          </div>
                        </div>
                      )}
                      {result.summary.finalAccuracy !== undefined && (
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Accuracy</div>
                          <div className="text-sm font-mono text-green-500">
                            {result.summary.finalAccuracy.toFixed(1)}%
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => exportResult(result)}>
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteResult(result.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === result.id && (
                  <div className="border-t border-border p-4 bg-muted/20">
                    <h4 className="text-sm font-medium mb-2">Full Details</h4>
                    <pre className="text-xs font-mono bg-background p-3 rounded overflow-auto max-h-60">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Stats Summary */}
      {results.length > 0 && (
        <Card className="bg-muted/20">
          <CardContent className="py-3">
            <div className="flex items-center justify-around text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {results.filter(r => r.type === 'entropy_optimization').length}
                </div>
                <div className="text-xs text-muted-foreground">Optimization Runs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {results.filter(r => r.type === 'training').length}
                </div>
                <div className="text-xs text-muted-foreground">Training Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-500">
                  {results.filter(r => r.type === 'inference').length}
                </div>
                <div className="text-xs text-muted-foreground">Inferences</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
