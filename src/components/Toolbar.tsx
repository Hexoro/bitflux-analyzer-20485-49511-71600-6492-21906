import { Button } from './ui/button';
import { Separator } from './ui/separator';
import {
  FileUp,
  Save,
  Download,
  Sparkles,
  Undo,
  Redo,
  Search,
  Navigation,
  ArrowLeftRight,
  Edit,
  BarChart3,
  Music,
} from 'lucide-react';

interface ToolbarProps {
  onLoad: () => void;
  onSave: () => void;
  onExport: () => void;
  onGenerate: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onJumpTo: () => void;
  onFind: () => void;
  onConvert: () => void;
  onToggleEdit: () => void;
  onMatrixEffects: () => void;
  onDataGraphs: () => void;
  onAudioVisualizer: () => void;
  canUndo: boolean;
  canRedo: boolean;
  editMode: boolean;
}

export const Toolbar = ({
  onLoad,
  onSave,
  onExport,
  onGenerate,
  onUndo,
  onRedo,
  onJumpTo,
  onFind,
  onConvert,
  onToggleEdit,
  onMatrixEffects,
  onDataGraphs,
  onAudioVisualizer,
  canUndo,
  canRedo,
  editMode,
}: ToolbarProps) => {
  return (
    <div className="flex items-center gap-2 p-2 bg-card border-b border-border">
      {/* File Operations */}
      <div className="flex items-center gap-1">
        <Button onClick={onLoad} variant="outline" size="sm">
          <FileUp className="w-4 h-4 mr-2" />
          Load
        </Button>
        <Button onClick={onSave} variant="outline" size="sm">
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
        <Button onClick={onExport} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Generate */}
      <Button onClick={onGenerate} variant="outline" size="sm">
        <Sparkles className="w-4 h-4 mr-2" />
        Generate
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Edit Operations */}
      <div className="flex items-center gap-1">
        <Button
          onClick={onUndo}
          variant="outline"
          size="sm"
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          onClick={onRedo}
          variant="outline"
          size="sm"
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Navigation */}
      <div className="flex items-center gap-1">
        <Button onClick={onJumpTo} variant="outline" size="sm">
          <Navigation className="w-4 h-4 mr-2" />
          Jump To
        </Button>
        <Button onClick={onFind} variant="outline" size="sm">
          <Search className="w-4 h-4 mr-2" />
          Find
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Tools */}
      <div className="flex items-center gap-1">
        <Button onClick={onConvert} variant="outline" size="sm">
          <ArrowLeftRight className="w-4 h-4 mr-2" />
          Convert
        </Button>
        <Button 
          onClick={onToggleEdit} 
          variant={editMode ? "default" : "outline"} 
          size="sm"
          title="Toggle Edit Mode (E)"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Visualizations */}
      <div className="flex items-center gap-1">
        <Button onClick={onMatrixEffects} variant="outline" size="sm">
          <Sparkles className="w-4 h-4 mr-2" />
          Matrix
        </Button>
        <Button onClick={onDataGraphs} variant="outline" size="sm">
          <BarChart3 className="w-4 h-4 mr-2" />
          Graphs
        </Button>
        <Button onClick={onAudioVisualizer} variant="outline" size="sm">
          <Music className="w-4 h-4 mr-2" />
          Audio
        </Button>
      </div>
    </div>
  );
};
