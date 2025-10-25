import { useState, useEffect } from 'react';
import { BinaryMetrics } from '@/lib/binaryMetrics';
import { FileState, SavedSequence } from '@/lib/fileState';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Search, X, Grid, List, Eye, EyeOff } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';

interface SequencesPanelProps {
  fileState: FileState;
  onJumpTo: (index: number) => void;
}

export const SequencesPanel = ({ fileState, onJumpTo }: SequencesPanelProps) => {
  const [searchInput, setSearchInput] = useState('');
  const [colorInput, setColorInput] = useState('#FF00FF');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [sortFilter, setSortFilter] = useState<string>('serial');
  const [savedSequences, setSavedSequences] = useState<SavedSequence[]>([]);

  const bits = fileState.model.getBits();

  // Sync local state with fileState
  useEffect(() => {
    setSavedSequences(Array.isArray(fileState.savedSequences) ? fileState.savedSequences : []);
  }, [fileState.savedSequences]);

  // Subscribe to file state changes
  useEffect(() => {
    const unsubscribe = fileState.subscribe(() => {
      setSavedSequences(Array.isArray(fileState.savedSequences) ? [...fileState.savedSequences] : []);
    });
    return unsubscribe;
  }, [fileState]);

  const handleSearch = () => {
    const sequences = searchInput
      .split(/[,\s]+/)
      .map(s => s.trim())
      .filter(s => /^[01]+$/.test(s));

    if (sequences.length === 0) {
      toast.error('Please enter valid binary sequences');
      return;
    }

    const matches = BinaryMetrics.searchMultipleSequences(bits, sequences);
    
    let addedCount = 0;
    matches.forEach(match => {
      if (!fileState.savedSequences.find(s => s.sequence === match.sequence)) {
        fileState.addSequence(match, colorInput);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      toast.success(`Added ${addedCount} sequence${addedCount > 1 ? 's' : ''}`);
    } else {
      toast.info('All sequences already added');
    }

    setSearchInput('');
  };

  const handleFindAll = () => {
    if (savedSequences.length === 0) {
      toast.info('No sequences to find');
      return;
    }

    // Re-search all saved sequences to update positions
    const allSequences = savedSequences.map(s => s.sequence);
    const matches = BinaryMetrics.searchMultipleSequences(bits, allSequences);
    
    matches.forEach(match => {
      const existing = fileState.savedSequences.find(s => s.sequence === match.sequence);
      if (existing) {
        // Update the sequence with new positions
        fileState.removeSequence(existing.id);
        fileState.addSequence(match, existing.color);
      }
    });

    toast.success('Updated all sequence positions');
  };

  const handleExportSequences = () => {
    if (savedSequences.length === 0) {
      toast.info('No sequences to export');
      return;
    }

    const exportData = savedSequences.map(seq => ({
      sequence: seq.sequence,
      color: seq.color,
      count: seq.count,
      positions: seq.positions,
      meanDistance: seq.meanDistance,
      varianceDistance: seq.varianceDistance
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sequences_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Sequences exported');
  };

  const handleToggleHighlight = (id: string) => {
    fileState.toggleSequenceHighlight(id);
  };

  const handleRemoveSequence = (id: string) => {
    fileState.removeSequence(id);
    toast.success('Sequence removed');
  };

  const handleClearAll = () => {
    fileState.clearAllSequences();
    toast.success('All sequences cleared');
  };

  const sortedSequences = (Array.isArray(savedSequences) ? [...savedSequences] : []).sort((a, b) => {
    switch (sortFilter) {
      case 'serial': return a.serialNumber - b.serialNumber;
      case 'count': return b.count - a.count;
      case 'length': return b.sequence.length - a.sequence.length;
      case 'position': return (a.positions[0] || 0) - (b.positions[0] || 0);
      default: return 0;
    }
  });

  return (
    <div className="h-full overflow-auto p-4 space-y-4 scrollbar-thin">
      <Card className="p-4 bg-card border-border">
        <h3 className="text-sm font-semibold text-primary mb-3">Sequence Search</h3>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Enter binary sequences (e.g., 1010, 0011)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="font-mono flex-1"
            />
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-border"
                title="Choose highlight color"
              />
              <Button onClick={handleSearch} size="sm">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {savedSequences.length > 0 && (
            <div className="flex gap-2">
              <Button onClick={handleFindAll} variant="outline" size="sm" className="flex-1">
                Find All
              </Button>
              <Button onClick={handleExportSequences} variant="outline" size="sm" className="flex-1">
                Export
              </Button>
              <Button onClick={handleClearAll} variant="outline" size="sm" className="flex-1">
                Clear
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Separate multiple sequences with commas or spaces. Choose color before searching.
          </p>
        </div>
      </Card>

      {savedSequences.length > 0 && (
        <>
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-xs text-muted-foreground">Sort by:</div>
                <Select value={sortFilter} onValueChange={setSortFilter}>
                  <SelectTrigger className="h-8 w-32 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="serial">Serial #</SelectItem>
                    <SelectItem value="count">Count</SelectItem>
                    <SelectItem value="length">Length</SelectItem>
                    <SelectItem value="position">Position</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
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
          </Card>

          {viewMode === 'cards' ? (
            <div className="space-y-3">
              {sortedSequences.map((seq) => (
                <Card key={seq.id} className="p-4 bg-card border-border relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-bold text-primary">#{seq.serialNumber}</div>
                      <Button
                        onClick={() => handleToggleHighlight(seq.id)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        title={seq.highlighted ? 'Hide highlights' : 'Show highlights'}
                      >
                        {seq.highlighted ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Button
                      onClick={() => handleRemoveSequence(seq.id)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-4 h-4 rounded border border-border flex-shrink-0 mt-1"
                      style={{ backgroundColor: seq.color }}
                      title="Highlight color"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-primary font-mono break-all">
                        {seq.sequence}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {seq.count} occurrence{seq.count !== 1 ? 's' : ''} • {seq.sequence.length} bits
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mean Distance:</span>
                      <span className="text-foreground font-mono">
                        {seq.meanDistance.toFixed(2)} bits
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Variance:</span>
                      <span className="text-foreground font-mono">
                        {seq.varianceDistance.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {seq.positions.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs text-muted-foreground mb-2">
                        Positions (showing first 10):
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {seq.positions.slice(0, 10).map((pos, posIdx) => (
                          <Button
                            key={posIdx}
                            size="sm"
                            variant="outline"
                            onClick={() => onJumpTo(pos)}
                            className="h-6 px-2 text-xs font-mono"
                          >
                            {pos}
                          </Button>
                        ))}
                        {seq.positions.length > 10 && (
                          <span className="text-xs text-muted-foreground self-center">
                            +{seq.positions.length - 10} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-0 bg-card border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead className="w-12">
                      <Eye className="w-4 h-4" />
                    </TableHead>
                    <TableHead className="w-12">Color</TableHead>
                    <TableHead>Sequence</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Length</TableHead>
                    <TableHead className="text-right">Mean Dist</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSequences.map((seq) => (
                    <TableRow key={seq.id}>
                      <TableCell className="font-bold text-primary">
                        {seq.serialNumber}
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={seq.highlighted}
                          onCheckedChange={() => handleToggleHighlight(seq.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div
                          className="w-4 h-4 rounded border border-border"
                          style={{ backgroundColor: seq.color }}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[200px] truncate">
                        {seq.sequence}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {seq.count}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {seq.sequence.length}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {seq.meanDistance.toFixed(1)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => seq.positions[0] && onJumpTo(seq.positions[0])}
                            className="h-6 text-xs px-2"
                          >
                            Jump
                          </Button>
                          <Button
                            onClick={() => handleRemoveSequence(seq.id)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </>
      )}

      {savedSequences.length === 0 && (
        <div className="text-center text-muted-foreground text-sm py-8">
          Enter binary sequences to search for patterns in the data
        </div>
      )}
    </div>
  );
};