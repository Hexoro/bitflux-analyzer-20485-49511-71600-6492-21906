/**
 * Results Tab - Displays execution results with full CSV export and sorting
 * Results come from strategy execution, sorted and stored by metrics
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  Bookmark,
  BookmarkCheck,
  Trash2,
  FileText,
  Clock,
  Activity,
  CheckCircle2,
  XCircle,
  Tag,
  Plus,
  Search,
  Calendar,
  ArrowUpDown,
  TrendingDown,
  TrendingUp,
  Zap,
  DollarSign,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { resultsManager, ExecutionResultV2 } from '@/lib/resultsManager';
import { fileSystemManager } from '@/lib/fileSystemManager';
import { ExecutionResult } from '@/components/algorithm/PlayerTab';

interface ResultsTabProps {
  onSelectResult?: (result: ExecutionResult | null) => void;
}

type SortField = 'date' | 'duration' | 'operations' | 'score' | 'entropy_change' | 'cost';
type SortDirection = 'asc' | 'desc';

export const ResultsTab = ({ onSelectResult }: ResultsTabProps) => {
  const [results, setResults] = useState<ExecutionResultV2[]>([]);
  const [selectedResult, setSelectedResult] = useState<ExecutionResultV2 | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBookmarked, setFilterBookmarked] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    setResults(resultsManager.getAllResults());
    const unsubscribe = resultsManager.subscribe(() => {
      setResults(resultsManager.getAllResults());
    });
    return unsubscribe;
  }, []);

  // Sort and filter results
  const sortedResults = useMemo(() => {
    let filtered = results.filter(r => {
      const matchesSearch = r.strategyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesBookmark = !filterBookmarked || r.bookmarked;
      return matchesSearch && matchesBookmark;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal: number;
      let bVal: number;

      switch (sortField) {
        case 'date':
          aVal = a.startTime;
          bVal = b.startTime;
          break;
        case 'duration':
          aVal = a.duration;
          bVal = b.duration;
          break;
        case 'operations':
          aVal = a.benchmarks.operationCount;
          bVal = b.benchmarks.operationCount;
          break;
        case 'score':
          // Use total cost as proxy for score if available
          aVal = a.benchmarks.totalCost || 0;
          bVal = b.benchmarks.totalCost || 0;
          break;
        case 'entropy_change':
          aVal = (a.finalMetrics?.entropy || 0) - (a.initialMetrics?.entropy || 0);
          bVal = (b.finalMetrics?.entropy || 0) - (b.initialMetrics?.entropy || 0);
          break;
        case 'cost':
          aVal = a.benchmarks.totalCost || 0;
          bVal = b.benchmarks.totalCost || 0;
          break;
        default:
          aVal = a.startTime;
          bVal = b.startTime;
      }

      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  }, [results, searchQuery, filterBookmarked, sortField, sortDirection]);

  const handleSelect = (result: ExecutionResultV2) => {
    setSelectedResult(result);
    
    // Create temp file in sidebar for viewing
    const fileName = `result_${result.strategyName.replace(/\s+/g, '_')}_${Date.now()}.tmp`;
    const tempFile = fileSystemManager.createFile(fileName, result.finalBits, 'binary');
    tempFile.group = 'Results';
    fileSystemManager.setActiveFile(tempFile.id);
    
    // Convert to ExecutionResult format for player with bit ranges
    const executionResult: ExecutionResult = {
      id: result.id,
      strategyId: result.strategyId,
      strategyName: result.strategyName,
      dataFileId: tempFile.id,
      dataFileName: fileName,
      initialBits: result.initialBits,
      finalBits: result.finalBits,
      steps: result.steps.map((s, i) => ({ 
        ...s, 
        params: s.params || {}, 
        stepIndex: i, 
        timestamp: new Date(),
        bitRanges: (s as any).bitRanges || []
      })),
      totalDuration: result.duration,
      startTime: new Date(result.startTime),
      endTime: new Date(result.endTime),
      metricsHistory: {},
      success: result.status === 'completed',
      resourceUsage: { peakMemory: 0, cpuTime: result.duration, operationsCount: result.steps.length }
    };
    onSelectResult?.(executionResult);
    toast.success('Result loaded - temp file created in sidebar');
  };

  const handleExportCSV = (result: ExecutionResultV2) => {
    // Generate comprehensive CSV
    const lines: string[] = [];
    
    // Header
    lines.push('# Strategy Execution Report');
    lines.push(`# Strategy: ${result.strategyName}`);
    lines.push(`# Executed: ${new Date(result.startTime).toISOString()}`);
    lines.push(`# Duration: ${result.duration}ms`);
    lines.push('');
    
    // Summary
    lines.push('## Summary');
    lines.push('Metric,Value');
    lines.push(`Status,${result.status}`);
    lines.push(`Total Steps,${result.steps.length}`);
    lines.push(`Total Operations,${result.benchmarks.operationCount}`);
    lines.push(`Initial Size,${result.initialBits.length} bits`);
    lines.push(`Final Size,${result.finalBits.length} bits`);
    lines.push(`Total Cost,${result.benchmarks.totalCost}`);
    lines.push(`Avg Step Duration,${result.benchmarks.avgStepDuration.toFixed(2)}ms`);
    lines.push('');
    
    // Metrics Comparison
    lines.push('## Metrics Comparison');
    lines.push('Metric,Initial,Final,Change');
    if (result.initialMetrics && result.finalMetrics) {
      Object.keys(result.initialMetrics).forEach(key => {
        const initial = result.initialMetrics[key] || 0;
        const final = result.finalMetrics[key] || initial;
        const change = final - initial;
        lines.push(`${key},${initial.toFixed(6)},${final.toFixed(6)},${change >= 0 ? '+' : ''}${change.toFixed(6)}`);
      });
    }
    lines.push('');
    
    // Transformations
    lines.push('## All Transformations');
    lines.push('Step,Operation,Parameters,Before Size,After Size,Duration (ms)');
    result.steps.forEach(step => {
      lines.push([
        step.index,
        step.operation,
        `"${JSON.stringify(step.params || {})}"`,
        step.beforeBits.length,
        step.afterBits.length,
        step.duration.toFixed(2),
      ].join(','));
    });
    lines.push('');
    
    // Files Used
    lines.push('## Files Used');
    lines.push('Type,Files');
    lines.push(`Algorithm,${result.filesUsed.algorithm}`);
    lines.push(`Scoring,${result.filesUsed.scoring}`);
    lines.push(`Policy,${result.filesUsed.policy}`);
    lines.push('');
    
    // Notes
    if (result.notes) {
      lines.push('## Notes');
      lines.push(`"${result.notes.replace(/"/g, '""')}"`);
    }
    
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `result_${result.strategyName}_${new Date(result.startTime).toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Full CSV exported');
  };

  const handleExportJSON = (result: ExecutionResultV2) => {
    const json = resultsManager.exportFullReport(result);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `result_${result.strategyName}_${result.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('JSON exported');
  };

  const handleToggleBookmark = (id: string) => {
    resultsManager.toggleBookmark(id);
  };

  const handleDelete = (id: string) => {
    resultsManager.deleteResult(id);
    if (selectedResult?.id === id) {
      setSelectedResult(null);
      onSelectResult?.(null);
    }
    toast.success('Result deleted');
  };

  const handleAddTag = (id: string) => {
    if (newTag.trim()) {
      resultsManager.addTag(id, newTag.trim());
      setNewTag('');
    }
  };

  const handleRemoveTag = (id: string, tag: string) => {
    resultsManager.removeTag(id, tag);
  };

  const stats = resultsManager.getStatistics();

  const getEntropyChange = (result: ExecutionResultV2) => {
    if (!result.initialMetrics?.entropy || !result.finalMetrics?.entropy) return null;
    return result.finalMetrics.entropy - result.initialMetrics.entropy;
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* Stats Bar */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center gap-6 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span>{stats.totalResults} results</span>
            </div>
            <div className="flex items-center gap-2">
              <BookmarkCheck className="w-4 h-4 text-muted-foreground" />
              <span>{stats.bookmarkedCount} bookmarked</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>Avg: {stats.avgDuration.toFixed(0)}ms</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
              <span>{stats.successRate.toFixed(0)}% success</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search, Filter, Sort */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or tag..."
            className="pl-9"
          />
        </div>
        <Button
          variant={filterBookmarked ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterBookmarked(!filterBookmarked)}
        >
          <Bookmark className="w-4 h-4 mr-1" />
          Bookmarked
        </Button>
        <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
          <SelectTrigger className="w-[140px]">
            <ArrowUpDown className="w-4 h-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="duration">Duration</SelectItem>
            <SelectItem value="operations">Operations</SelectItem>
            <SelectItem value="entropy_change">Entropy Change</SelectItem>
            <SelectItem value="cost">Cost</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
        >
          {sortDirection === 'asc' ? '↑' : '↓'}
        </Button>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Results List */}
        <ScrollArea className="flex-1">
          <div className="space-y-2 pr-2">
            {sortedResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No results found</p>
                <p className="text-sm mt-1">Run a strategy to see results here</p>
              </div>
            ) : (
              sortedResults.map((result) => {
                const entropyChange = getEntropyChange(result);
                return (
                  <Card
                    key={result.id}
                    className={`cursor-pointer transition-colors ${
                      selectedResult?.id === result.id ? 'border-primary' : 'hover:bg-muted/30'
                    }`}
                    onClick={() => handleSelect(result)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium">{result.strategyName}</h4>
                            <Badge variant={result.status === 'completed' ? 'default' : 'destructive'}>
                              {result.status}
                            </Badge>
                            {result.bookmarked && (
                              <BookmarkCheck className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(result.startTime).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {result.duration.toFixed(0)}ms
                            </span>
                            <span className="flex items-center gap-1">
                              <Activity className="w-3 h-3" />
                              {result.benchmarks.operationCount} ops
                            </span>
                            {entropyChange !== null && (
                              <span className={`flex items-center gap-1 ${entropyChange < 0 ? 'text-green-500' : entropyChange > 0 ? 'text-red-500' : ''}`}>
                                {entropyChange < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                                {entropyChange >= 0 ? '+' : ''}{entropyChange.toFixed(4)}
                              </span>
                            )}
                            {result.benchmarks.totalCost > 0 && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                {result.benchmarks.totalCost}
                              </span>
                            )}
                          </div>
                          {result.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {result.tags.map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleToggleBookmark(result.id)}
                          >
                            {result.bookmarked ? (
                              <BookmarkCheck className="w-4 h-4 text-primary" />
                            ) : (
                              <Bookmark className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleExportCSV(result)}
                            title="Export CSV"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(result.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Selected Result Detail */}
        {selectedResult && (
          <Card className="w-1/2 flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Result Details</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleExportCSV(selectedResult)}>
                    <Download className="w-4 h-4 mr-1" />
                    Full CSV
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleExportJSON(selectedResult)}>
                    <FileText className="w-4 h-4 mr-1" />
                    JSON
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              <ScrollArea className="h-full">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div className="p-2 bg-muted/30 rounded">
                    <span className="text-muted-foreground text-xs">Initial Size</span>
                    <p className="font-mono">{selectedResult.initialBits.length} bits</p>
                  </div>
                  <div className="p-2 bg-muted/30 rounded">
                    <span className="text-muted-foreground text-xs">Final Size</span>
                    <p className="font-mono">{selectedResult.finalBits.length} bits</p>
                  </div>
                  <div className="p-2 bg-muted/30 rounded">
                    <span className="text-muted-foreground text-xs">Operations</span>
                    <p className="font-mono">{selectedResult.benchmarks.operationCount}</p>
                  </div>
                  <div className="p-2 bg-muted/30 rounded">
                    <span className="text-muted-foreground text-xs">Avg Step</span>
                    <p className="font-mono">{selectedResult.benchmarks.avgStepDuration.toFixed(2)}ms</p>
                  </div>
                  <div className="p-2 bg-muted/30 rounded">
                    <span className="text-muted-foreground text-xs">Total Cost</span>
                    <p className="font-mono">{selectedResult.benchmarks.totalCost}</p>
                  </div>
                  <div className="p-2 bg-muted/30 rounded">
                    <span className="text-muted-foreground text-xs">Duration</span>
                    <p className="font-mono">{selectedResult.duration}ms</p>
                  </div>
                </div>

                {/* Metrics Comparison */}
                {selectedResult.initialMetrics && Object.keys(selectedResult.initialMetrics).length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Metrics Change
                    </h4>
                    <div className="space-y-1 text-xs">
                      {Object.keys(selectedResult.initialMetrics).slice(0, 6).map(key => {
                        const initial = selectedResult.initialMetrics[key] || 0;
                        const final = selectedResult.finalMetrics?.[key] || initial;
                        const change = final - initial;
                        return (
                          <div key={key} className="flex justify-between items-center">
                            <span className="text-muted-foreground">{key}</span>
                            <span className={change < 0 ? 'text-green-500' : change > 0 ? 'text-red-500' : ''}>
                              {initial.toFixed(4)} → {final.toFixed(4)} ({change >= 0 ? '+' : ''}{change.toFixed(4)})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Files Used */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Files Used</h4>
                  <div className="text-xs space-y-1">
                    <div><span className="text-muted-foreground">Algorithm:</span> {selectedResult.filesUsed.algorithm}</div>
                    <div><span className="text-muted-foreground">Scoring:</span> {selectedResult.filesUsed.scoring}</div>
                    <div><span className="text-muted-foreground">Policy:</span> {selectedResult.filesUsed.policy || 'None'}</div>
                  </div>
                </div>

                {/* Transformations Summary */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Transformations ({selectedResult.steps.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto text-xs space-y-1">
                    {selectedResult.steps.slice(0, 20).map((step, i) => (
                      <div key={i} className="flex justify-between items-center py-1 border-b border-muted/30">
                        <span className="font-mono">{step.operation}</span>
                        <span className="text-muted-foreground">{step.duration.toFixed(1)}ms</span>
                      </div>
                    ))}
                    {selectedResult.steps.length > 20 && (
                      <p className="text-muted-foreground text-center py-2">
                        ... and {selectedResult.steps.length - 20} more. Export CSV for full list.
                      </p>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div className="mb-4 pt-4 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4" />
                    <span className="text-sm font-medium">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedResult.tags.map(tag => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                        <button
                          className="ml-1 hover:text-destructive"
                          onClick={() => handleRemoveTag(selectedResult.id, tag)}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                    <div className="flex items-center gap-1">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add tag"
                        className="h-7 w-24"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddTag(selectedResult.id);
                          }
                        }}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleAddTag(selectedResult.id)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="pt-4 border-t">
                  <span className="text-sm font-medium">Notes</span>
                  <Textarea
                    value={selectedResult.notes}
                    onChange={(e) => resultsManager.updateNotes(selectedResult.id, e.target.value)}
                    placeholder="Add notes about this result..."
                    className="mt-2 h-20"
                  />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
