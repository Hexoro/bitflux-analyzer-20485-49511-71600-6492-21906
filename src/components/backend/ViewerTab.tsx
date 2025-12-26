/**
 * Viewer Tab for Backend Mode
 * View raw code of any file in the program
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileCode,
  Search,
  Copy,
  Download,
  Eye,
  Binary,
  FileText,
  Code,
} from 'lucide-react';
import { toast } from 'sonner';
import { fileSystemManager, BinaryFile } from '@/lib/fileSystemManager';
import { pythonModuleSystem } from '@/lib/pythonModuleSystem';

export const ViewerTab = () => {
  const [files, setFiles] = useState<BinaryFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'binary' | 'hex' | 'ascii'>('binary');

  useEffect(() => {
    const updateFiles = () => {
      setFiles(fileSystemManager.getFiles());
    };
    updateFiles();
    const unsub = fileSystemManager.subscribe(updateFiles);
    return unsub;
  }, []);

  const selectedFile = useMemo(() => {
    if (!selectedFileId) return null;
    return files.find(f => f.id === selectedFileId) || null;
  }, [selectedFileId, files]);

  const algorithmFiles = useMemo(() => {
    return pythonModuleSystem.getAllFiles();
  }, []);

  const filteredFiles = useMemo(() => {
    if (!searchQuery) return files;
    return files.filter(f => 
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [files, searchQuery]);

  const formatBits = (bits: string) => {
    if (viewMode === 'binary') {
      // Split into bytes
      const bytes: string[] = [];
      for (let i = 0; i < bits.length; i += 8) {
        bytes.push(bits.slice(i, i + 8).padEnd(8, '0'));
      }
      return bytes.join(' ');
    } else if (viewMode === 'hex') {
      // Convert to hex
      const hexBytes: string[] = [];
      for (let i = 0; i < bits.length; i += 8) {
        const byte = bits.slice(i, i + 8).padEnd(8, '0');
        hexBytes.push(parseInt(byte, 2).toString(16).toUpperCase().padStart(2, '0'));
      }
      return hexBytes.join(' ');
    } else {
      // ASCII
      const chars: string[] = [];
      for (let i = 0; i < bits.length; i += 8) {
        const byte = bits.slice(i, i + 8).padEnd(8, '0');
        const charCode = parseInt(byte, 2);
        chars.push(charCode >= 32 && charCode < 127 ? String.fromCharCode(charCode) : '.');
      }
      return chars.join('');
    }
  };

  const handleCopy = () => {
    if (!selectedFile) return;
    const bits = selectedFile.state.model.getBits();
    navigator.clipboard.writeText(formatBits(bits));
    toast.success('Copied to clipboard');
  };

  const handleDownload = () => {
    if (!selectedFile) return;
    const bits = selectedFile.state.model.getBits();
    const content = formatBits(bits);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFile.name}_${viewMode}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('File downloaded');
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <Card className="bg-gradient-to-r from-primary/10 to-transparent border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="w-4 h-4" />
              File Viewer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              View raw content of any file in the program in binary, hex, or ASCII format.
            </p>
          </CardContent>
        </Card>

        {/* File Selection */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileCode className="w-4 h-4" />
              Select File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files..."
                className="pl-9"
              />
            </div>

            <div className="space-y-2 max-h-48 overflow-auto">
              <h4 className="text-xs font-medium text-muted-foreground uppercase">Binary Files</h4>
              {filteredFiles.length === 0 ? (
                <p className="text-xs text-muted-foreground">No files found</p>
              ) : (
                filteredFiles.map(file => (
                  <div
                    key={file.id}
                    className={`p-2 rounded border cursor-pointer transition-colors ${
                      selectedFileId === file.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedFileId(file.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Binary className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">{file.name}</span>
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {file.state.model.getBits().length} bits
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>

            {algorithmFiles.length > 0 && (
              <>
                <h4 className="text-xs font-medium text-muted-foreground uppercase mt-4">Algorithm Files</h4>
                {algorithmFiles.map(file => (
                  <div
                    key={file.id}
                    className="p-2 rounded border border-border hover:border-primary/50 cursor-pointer"
                    onClick={() => toast.info(`Algorithm file: ${file.name}\n${file.content.slice(0, 200)}...`)}
                  >
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4 text-accent" />
                      <span className="text-sm font-medium">{file.name}</span>
                      <Badge variant="outline" className="text-xs ml-auto">
                        {file.group}
                      </Badge>
                    </div>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        {/* File Content */}
        {selectedFile && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {selectedFile.name}
                </div>
                <div className="flex items-center gap-2">
                  <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
                    <SelectTrigger className="w-24 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="binary">Binary</SelectItem>
                      <SelectItem value="hex">Hex</SelectItem>
                      <SelectItem value="ascii">ASCII</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" onClick={handleCopy}>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleDownload}>
                    <Download className="w-3 h-3 mr-1" />
                    Export
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded p-3 font-mono text-xs max-h-96 overflow-auto whitespace-pre-wrap break-all">
                {formatBits(selectedFile.state.model.getBits()).slice(0, 10000)}
                {selectedFile.state.model.getBits().length > 10000 * 8 && (
                  <span className="text-muted-foreground">... (truncated)</span>
                )}
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{selectedFile.state.model.getBits().length} bits</span>
                <span>{Math.ceil(selectedFile.state.model.getBits().length / 8)} bytes</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
};
