/**
 * Files Tab - Python file management with groups and editable preview
 * Groups: Scheduler (1 required), Algorithm, Scoring, Policies
 */

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
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
  Clock,
  Save,
  Edit2,
  X,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { pythonModuleSystem, PythonFile, EXAMPLE_STRATEGIES } from '@/lib/pythonModuleSystem';

interface FilesTabProps {
  onFileSelect?: (file: PythonFile | null) => void;
}

export const FilesTab = ({ onFileSelect }: FilesTabProps) => {
  const [files, setFiles] = useState<PythonFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<PythonFile | null>(null);
  const [uploadGroup, setUploadGroup] = useState<PythonFile['group']>('algorithm');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editName, setEditName] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'group'>('group');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFiles(pythonModuleSystem.getAllFiles());
    const unsubscribe = pythonModuleSystem.subscribe(() => {
      setFiles(pythonModuleSystem.getAllFiles());
    });
    return unsubscribe;
  }, []);

  const schedulerFiles = files.filter(f => f.group === 'scheduler');
  const algorithmFiles = files.filter(f => f.group === 'algorithm');
  const scoringFiles = files.filter(f => f.group === 'scoring');
  const policyFiles = files.filter(f => f.group === 'policies');

  const sortedFiles = (fileList: PythonFile[]) => {
    switch (sortBy) {
      case 'name':
        return [...fileList].sort((a, b) => a.name.localeCompare(b.name));
      case 'date':
        return [...fileList].sort((a, b) => b.modified.getTime() - a.modified.getTime());
      default:
        return fileList;
    }
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    for (const file of Array.from(uploadedFiles)) {
      if (!file.name.endsWith('.py')) {
        toast.error(`${file.name}: Only Python (.py) files are allowed`);
        continue;
      }

      try {
        const content = await file.text();
        pythonModuleSystem.addFile(file.name, content, uploadGroup);
        toast.success(`${file.name} uploaded to ${uploadGroup}`);
      } catch (error) {
        toast.error(`Failed to read ${file.name}`);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = (id: string) => {
    pythonModuleSystem.deleteFile(id);
    if (selectedFile?.id === id) {
      setSelectedFile(null);
      setIsEditing(false);
      onFileSelect?.(null);
    }
    toast.success('File deleted');
  };

  const handleSelect = (file: PythonFile) => {
    setSelectedFile(file);
    setIsEditing(false);
    setEditContent(file.content);
    setEditName(file.name);
    onFileSelect?.(file);
  };

  const handleStartEdit = () => {
    if (selectedFile) {
      setEditContent(selectedFile.content);
      setEditName(selectedFile.name);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    if (selectedFile) {
      pythonModuleSystem.updateFile(selectedFile.id, {
        content: editContent,
        name: editName
      });
      setIsEditing(false);
      toast.success('File saved');
    }
  };

  const handleCancelEdit = () => {
    if (selectedFile) {
      setEditContent(selectedFile.content);
      setEditName(selectedFile.name);
    }
    setIsEditing(false);
  };

  const handleAddExample = (type: keyof typeof EXAMPLE_STRATEGIES) => {
    pythonModuleSystem.addExampleStrategy(type);
    toast.success(`${type} example strategy added`);
  };

  const getGroupIcon = (group: PythonFile['group']) => {
    switch (group) {
      case 'scheduler': return <Clock className="w-4 h-4 text-purple-500" />;
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
        sortedFiles(files).map(file => (
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
      {/* Hidden file input - multiple allowed */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".py"
        multiple
        className="hidden"
      />

      {/* Left: File List */}
      <div className="w-1/2 flex flex-col gap-4">
        {/* Upload Controls */}
        <Card>
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center gap-2">
              <Select value={uploadGroup} onValueChange={(v) => setUploadGroup(v as PythonFile['group'])}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduler">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Scheduler
                    </div>
                  </SelectItem>
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
                Upload Python Files
              </Button>
            </div>

            {/* Sort Control */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Sort by:</span>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-24 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="group">Group</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Example Strategies */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Add examples:</span>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleAddExample('greedy')}>
                <Plus className="w-3 h-3 mr-1" />
                Greedy
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleAddExample('hillClimbing')}>
                <Plus className="w-3 h-3 mr-1" />
                Hill Climbing
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleAddExample('geneticAlgorithm')}>
                <Plus className="w-3 h-3 mr-1" />
                Genetic
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* File Groups */}
        <ScrollArea className="flex-1">
          <Accordion type="multiple" defaultValue={['scheduler', 'algorithm', 'scoring', 'policies']}>
            <AccordionItem value="scheduler">
              <AccordionTrigger className="py-3">
                <div className="flex items-center gap-2">
                  {getGroupIcon('scheduler')}
                  <span>Scheduler</span>
                  <Badge variant="secondary" className="ml-2">{schedulerFiles.length}</Badge>
                  <Badge variant="outline" className="text-xs">Required: 1</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <FileList files={schedulerFiles} group="scheduler" />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="algorithm">
              <AccordionTrigger className="py-3">
                <div className="flex items-center gap-2">
                  {getGroupIcon('algorithm')}
                  <span>Algorithm</span>
                  <Badge variant="secondary" className="ml-2">{algorithmFiles.length}</Badge>
                  <Badge variant="outline" className="text-xs">Multi</Badge>
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
                  <Badge variant="outline" className="text-xs">Multi</Badge>
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
                  <Badge variant="outline" className="text-xs">Optional</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <FileList files={policyFiles} group="policies" />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ScrollArea>
      </div>

      {/* Right: File Preview with Edit */}
      <Card className="w-1/2 flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              {selectedFile ? (isEditing ? 'Editing: ' : '') + selectedFile.name : 'File Preview'}
            </div>
            {selectedFile && (
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveEdit}>
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" onClick={handleStartEdit}>
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col">
          {selectedFile ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{selectedFile.group}</Badge>
                {isEditing && (
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-7 w-48 font-mono text-sm"
                  />
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  Modified: {new Date(selectedFile.modified).toLocaleString()}
                </span>
              </div>
              {isEditing ? (
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="flex-1 font-mono text-sm resize-none"
                  placeholder="Python code..."
                />
              ) : (
                <ScrollArea className="flex-1 border rounded-lg">
                  <pre className="p-4 text-sm font-mono">
                    <code>{selectedFile.content}</code>
                  </pre>
                </ScrollArea>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a file to preview</p>
                <p className="text-xs mt-2">Click Edit to modify the file</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
