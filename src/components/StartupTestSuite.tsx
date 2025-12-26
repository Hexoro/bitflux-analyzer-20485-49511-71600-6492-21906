/**
 * Startup Test Suite Display Component
 * Runs tests on boot and displays results
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  FlaskConical,
  ChevronDown,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { testSuite, TestSuiteResults, TestResult } from '@/lib/testSuite';

interface StartupTestSuiteProps {
  onComplete?: (results: TestSuiteResults) => void;
}

export const StartupTestSuite = ({ onComplete }: StartupTestSuiteProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestSuiteResults | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showDialog, setShowDialog] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    try {
      const testResults = await testSuite.runAll();
      setResults(testResults);
      onComplete?.(testResults);
      
      // Auto-expand failed categories
      const failedCategories = new Set(
        testResults.results.filter(r => !r.passed).map(r => r.category)
      );
      setExpandedCategories(failedCategories);
    } catch (error) {
      console.error('Test suite error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    // Run tests on mount
    runTests();
  }, []);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const getResultsByCategory = () => {
    if (!results) return {};
    const grouped: { [category: string]: TestResult[] } = {};
    for (const result of results.results) {
      if (!grouped[result.category]) {
        grouped[result.category] = [];
      }
      grouped[result.category].push(result);
    }
    return grouped;
  };

  const resultsByCategory = getResultsByCategory();

  if (!results && !isRunning) {
    return null;
  }

  // Mini status badge for toolbar
  if (results && !showDialog) {
    const allPassed = results.failed === 0;
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDialog(true)}
        className={`h-6 px-2 text-xs ${allPassed ? 'text-green-500' : 'text-destructive'}`}
      >
        <FlaskConical className="w-3 h-3 mr-1" />
        {allPassed ? (
          <CheckCircle className="w-3 h-3 mr-1" />
        ) : (
          <XCircle className="w-3 h-3 mr-1" />
        )}
        {results.passed}/{results.totalTests}
      </Button>
    );
  }

  return (
    <Dialog open={showDialog || isRunning} onOpenChange={setShowDialog}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5" />
            System Test Suite
          </DialogTitle>
        </DialogHeader>

        {isRunning ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Running Tests...</p>
            <p className="text-sm text-muted-foreground">Verifying system integrity</p>
          </div>
        ) : results ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Summary */}
            <Card className="mb-4">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    {results.failed === 0 ? (
                      <Badge className="bg-green-500/20 text-green-500 text-lg px-3 py-1">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        All Tests Passed
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-lg px-3 py-1">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {results.failed} Test{results.failed !== 1 ? 's' : ''} Failed
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {results.duration.toFixed(0)}ms
                    </span>
                  </div>
                  <Button size="sm" variant="outline" onClick={runTests}>
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Re-run
                  </Button>
                </div>
                <Progress 
                  value={(results.passed / results.totalTests) * 100} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{results.passed} passed</span>
                  <span>{results.failed} failed</span>
                  <span>{results.totalTests} total</span>
                </div>
              </CardContent>
            </Card>

            {/* Results by Category */}
            <ScrollArea className="flex-1">
              <div className="space-y-2 pr-4">
                {Object.entries(resultsByCategory).map(([category, tests]) => {
                  const passed = tests.filter(t => t.passed).length;
                  const failed = tests.length - passed;
                  const isExpanded = expandedCategories.has(category);

                  return (
                    <Card key={category}>
                      <div
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30"
                        onClick={() => toggleCategory(category)}
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                          <span className="font-medium">{category}</span>
                          <Badge variant="secondary" className="text-xs">
                            {tests.length} tests
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {passed > 0 && (
                            <Badge className="bg-green-500/20 text-green-500 text-xs">
                              {passed} passed
                            </Badge>
                          )}
                          {failed > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {failed} failed
                            </Badge>
                          )}
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="border-t px-3 pb-3">
                          <div className="space-y-1 mt-2">
                            {tests.map((test, idx) => (
                              <div
                                key={idx}
                                className={`flex items-center justify-between p-2 rounded text-sm ${
                                  test.passed ? 'bg-green-500/5' : 'bg-destructive/10'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {test.passed ? (
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <XCircle className="w-3 h-3 text-destructive" />
                                  )}
                                  <span className="font-mono text-xs">{test.name}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {test.duration.toFixed(1)}ms
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
