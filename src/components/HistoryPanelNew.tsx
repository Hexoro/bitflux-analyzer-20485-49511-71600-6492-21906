import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HistoryEntry } from '@/lib/historyManager';
import { HistoryGroup } from '@/lib/fileState';
import { Clock, GitCompare, RotateCcw, ChevronDown, ChevronRight, FolderOpen, Plus, Minus, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ChangeInfo {
  type: 'added' | 'deleted' | 'modified';
  position: number;
  count: number;
  preview?: string;
}


interface HistoryPanelNewProps {
  groups: HistoryGroup[];
  onRestoreVersion: (entry: HistoryEntry) => void;
  onRestoreToNewFile: (entry: HistoryEntry) => void;
  onCompareVersion: (entry: HistoryEntry) => void;
  onToggleGroup: (groupId: string) => void;
}

export const HistoryPanelNew = ({ 
  groups, 
  onRestoreVersion,
  onRestoreToNewFile, 
  onCompareVersion,
  onToggleGroup 
}: HistoryPanelNewProps) => {
  
  const calculateDiff = (currentEntry: HistoryEntry, previousEntry: HistoryEntry | null): ChangeInfo[] => {
    if (!previousEntry) {
      return [{
        type: 'added',
        position: 0,
        count: currentEntry.bits.length,
        preview: currentEntry.bits.substring(0, 20) + (currentEntry.bits.length > 20 ? '...' : '')
      }];
    }

    const changes: ChangeInfo[] = [];
    const current = currentEntry.bits;
    const previous = previousEntry.bits;
    
    const lengthDiff = current.length - previous.length;
    
    if (lengthDiff > 0) {
      // Bits were added
      changes.push({
        type: 'added',
        position: previous.length,
        count: lengthDiff,
        preview: current.substring(previous.length, previous.length + 20) + (lengthDiff > 20 ? '...' : '')
      });
    } else if (lengthDiff < 0) {
      // Bits were deleted
      changes.push({
        type: 'deleted',
        position: current.length,
        count: Math.abs(lengthDiff),
        preview: previous.substring(current.length, current.length + 20) + (Math.abs(lengthDiff) > 20 ? '...' : '')
      });
    }
    
    // Check for modifications in common range
    const minLength = Math.min(current.length, previous.length);
    let modifiedStart = -1;
    let modifiedCount = 0;
    
    for (let i = 0; i < minLength; i++) {
      if (current[i] !== previous[i]) {
        if (modifiedStart === -1) {
          modifiedStart = i;
        }
        modifiedCount++;
      } else if (modifiedStart !== -1 && modifiedCount > 0) {
        changes.push({
          type: 'modified',
          position: modifiedStart,
          count: modifiedCount,
          preview: current.substring(modifiedStart, Math.min(modifiedStart + 20, current.length))
        });
        modifiedStart = -1;
        modifiedCount = 0;
      }
    }
    
    // Add remaining modifications if any
    if (modifiedStart !== -1 && modifiedCount > 0) {
      changes.push({
        type: 'modified',
        position: modifiedStart,
        count: modifiedCount,
        preview: current.substring(modifiedStart, Math.min(modifiedStart + 20, current.length))
      });
    }
    
    return changes.length > 0 ? changes : [];
  };

  const renderChangeInfo = (entry: HistoryEntry, previousEntry: HistoryEntry | null) => {
    const changes = calculateDiff(entry, previousEntry);
    
    if (changes.length === 0) return null;
    
    return (
      <div className="mt-2 space-y-1">
        {changes.map((change, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            {change.type === 'added' && (
              <>
                <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                  <Plus className="w-3 h-3 mr-1" />
                  +{change.count}
                </Badge>
                <span className="text-muted-foreground">at position {change.position}</span>
                <code className="font-mono text-xs bg-green-500/10 px-2 py-0.5 rounded">
                  {change.preview}
                </code>
              </>
            )}
            {change.type === 'deleted' && (
              <>
                <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
                  <Minus className="w-3 h-3 mr-1" />
                  -{change.count}
                </Badge>
                <span className="text-muted-foreground">at position {change.position}</span>
                <code className="font-mono text-xs bg-red-500/10 px-2 py-0.5 rounded line-through">
                  {change.preview}
                </code>
              </>
            )}
            {change.type === 'modified' && (
              <>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                  <Edit className="w-3 h-3 mr-1" />
                  ~{change.count}
                </Badge>
                <span className="text-muted-foreground">at position {change.position}</span>
                <code className="font-mono text-xs bg-blue-500/10 px-2 py-0.5 rounded">
                  {change.preview}
                </code>
              </>
            )}
          </div>
        ))}
      </div>
    );
  };
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  const formatBytes = (bits: number) => {
    const bytes = bits / 8;
    if (bytes < 1024) return `${bytes.toFixed(0)} B`;
    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  if (groups.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground p-8">
        <div className="text-center">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No history available</p>
          <p className="text-sm">Edits will appear here as you make changes</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-2">
        {groups.map((group, groupIndex) => {
          // Get previous entry for diff calculation
          const previousEntry = groupIndex < groups.length - 1 
            ? groups[groupIndex + 1].entries[0] 
            : null;
          
          return (
            <div key={group.id}>
              {group.count === 1 ? (
                // Single entry - show directly
                <Card className="p-3 bg-card border-border hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">
                          #{groups.length - groupIndex}
                        </span>
                        <span className="text-sm font-medium text-foreground truncate">
                          {group.entries[0].description}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(group.entries[0].timestamp)}
                        </span>
                        {group.entries[0].stats && (
                          <>
                            <span>{formatBytes(group.entries[0].stats.totalBits)}</span>
                            <span>Entropy: {group.entries[0].stats.entropy.toFixed(3)}</span>
                          </>
                        )}
                      </div>
                      {renderChangeInfo(group.entries[0], previousEntry)}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onCompareVersion(group.entries[0])}
                        className="h-7 px-2"
                        title="Compare"
                      >
                        <GitCompare className="w-3 h-3" />
                      </Button>
                      {groupIndex > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onRestoreVersion(group.entries[0])}
                          className="h-7 px-2"
                          title="Restore to current file"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRestoreToNewFile(group.entries[0])}
                        className="h-7 px-2"
                        title="Restore as new file"
                      >
                        <FolderOpen className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                // Multiple entries - show group
                <Card className="p-3 bg-card border-border">
                  <button
                    className="w-full flex items-center justify-between gap-2 hover:opacity-80 transition-opacity"
                    onClick={() => onToggleGroup(group.id)}
                  >
                    <div className="flex items-center gap-2">
                      {group.expanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="text-xs font-mono text-muted-foreground">
                        #{groups.length - groupIndex}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {group.type} ({group.count} changes)
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(group.lastTimestamp)}
                    </span>
                  </button>

                  {group.expanded && (
                    <div className="mt-2 ml-6 space-y-2 border-l-2 border-border pl-3">
                      {group.entries.map((entry, entryIndex) => {
                        // Get previous entry for this specific entry
                        const prevEntryForThis = entryIndex < group.entries.length - 1
                          ? group.entries[entryIndex + 1]
                          : (groupIndex < groups.length - 1 ? groups[groupIndex + 1].entries[0] : null);
                        
                        return (
                          <div
                            key={entry.id}
                            className="p-2 bg-muted/30 rounded border border-border/50"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-foreground truncate mb-1">
                                  {entry.description}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(entry.timestamp)}
                                  </span>
                                  {entry.stats && (
                                    <>
                                      <span>{formatBytes(entry.stats.totalBits)}</span>
                                      <span>E: {entry.stats.entropy.toFixed(3)}</span>
                                    </>
                                  )}
                                </div>
                                {renderChangeInfo(entry, prevEntryForThis)}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onCompareVersion(entry)}
                                  className="h-6 px-2"
                                  title="Compare"
                                >
                                  <GitCompare className="w-3 h-3" />
                                </Button>
                                {(groupIndex > 0 || entryIndex > 0) && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onRestoreVersion(entry)}
                                    className="h-6 px-2"
                                    title="Restore to current file"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onRestoreToNewFile(entry)}
                                  className="h-6 px-2"
                                  title="Restore as new file"
                                >
                                  <FolderOpen className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};
