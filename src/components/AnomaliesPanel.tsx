import { useMemo, useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { AlertCircle, Filter, Grid, List, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { anomaliesManager, AnomalyDefinition } from '@/lib/anomaliesManager';

interface Anomaly {
  id: string;
  type: string;
  position: number;
  length: number;
  sequence: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

interface AnomaliesPanelProps {
  bits: string;
  onJumpTo: (index: number) => void;
}

// Helper function to find palindromes
const findPalindromes = (bits: string, minLength: number = 5): Anomaly[] => {
  const palindromes: Anomaly[] = [];
  const seen = new Set<string>();
  
  for (let i = 0; i < bits.length; i++) {
    // Check for odd-length palindromes
    let len = 1;
    while (i - len >= 0 && i + len < bits.length && bits[i - len] === bits[i + len]) {
      len++;
    }
    if (len * 2 - 1 >= minLength) {
      const start = i - len + 1;
      const palindrome = bits.substring(start, i + len);
      const key = `${start}-${palindrome.length}`;
      if (!seen.has(key)) {
        seen.add(key);
        palindromes.push({
          id: `palindrome-${start}`,
          type: 'Palindrome',
          position: start,
          length: palindrome.length,
          sequence: palindrome,
          description: `Odd-length palindrome of ${palindrome.length} bits`,
          severity: palindrome.length > 20 ? 'high' : palindrome.length > 10 ? 'medium' : 'low',
        });
      }
    }
    
    // Check for even-length palindromes
    len = 0;
    while (i - len >= 0 && i + 1 + len < bits.length && bits[i - len] === bits[i + 1 + len]) {
      len++;
    }
    if (len * 2 >= minLength) {
      const start = i - len + 1;
      const palindrome = bits.substring(start, i + len + 1);
      const key = `${start}-${palindrome.length}`;
      if (!seen.has(key)) {
        seen.add(key);
        palindromes.push({
          id: `palindrome-${start}-even`,
          type: 'Palindrome',
          position: start,
          length: palindrome.length,
          sequence: palindrome,
          description: `Even-length palindrome of ${palindrome.length} bits`,
          severity: palindrome.length > 20 ? 'high' : palindrome.length > 10 ? 'medium' : 'low',
        });
      }
    }
  }
  
  return palindromes;
};

// Helper function to find repeating patterns
const findRepeatingPatterns = (bits: string, minLength: number = 4, minRepeats: number = 3): Anomaly[] => {
  const patterns: Anomaly[] = [];
  const seen = new Set<string>();
  
  for (let patternLen = minLength; patternLen <= 20; patternLen++) {
    for (let i = 0; i <= bits.length - patternLen * minRepeats; i++) {
      const pattern = bits.substring(i, i + patternLen);
      
      let repeats = 1;
      let pos = i + patternLen;
      while (pos + patternLen <= bits.length && bits.substring(pos, pos + patternLen) === pattern) {
        repeats++;
        pos += patternLen;
      }
      
      if (repeats >= minRepeats) {
        const key = `${i}-${pattern}`;
        if (!seen.has(key)) {
          seen.add(key);
          patterns.push({
            id: `pattern-${i}`,
            type: 'Repeating Pattern',
            position: i,
            length: patternLen * repeats,
            sequence: pattern.substring(0, Math.min(20, pattern.length)) + (pattern.length > 20 ? '...' : ''),
            description: `Pattern "${pattern}" repeated ${repeats} times`,
            severity: repeats > 5 ? 'high' : repeats > 3 ? 'medium' : 'low',
          });
        }
      }
    }
  }
  
  return patterns;
};

// Helper function to find alternating sequences
const findAlternatingSequences = (bits: string, minLength: number = 8): Anomaly[] => {
  const alternating: Anomaly[] = [];
  
  let start = 0;
  let length = 1;
  
  for (let i = 1; i < bits.length; i++) {
    if (bits[i] !== bits[i - 1]) {
      length++;
    } else {
      if (length >= minLength) {
        alternating.push({
          id: `alternating-${start}`,
          type: 'Alternating Sequence',
          position: start,
          length: length,
          sequence: bits.substring(start, start + Math.min(20, length)) + (length > 20 ? '...' : ''),
          description: `Alternating pattern of ${length} bits`,
          severity: length > 30 ? 'high' : length > 15 ? 'medium' : 'low',
        });
      }
      start = i;
      length = 1;
    }
  }
  
  if (length >= minLength) {
    alternating.push({
      id: `alternating-${start}`,
      type: 'Alternating Sequence',
      position: start,
      length: length,
      sequence: bits.substring(start, start + Math.min(20, length)) + (length > 20 ? '...' : ''),
      description: `Alternating pattern of ${length} bits`,
      severity: length > 30 ? 'high' : length > 15 ? 'medium' : 'low',
    });
  }
  
  return alternating;
};

// Helper function to find long runs
const findLongRuns = (bits: string, minLength: number = 10): Anomaly[] => {
  const runs: Anomaly[] = [];
  
  let currentChar = bits[0];
  let start = 0;
  let length = 1;
  
  for (let i = 1; i < bits.length; i++) {
    if (bits[i] === currentChar) {
      length++;
    } else {
      if (length >= minLength) {
        runs.push({
          id: `run-${start}`,
          type: 'Long Run',
          position: start,
          length: length,
          sequence: currentChar.repeat(Math.min(20, length)) + (length > 20 ? '...' : ''),
          description: `Run of ${length} consecutive ${currentChar}s`,
          severity: length > 50 ? 'high' : length > 25 ? 'medium' : 'low',
        });
      }
      currentChar = bits[i];
      start = i;
      length = 1;
    }
  }
  
  if (length >= minLength) {
    runs.push({
      id: `run-${start}`,
      type: 'Long Run',
      position: start,
      length: length,
      sequence: currentChar.repeat(Math.min(20, length)) + (length > 20 ? '...' : ''),
      description: `Run of ${length} consecutive ${currentChar}s`,
      severity: length > 50 ? 'high' : length > 25 ? 'medium' : 'low',
    });
  }
  
  return runs;
};

// Helper function to find sparse regions (low entropy)
const findSparseRegions = (bits: string, windowSize: number = 64): Anomaly[] => {
  const regions: Anomaly[] = [];
  
  for (let i = 0; i <= bits.length - windowSize; i += windowSize / 2) {
    const window = bits.substring(i, i + windowSize);
    const ones = window.split('1').length - 1;
    const onesPercent = (ones / windowSize) * 100;
    
    // Check for very sparse (< 15% ones) or very dense (> 85% ones)
    if (onesPercent < 15 || onesPercent > 85) {
      regions.push({
        id: `sparse-${i}`,
        type: 'Sparse Region',
        position: i,
        length: windowSize,
        sequence: window.substring(0, 20) + '...',
        description: `Region with ${onesPercent.toFixed(1)}% ones (${ones}/${windowSize})`,
        severity: onesPercent < 5 || onesPercent > 95 ? 'high' : 'medium',
      });
      i += windowSize / 2; // Skip ahead to avoid overlaps
    }
  }
  
  return regions;
};

// Helper function to find byte boundaries
const findByteBoundaries = (bits: string): Anomaly[] => {
  const boundaries: Anomaly[] = [];
  
  // Check for misalignment
  if (bits.length % 8 !== 0) {
    boundaries.push({
      id: 'byte-misalignment',
      type: 'Byte Alignment',
      position: bits.length - (bits.length % 8),
      length: bits.length % 8,
      sequence: bits.substring(bits.length - (bits.length % 8)),
      description: `Data not byte-aligned (${bits.length % 8} extra bits)`,
      severity: 'medium',
    });
  }
  
  return boundaries;
};

export const AnomaliesPanel = ({ bits, onJumpTo }: AnomaliesPanelProps) => {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [minLength, setMinLength] = useState<string>('');
  const [maxLength, setMaxLength] = useState<string>('');
  const [minPosition, setMinPosition] = useState<string>('');
  const [maxPosition, setMaxPosition] = useState<string>('');
  const [useBackendDefinitions, setUseBackendDefinitions] = useState(true);
  const [, forceUpdate] = useState({});

  // Subscribe to anomaliesManager changes
  useEffect(() => {
    const unsubscribe = anomaliesManager.subscribe(() => forceUpdate({}));
    return unsubscribe;
  }, []);

  // Use backend definitions when enabled
  const anomalies = useMemo(() => {
    if (bits.length === 0) return [];
    
    if (useBackendDefinitions) {
      // Use anomaliesManager definitions
      const enabledDefs = anomaliesManager.getEnabledDefinitions();
      const results: Anomaly[] = [];
      
      for (const def of enabledDefs) {
        try {
          const detections = anomaliesManager.executeDetection(def.id, bits);
          for (const detection of detections) {
            results.push({
              id: `${def.id}-${detection.position}`,
              type: def.name,
              position: detection.position,
              length: detection.length,
              sequence: bits.substring(detection.position, Math.min(detection.position + 20, detection.position + detection.length)) + (detection.length > 20 ? '...' : ''),
              description: def.description,
              severity: def.severity,
            });
          }
        } catch (e) {
          console.error(`Failed to execute anomaly detection ${def.name}:`, e);
        }
      }
      
      return results.sort((a, b) => a.position - b.position);
    }
    
    // Fallback to built-in detection
    const palindromes = findPalindromes(bits, 5);
    const patterns = findRepeatingPatterns(bits, 4, 3);
    const alternating = findAlternatingSequences(bits, 8);
    const runs = findLongRuns(bits, 10);
    const sparse = findSparseRegions(bits, 64);
    const byteAlign = findByteBoundaries(bits);
    
    return [...palindromes, ...patterns, ...alternating, ...runs, ...sparse, ...byteAlign]
      .sort((a, b) => a.position - b.position);
  }, [bits, useBackendDefinitions]);
  
  const filteredAnomalies = useMemo(() => {
    return anomalies.filter(a => {
      if (typeFilter !== 'all' && a.type !== typeFilter) return false;
      if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
      
      // Length filters
      const minLen = parseInt(minLength);
      const maxLen = parseInt(maxLength);
      if (!isNaN(minLen) && a.length < minLen) return false;
      if (!isNaN(maxLen) && a.length > maxLen) return false;
      
      // Position filters
      const minPos = parseInt(minPosition);
      const maxPos = parseInt(maxPosition);
      if (!isNaN(minPos) && a.position < minPos) return false;
      if (!isNaN(maxPos) && a.position > maxPos) return false;
      
      return true;
    });
  }, [anomalies, typeFilter, severityFilter, minLength, maxLength, minPosition, maxPosition]);

  const summary = useMemo(() => {
    const types = anomalies.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const severities = anomalies.reduce((acc, a) => {
      acc[a.severity] = (acc[a.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: anomalies.length,
      types,
      severities,
      avgLength: anomalies.length > 0 
        ? (anomalies.reduce((sum, a) => sum + a.length, 0) / anomalies.length).toFixed(2)
        : 0,
      totalAffectedBits: anomalies.reduce((sum, a) => sum + a.length, 0),
      coverage: bits.length > 0 
        ? ((anomalies.reduce((sum, a) => sum + a.length, 0) / bits.length) * 100).toFixed(2)
        : 0,
    };
  }, [anomalies, bits.length]);

  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(anomalies.map(a => a.type)));
  }, [anomalies]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
      default: return 'text-muted-foreground';
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500/10';
      case 'medium': return 'bg-yellow-500/10';
      case 'low': return 'bg-blue-500/10';
      default: return 'bg-secondary/30';
    }
  };
  
  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-4">
        {/* Summary Card */}
        <Card className="p-4 bg-card border-border">
          <h3 className="text-sm font-semibold text-primary mb-3">Anomaly Detection Summary</h3>
          <div className="grid grid-cols-3 gap-3 text-sm mb-3">
            <div>
              <div className="text-muted-foreground text-xs">Total</div>
              <div className="text-foreground font-semibold text-lg">{summary.total}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Affected Bits</div>
              <div className="text-foreground font-semibold">{summary.totalAffectedBits}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Coverage</div>
              <div className="text-foreground font-semibold">{summary.coverage}%</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
            <div>
              <div className="text-xs text-muted-foreground mb-2">By Severity:</div>
              <div className="space-y-1">
                {Object.entries(summary.severities).map(([severity, count]) => (
                  <div key={severity} className="flex justify-between text-xs">
                    <span className={getSeverityColor(severity)}>{severity.toUpperCase()}</span>
                    <span className="text-foreground font-mono">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <div className="text-xs text-muted-foreground mb-2">By Type:</div>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {Object.entries(summary.types).slice(0, 3).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-xs">
                    <span className="text-muted-foreground truncate">{type}</span>
                    <span className="text-foreground font-mono">{count}</span>
                  </div>
                ))}
                {Object.entries(summary.types).length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{Object.entries(summary.types).length - 3} more types
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Filters */}
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={useBackendDefinitions ? 'default' : 'outline'}
                onClick={() => setUseBackendDefinitions(!useBackendDefinitions)}
                className="h-7 px-2 text-xs"
                title={useBackendDefinitions ? 'Using Backend Definitions' : 'Using Built-in Detection'}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                {useBackendDefinitions ? 'Backend' : 'Built-in'}
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                onClick={() => setViewMode('cards')}
                className="h-7 px-2"
              >
                <Grid className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'table' ? 'default' : 'outline'}
                onClick={() => setViewMode('table')}
                className="h-7 px-2"
              >
                <List className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {uniqueTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Severity</label>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Min Length</label>
                <Input
                  type="number"
                  placeholder="Min"
                  value={minLength}
                  onChange={(e) => setMinLength(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Max Length</label>
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxLength}
                  onChange={(e) => setMaxLength(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Min Position</label>
                <Input
                  type="number"
                  placeholder="Min"
                  value={minPosition}
                  onChange={(e) => setMinPosition(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Max Position</label>
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxPosition}
                  onChange={(e) => setMaxPosition(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>
          
          {(typeFilter !== 'all' || severityFilter !== 'all' || minLength || maxLength || minPosition || maxPosition) && (
            <div className="mt-2 text-xs text-muted-foreground">
              Showing {filteredAnomalies.length} of {anomalies.length} anomalies
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setTypeFilter('all');
                  setSeverityFilter('all');
                  setMinLength('');
                  setMaxLength('');
                  setMinPosition('');
                  setMaxPosition('');
                }}
                className="h-5 px-2 ml-2 text-xs"
              >
                Clear All
              </Button>
            </div>
          )}
        </Card>
        
        {/* Anomalies List/Table */}
        {filteredAnomalies.length === 0 ? (
          <Card className="p-8 bg-card/50 border-border">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {anomalies.length === 0 ? 'No anomalies detected' : 'No anomalies match the current filters'}
              </p>
              <p className="text-xs mt-1">
                {anomalies.length === 0 ? 'Load binary data to detect patterns' : 'Try adjusting your filters'}
              </p>
            </div>
          </Card>
        ) : viewMode === 'cards' ? (
          <div className="space-y-3">
            {filteredAnomalies.map((anomaly) => (
              <Card key={anomaly.id} className={`p-4 border-border ${getSeverityBg(anomaly.severity)}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-sm font-semibold text-primary">{anomaly.type}</div>
                      <span className={`text-[10px] uppercase font-bold ${getSeverityColor(anomaly.severity)}`}>
                        {anomaly.severity}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">{anomaly.description}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onJumpTo(anomaly.position)}
                    className="h-6 text-xs"
                  >
                    Jump
                  </Button>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Position:</span>
                    <span className="text-foreground font-mono">{anomaly.position}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Length:</span>
                    <span className="text-foreground font-mono">{anomaly.length} bits</span>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Sequence:</div>
                    <div className="text-xs font-mono bg-secondary/30 p-2 rounded break-all">
                      {anomaly.sequence}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-0 bg-card border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Sev</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Position</TableHead>
                  <TableHead className="text-right">Length</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnomalies.map((anomaly) => (
                  <TableRow key={anomaly.id}>
                    <TableCell>
                      <span className={`text-[10px] uppercase font-bold ${getSeverityColor(anomaly.severity)}`}>
                        {anomaly.severity[0]}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{anomaly.type}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{anomaly.position}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{anomaly.length}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{anomaly.description}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onJumpTo(anomaly.position)}
                        className="h-6 text-xs"
                      >
                        Jump
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
};