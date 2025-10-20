import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HistoryEntry } from '@/lib/historyManager';
import { HistoryGroup } from '@/lib/fileState';
import { Clock, GitCompare, RotateCcw, ChevronDown, ChevronRight, FolderOpen } from 'lucide-react';
import { useState } from 'react';

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
        {groups.map((group, groupIndex) => (
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
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onRestoreVersion(group.entries[0])}
                          className="h-7 px-2"
                          title="Restore to current file"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onRestoreToNewFile(group.entries[0])}
                          className="h-7 px-2"
                          title="Restore as new file"
                        >
                          <FolderOpen className="w-3 h-3" />
                        </Button>
                      </>
                    )}
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
                    {group.entries.map((entry, entryIndex) => (
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
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onRestoreVersion(entry)}
                              className="h-6 px-2"
                              title="Restore to current file"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </Button>
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
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
