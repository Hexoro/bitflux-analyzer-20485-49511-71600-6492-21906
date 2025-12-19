/**
 * Files Tab - Python file management with groups and preview
 */

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Upload,
  FileCode,
  Trash2,
  Eye,
  FolderOpen,
  Code,
  Calculator,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { pythonModuleSystem, PythonFile } from '@/lib/pythonModuleSystem';

interface FilesTabProps {
  onFileSelect?: (file: PythonFile | null) => void;
}

export const FilesTab = ({ onFileSelect }: FilesTabProps) => {
  const [files, setFiles] = useState<PythonFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<PythonFile | null>(null);
  const [uploadGroup, setUploadGroup] = useState<PythonFile['group']>('algorithm');
  const [, forceUpdate] = useState({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFiles(pythonModuleSystem.getAllFiles());
    const unsubscribe = pythonModuleSystem.subscribe(() => {
      setFiles(pythonModuleSystem.getAllFiles());
    });
    return unsubscribe;
  }, []);

  const algorithmFiles = files.filter(f => f.group === 'algorithm');
  const scoringFiles = files.filter(f => f.group === 'scoring');
  const policyFiles = files.filter(f => f.group === 'policies');

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.py')) {
      toast.error('Only Python (.py) files are allowed');
      return;
    }

    try {
      const content = await file.text();
      pythonModuleSystem.addFile(file.name, content, uploadGroup);
      toast.success(`${file.name} uploaded to ${uploadGroup}`);
    } catch (error) {
      toast.error('Failed to read file');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = (id: string) => {
    pythonModuleSystem.deleteFile(id);
    if (selectedFile?.id === id) {
      setSelectedFile(null);
      onFileSelect?.(null);
    }
    toast.success('File deleted');
  };

  const handleSelect = (file: PythonFile) => {
    setSelectedFile(file);
    onFileSelect?.(file);
  };

  const getGroupIcon = (group: PythonFile['group']) => {
    switch (group) {
      case 'algorithm': return <Code className="w-4 h-4 text-primary" />;
      case 'scoring': return <Calculator className="w-4 h-4 text-yellow-500" />;
      case 'policies': return <Shield className="w-4 h-4 text-green-500" />;
    }
  };

  const FileList = ({ files, group }: { files: PythonFile[]; group: PythonFile['group'] }) => (
    <div className="space-y-2">
      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No files in this group</p>
      ) : (
        files.map(file => (
          <div
            key={file.id}
            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
              selectedFile?.id === file.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
            }`}
            onClick={() => handleSelect(file)}
          >
            <div className="flex items-center gap-3">
              <FileCode className="w-4 h-4 text-yellow-500" />
              <div>
                <p className="font-medium font-mono text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {file.content.length} chars • {new Date(file.modified).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(file);
                }}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(file.id);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="h-full flex gap-4 p-4">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".py"
        className="hidden"
      />

      {/* Left: File List */}
      <div className="w-1/2 flex flex-col gap-4">
        {/* Upload Controls */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <Select value={uploadGroup} onValueChange={(v) => setUploadGroup(v as PythonFile['group'])}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="algorithm">
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      Algorithm
                    </div>
                  </SelectItem>
                  <SelectItem value="scoring">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4" />
                      Scoring
                    </div>
                  </SelectItem>
                  <SelectItem value="policies">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Policies
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleUpload} className="flex-1">
                <Upload className="w-4 h-4 mr-2" />
                Upload Python File
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* File Groups */}
        <ScrollArea className="flex-1">
          <Accordion type="multiple" defaultValue={['algorithm', 'scoring', 'policies']}>
            <AccordionItem value="algorithm">
              <AccordionTrigger className="py-3">
                <div className="flex items-center gap-2">
                  {getGroupIcon('algorithm')}
                  <span>Algorithm</span>
                  <Badge variant="secondary" className="ml-2">{algorithmFiles.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <FileList files={algorithmFiles} group="algorithm" />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="scoring">
              <AccordionTrigger className="py-3">
                <div className="flex items-center gap-2">
                  {getGroupIcon('scoring')}
                  <span>Scoring</span>
                  <Badge variant="secondary" className="ml-2">{scoringFiles.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <FileList files={scoringFiles} group="scoring" />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="policies">
              <AccordionTrigger className="py-3">
                <div className="flex items-center gap-2">
                  {getGroupIcon('policies')}
                  <span>Policies</span>
                  <Badge variant="secondary" className="ml-2">{policyFiles.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <FileList files={policyFiles} group="policies" />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ScrollArea>
      </div>

      {/* Right: File Preview */}
      <Card className="w-1/2 flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="w-4 h-4" />
            {selectedFile ? selectedFile.name : 'File Preview'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          {selectedFile ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{selectedFile.group}</Badge>
                <span className="text-xs text-muted-foreground">
                  Modified: {new Date(selectedFile.modified).toLocaleString()}
                </span>
              </div>
              <ScrollArea className="flex-1 border rounded-lg">
                <pre className="p-4 text-sm font-mono">
                  <code>{selectedFile.content}</code>
                </pre>
              </ScrollArea>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a file to preview</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
