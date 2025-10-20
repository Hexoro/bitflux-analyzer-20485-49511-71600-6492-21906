import { useState, useEffect } from 'react';
import { NotesManager, Note } from '@/lib/notesManager';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Plus, Pin, PinOff, Trash2, Download, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from './ui/separator';

interface NotesPanelProps {
  notesManager: NotesManager;
  onUpdate?: () => void;
}

export const NotesPanel = ({ notesManager, onUpdate }: NotesPanelProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTags, setNewNoteTags] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    refreshNotes();
  }, [notesManager]);

  const refreshNotes = () => {
    const allNotes = searchQuery 
      ? notesManager.searchNotes(searchQuery)
      : notesManager.getNotes();
    setNotes(allNotes);
  };

  const handleAddNote = () => {
    if (!newNoteContent.trim()) {
      toast.error('Note content cannot be empty');
      return;
    }

    const tags = newNoteTags.split(',').map(t => t.trim()).filter(t => t);
    notesManager.addNote(newNoteContent, tags);
    setNewNoteContent('');
    setNewNoteTags('');
    refreshNotes();
    onUpdate?.();
    toast.success('Note added');
  };

  const handleUpdateNote = (id: string) => {
    if (!editContent.trim()) {
      toast.error('Note content cannot be empty');
      return;
    }

    const tags = editTags.split(',').map(t => t.trim()).filter(t => t);
    notesManager.updateNote(id, editContent, tags);
    setEditingNoteId(null);
    setEditContent('');
    setEditTags('');
    refreshNotes();
    onUpdate?.();
    toast.success('Note updated');
  };

  const handleDeleteNote = (id: string) => {
    notesManager.deleteNote(id);
    refreshNotes();
    onUpdate?.();
    toast.success('Note deleted');
  };

  const handleTogglePin = (id: string) => {
    notesManager.togglePin(id);
    refreshNotes();
    onUpdate?.();
  };

  const handleExport = () => {
    const markdown = notesManager.exportToMarkdown();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Notes exported');
  };

  const startEdit = (note: Note) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
    setEditTags(note.tags?.join(', ') || '');
  };

  const cancelEdit = () => {
    setEditingNoteId(null);
    setEditContent('');
    setEditTags('');
  };

  return (
    <div className="h-full overflow-auto p-4 space-y-4 scrollbar-thin">
      <Card className="p-4 bg-card border-border">
        <h3 className="text-sm font-semibold text-primary mb-3">Add New Note</h3>
        <div className="space-y-3">
          <Textarea
            placeholder="Write your note here (Markdown supported)..."
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            className="min-h-[100px] font-mono text-xs"
          />
          <Input
            placeholder="Tags (comma-separated)"
            value={newNoteTags}
            onChange={(e) => setNewNoteTags(e.target.value)}
            className="text-xs"
          />
          <Button onClick={handleAddNote} size="sm" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Note
          </Button>
        </div>
      </Card>

      <Card className="p-4 bg-card border-border">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                refreshNotes();
              }}
              className="pl-8 text-xs"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => {
                  setSearchQuery('');
                  refreshNotes();
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        {notes.map((note) => (
          <Card key={note.id} className="p-4 bg-card border-border">
            {editingNoteId === note.id ? (
              <div className="space-y-3">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[100px] font-mono text-xs"
                />
                <Input
                  placeholder="Tags (comma-separated)"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="text-xs"
                />
                <div className="flex gap-2">
                  <Button onClick={() => handleUpdateNote(note.id)} size="sm" className="flex-1">
                    Save
                  </Button>
                  <Button onClick={cancelEdit} variant="outline" size="sm" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {note.pinned && <Pin className="w-4 h-4 text-primary" />}
                    <span className="text-xs text-muted-foreground">
                      {note.timestamp.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => handleTogglePin(note.id)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      title={note.pinned ? 'Unpin' : 'Pin'}
                    >
                      {note.pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                    </Button>
                    <Button
                      onClick={() => startEdit(note)}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteNote(note.id)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="prose prose-sm max-w-none text-foreground">
                  <pre className="whitespace-pre-wrap font-mono text-xs bg-muted/30 p-3 rounded">
                    {note.content}
                  </pre>
                </div>

                {note.tags && note.tags.length > 0 && (
                  <>
                    <Separator className="my-3" />
                    <div className="flex flex-wrap gap-2">
                      {note.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </Card>
        ))}
      </div>

      {notes.length === 0 && (
        <div className="text-center text-muted-foreground text-sm py-8">
          {searchQuery ? 'No notes found matching your search' : 'No notes yet. Add your first note above!'}
        </div>
      )}
    </div>
  );
};
