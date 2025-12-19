/**
 * Results Tab - Displays execution results with bookmarking and CSV export
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Download,
  Bookmark,
  BookmarkCheck,
  Trash2,
  FileText,
  Clock,
  Cpu,
  Activity,
  CheckCircle2,
  XCircle,
  Tag,
  Plus,
  Search,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { resultsManager, ExecutionResultV2 } from '@/lib/resultsManager';
import { ExecutionResult } from '@/lib/strategyExecutor';

interface ResultsTabProps {
  onSelectResult?: (result: ExecutionResult | null) => void;
}

export const ResultsTab = ({ onSelectResult }: ResultsTabProps) => {
  const [results, setResults] = useState<ExecutionResultV2[]>([]);
  const [selectedResult, setSelectedResult] = useState<ExecutionResultV2 | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBookmarked, setFilterBookmarked] = useState(false);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    setResults(resultsManager.getAllResults());
    const unsubscribe = resultsManager.subscribe(() => {
      setResults(resultsManager.getAllResults());
    });
    return unsubscribe;
  }, []);

  const filteredResults = results.filter(r => {
    const matchesSearch = r.strategyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesBookmark = !filterBookmarked || r.bookmarked;
    return matchesSearch && matchesBookmark;
  });

  const handleSelect = (result: ExecutionResultV2) => {
    setSelectedResult(result);
    // Convert to ExecutionResult format for player
    const executionResult: ExecutionResult = {
      id: result.id,
      strategyId: result.strategyId,
      strategyName: result.strategyName,
      dataFileId: result.id,
      dataFileName: result.strategyName,
      initialBits: result.initialBits,
      finalBits: result.finalBits,
      steps: result.steps.map((s, i) => ({ ...s, stepIndex: i, timestamp: new Date() })),
      totalDuration: result.duration,
      startTime: new Date(),
      endTime: new Date(),
      metricsHistory: {},
      success: true,
      resourceUsage: { peakMemory: 0, cpuTime: result.duration, operationsCount: result.steps.length }
    };
    onSelectResult?.(executionResult);
  };

  const handleExportCSV = (result: ExecutionResultV2) => {
    const csv = resultsManager.exportToCSV(result);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `result_${result.strategyName}_${new Date(result.startTime).toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
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

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* Stats Bar */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center gap-6 text-sm">
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

      {/* Search and Filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
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
      </div>

      {/* Results List */}
      <ScrollArea className="flex-1">
        <div className="space-y-2">
          {filteredResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No results found</p>
            </div>
          ) : (
            filteredResults.map((result) => (
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
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{result.strategyName}</h4>
                        <Badge variant={result.status === 'completed' ? 'default' : 'destructive'}>
                          {result.status}
                        </Badge>
                        {result.bookmarked && (
                          <BookmarkCheck className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
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
            ))
          )}
        </div>
      </ScrollArea>

      {/* Selected Result Detail */}
      {selectedResult && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Result Details</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleExportCSV(selectedResult)}>
                  <Download className="w-4 h-4 mr-1" />
                  CSV
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExportJSON(selectedResult)}>
                  <FileText className="w-4 h-4 mr-1" />
                  JSON
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Initial Size:</span>
                <span className="ml-2 font-mono">{selectedResult.initialBits.length} bits</span>
              </div>
              <div>
                <span className="text-muted-foreground">Final Size:</span>
                <span className="ml-2 font-mono">{selectedResult.finalBits.length} bits</span>
              </div>
              <div>
                <span className="text-muted-foreground">Operations:</span>
                <span className="ml-2 font-mono">{selectedResult.benchmarks.operationCount}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Avg Step:</span>
                <span className="ml-2 font-mono">{selectedResult.benchmarks.avgStepDuration.toFixed(2)}ms</span>
              </div>
            </div>

            {/* Tags */}
            <div className="mt-4 pt-4 border-t">
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
            <div className="mt-4 pt-4 border-t">
              <span className="text-sm font-medium">Notes</span>
              <Textarea
                value={selectedResult.notes}
                onChange={(e) => resultsManager.updateNotes(selectedResult.id, e.target.value)}
                placeholder="Add notes about this result..."
                className="mt-2 h-20"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
