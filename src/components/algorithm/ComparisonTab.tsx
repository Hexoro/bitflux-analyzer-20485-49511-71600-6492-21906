/**
 * Comparison Tab - Side-by-side comparison of multiple results
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  X,
  BarChart3,
} from 'lucide-react';
import { resultsManager, ExecutionResultV2 } from '@/lib/resultsManager';

export const ComparisonTab = () => {
  const [results, setResults] = useState<ExecutionResultV2[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setResults(resultsManager.getAllResults());
    const unsubscribe = resultsManager.subscribe(() => {
      setResults(resultsManager.getAllResults());
    });
    return unsubscribe;
  }, []);

  const selectedResults = useMemo(() => {
    return selectedIds.map(id => results.find(r => r.id === id)).filter(Boolean) as ExecutionResultV2[];
  }, [selectedIds, results]);

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else if (selectedIds.length < 5) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // Find best values for highlighting
  const getBestValues = useMemo(() => {
    if (selectedResults.length === 0) return {};
    
    const metrics: Record<string, { best: number; bestId: string; higher: boolean }> = {};
    
    // Duration - lower is better
    const durations = selectedResults.map(r => ({ id: r.id, value: r.duration }));
    const minDuration = Math.min(...durations.map(d => d.value));
    metrics['duration'] = { best: minDuration, bestId: durations.find(d => d.value === minDuration)?.id || '', higher: false };
    
    // Cost - lower is better
    const costs = selectedResults.map(r => ({ id: r.id, value: r.benchmarks.totalCost || 0 }));
    const minCost = Math.min(...costs.map(c => c.value));
    metrics['cost'] = { best: minCost, bestId: costs.find(c => c.value === minCost)?.id || '', higher: false };
    
    // Entropy reduction - more negative is better
    const entropyChanges = selectedResults.map(r => ({
      id: r.id,
      value: (r.finalMetrics?.entropy || 0) - (r.initialMetrics?.entropy || 0)
    }));
    const minEntropy = Math.min(...entropyChanges.map(e => e.value));
    metrics['entropyChange'] = { best: minEntropy, bestId: entropyChanges.find(e => e.value === minEntropy)?.id || '', higher: false };
    
    return metrics;
  }, [selectedResults]);

  const getChangeIndicator = (initial: number, final: number) => {
    const change = final - initial;
    if (Math.abs(change) < 0.0001) {
      return <Minus className="w-3 h-3 text-muted-foreground" />;
    }
    if (change < 0) {
      return <TrendingDown className="w-3 h-3 text-green-500" />;
    }
    return <TrendingUp className="w-3 h-3 text-red-500" />;
  };

  const isBest = (resultId: string, metric: string) => {
    return getBestValues[metric]?.bestId === resultId;
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* Selection Panel */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitCompare className="w-4 h-4" />
              Select Results to Compare (max 5)
            </div>
            {selectedIds.length > 0 && (
              <Button size="sm" variant="ghost" onClick={handleClearSelection}>
                <X className="w-4 h-4 mr-1" />
                Clear ({selectedIds.length})
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-32">
            <div className="space-y-1">
              {results.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No results available. Run strategies to compare them.
                </div>
              ) : (
                results.map(result => (
                  <div
                    key={result.id}
                    className={`flex items-center gap-3 p-2 rounded hover:bg-muted/30 cursor-pointer ${
                      selectedIds.includes(result.id) ? 'bg-primary/10 border border-primary/30' : ''
                    }`}
                    onClick={() => handleToggleSelect(result.id)}
                  >
                    <Checkbox
                      checked={selectedIds.includes(result.id)}
                      onCheckedChange={() => handleToggleSelect(result.id)}
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium">{result.strategyName}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {new Date(result.startTime).toLocaleString()}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {result.duration.toFixed(0)}ms
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      {selectedResults.length >= 2 ? (
        <Card className="flex-1 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Comparison Results
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">Metric</TableHead>
                  {selectedResults.map(result => (
                    <TableHead key={result.id} className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-medium">{result.strategyName}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(result.startTime).toLocaleDateString()}
                        </span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Duration */}
                <TableRow>
                  <TableCell className="font-medium">Duration</TableCell>
                  {selectedResults.map(result => (
                    <TableCell key={result.id} className="text-center">
                      <div className={`flex items-center justify-center gap-1 ${isBest(result.id, 'duration') ? 'text-green-500 font-bold' : ''}`}>
                        {isBest(result.id, 'duration') && <Trophy className="w-3 h-3" />}
                        {result.duration.toFixed(0)}ms
                      </div>
                    </TableCell>
                  ))}
                </TableRow>

                {/* Total Cost */}
                <TableRow>
                  <TableCell className="font-medium">Total Cost</TableCell>
                  {selectedResults.map(result => (
                    <TableCell key={result.id} className="text-center">
                      <div className={`flex items-center justify-center gap-1 ${isBest(result.id, 'cost') ? 'text-green-500 font-bold' : ''}`}>
                        {isBest(result.id, 'cost') && <Trophy className="w-3 h-3" />}
                        {result.benchmarks.totalCost || 0}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>

                {/* Operations Count */}
                <TableRow>
                  <TableCell className="font-medium">Operations</TableCell>
                  {selectedResults.map(result => (
                    <TableCell key={result.id} className="text-center">
                      {result.benchmarks.operationCount}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Initial Size */}
                <TableRow>
                  <TableCell className="font-medium">Initial Size</TableCell>
                  {selectedResults.map(result => (
                    <TableCell key={result.id} className="text-center">
                      {result.initialBits.length} bits
                    </TableCell>
                  ))}
                </TableRow>

                {/* Final Size */}
                <TableRow>
                  <TableCell className="font-medium">Final Size</TableCell>
                  {selectedResults.map(result => (
                    <TableCell key={result.id} className="text-center">
                      {result.finalBits.length} bits
                    </TableCell>
                  ))}
                </TableRow>

                {/* Entropy Change */}
                <TableRow>
                  <TableCell className="font-medium">Entropy Change</TableCell>
                  {selectedResults.map(result => {
                    const initial = result.initialMetrics?.entropy || 0;
                    const final = result.finalMetrics?.entropy || 0;
                    const change = final - initial;
                    return (
                      <TableCell key={result.id} className="text-center">
                        <div className={`flex items-center justify-center gap-1 ${isBest(result.id, 'entropyChange') ? 'text-green-500 font-bold' : ''}`}>
                          {getChangeIndicator(initial, final)}
                          {isBest(result.id, 'entropyChange') && <Trophy className="w-3 h-3" />}
                          {change >= 0 ? '+' : ''}{change.toFixed(4)}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>

                {/* Initial Entropy */}
                <TableRow>
                  <TableCell className="font-medium">Initial Entropy</TableCell>
                  {selectedResults.map(result => (
                    <TableCell key={result.id} className="text-center">
                      {(result.initialMetrics?.entropy || 0).toFixed(4)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Final Entropy */}
                <TableRow>
                  <TableCell className="font-medium">Final Entropy</TableCell>
                  {selectedResults.map(result => (
                    <TableCell key={result.id} className="text-center">
                      {(result.finalMetrics?.entropy || 0).toFixed(4)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Status */}
                <TableRow>
                  <TableCell className="font-medium">Status</TableCell>
                  {selectedResults.map(result => (
                    <TableCell key={result.id} className="text-center">
                      <Badge variant={result.status === 'completed' ? 'default' : 'destructive'}>
                        {result.status}
                      </Badge>
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <GitCompare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Select at least 2 results to compare</p>
            <p className="text-sm mt-1">Click on results above to select them</p>
          </div>
        </Card>
      )}
    </div>
  );
};
