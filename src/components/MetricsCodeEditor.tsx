/**
 * Metrics Code Editor - Write and edit metric formulas with full documentation
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Calculator,
  Save,
  Plus,
  Trash2,
  Code,
  Info,
  Link,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { predefinedManager, PredefinedMetric } from '@/lib/predefinedManager';

interface MetricReference {
  usedIn: string[];
  dependsOn: string[];
  formula: string;
}

export const MetricsCodeEditor = () => {
  const [selectedMetric, setSelectedMetric] = useState<PredefinedMetric | null>(null);
  const [editForm, setEditForm] = useState<Partial<PredefinedMetric>>({});
  const [isNew, setIsNew] = useState(false);
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const unsubscribe = predefinedManager.subscribe(() => forceUpdate({}));
    return unsubscribe;
  }, []);

  const metrics = predefinedManager.getAllMetrics();

  const getMetricReferences = (metricId: string): MetricReference => {
    const usedIn: string[] = [];
    const dependsOn: string[] = [];
    
    const metric = predefinedManager.getMetric(metricId);
    if (!metric) return { usedIn: [], dependsOn: [], formula: '' };

    // Check where this metric is referenced
    metrics.forEach(m => {
      if (m.id !== metricId && m.formula.includes(metricId)) {
        usedIn.push(m.name);
      }
      if (metric.formula.includes(m.id)) {
        dependsOn.push(m.name);
      }
    });

    // Check if used in strategies
    if (localStorage.getItem('bitwise_strategies')?.includes(metricId)) {
      usedIn.push('Strategy Files');
    }

    return { usedIn, dependsOn, formula: metric.formula };
  };

  const handleSelectMetric = (metric: PredefinedMetric) => {
    setSelectedMetric(metric);
    setEditForm({ ...metric });
    setIsNew(false);
  };

  const handleNewMetric = () => {
    setSelectedMetric(null);
    setEditForm({
      id: '',
      name: '',
      description: '',
      formula: '',
      unit: '',
      category: 'Custom',
    });
    setIsNew(true);
  };

  const handleSave = () => {
    if (!editForm.id || !editForm.name || !editForm.formula) {
      toast.error('ID, Name, and Formula are required');
      return;
    }

    const metric: PredefinedMetric = {
      id: editForm.id,
      name: editForm.name,
      description: editForm.description || '',
      formula: editForm.formula,
      unit: editForm.unit,
      category: editForm.category,
    };

    if (isNew) {
      predefinedManager.addMetric(metric);
      toast.success('Metric created');
    } else {
      predefinedManager.updateMetric(metric.id, metric);
      toast.success('Metric updated');
    }

    setSelectedMetric(metric);
    setIsNew(false);
  };

  const handleDelete = () => {
    if (selectedMetric) {
      predefinedManager.deleteMetric(selectedMetric.id);
      setSelectedMetric(null);
      setEditForm({});
      toast.success('Metric deleted');
    }
  };

  const categories = predefinedManager.getMetricCategories();

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {/* Left: Metric List with References */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Metrics ({metrics.length})</h3>
          <Button size="sm" variant="outline" onClick={handleNewMetric}>
            <Plus className="w-4 h-4 mr-1" />
            New
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <Accordion type="multiple" className="space-y-2">
            {categories.map(category => (
              <AccordionItem key={category} value={category} className="border rounded-lg">
                <AccordionTrigger className="px-3 py-2 text-xs hover:no-underline">
                  <span className="uppercase text-muted-foreground">{category}</span>
                </AccordionTrigger>
                <AccordionContent className="px-2 pb-2">
                  <div className="space-y-1">
                    {metrics.filter(m => m.category === category).map(metric => {
                      const refs = getMetricReferences(metric.id);
                      return (
                        <div
                          key={metric.id}
                          className={`p-2 rounded cursor-pointer transition-colors ${
                            selectedMetric?.id === metric.id
                              ? 'bg-primary/20 border border-primary'
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => handleSelectMetric(metric)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calculator className="w-4 h-4 text-purple-500" />
                              <span className="font-medium text-sm">{metric.name}</span>
                            </div>
                            {metric.unit && (
                              <Badge variant="outline" className="text-xs">{metric.unit}</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                          
                          {/* References */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {refs.usedIn.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                <Link className="w-3 h-3 mr-1" />
                                Used by {refs.usedIn.length}
                              </Badge>
                            )}
                            {refs.dependsOn.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                Depends on {refs.dependsOn.length}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      </div>

      {/* Right: Code Editor */}
      <div className="flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                {isNew ? 'New Metric' : selectedMetric?.name || 'Select a metric'}
              </div>
              <div className="flex gap-1">
                {(selectedMetric || isNew) && (
                  <>
                    <Button size="sm" variant="outline" onClick={handleSave}>
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                    {selectedMetric && (
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={handleDelete}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col space-y-3">
            {(selectedMetric || isNew) ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">ID (unique)</Label>
                    <Input
                      value={editForm.id || ''}
                      onChange={e => setEditForm({ ...editForm, id: e.target.value })}
                      placeholder="entropy"
                      disabled={!isNew}
                      className="h-8 text-sm font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Category</Label>
                    <Input
                      value={editForm.category || ''}
                      onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                      placeholder="Statistics"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={editForm.name || ''}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Shannon Entropy"
                    className="h-8 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Description</Label>
                  <Input
                    value={editForm.description || ''}
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Measures information density"
                    className="h-8 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Unit</Label>
                  <Input
                    value={editForm.unit || ''}
                    onChange={e => setEditForm({ ...editForm, unit: e.target.value })}
                    placeholder="bits"
                    className="h-8 text-sm"
                  />
                </div>

                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Formula (Code)</Label>
                  <Textarea
                    value={editForm.formula || ''}
                    onChange={e => setEditForm({ ...editForm, formula: e.target.value })}
                    placeholder="-Σ(p(x) * log₂(p(x))) for all symbols x"
                    className="flex-1 min-h-[100px] font-mono text-sm"
                  />
                </div>

                {/* Documentation for this metric */}
                {selectedMetric && (
                  <div className="p-2 bg-muted/30 rounded text-xs space-y-1">
                    <div className="flex items-center gap-1 font-medium">
                      <Info className="w-3 h-3" />
                      Reference Info
                    </div>
                    <p><span className="text-muted-foreground">Access in code:</span> <code className="text-cyan-500">get_metric("{selectedMetric.id}")</code></p>
                    <p><span className="text-muted-foreground">Returns:</span> number{selectedMetric.unit ? ` (${selectedMetric.unit})` : ''}</p>
                    {getMetricReferences(selectedMetric.id).usedIn.length > 0 && (
                      <p><span className="text-muted-foreground">Used in:</span> {getMetricReferences(selectedMetric.id).usedIn.join(', ')}</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Calculator className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Select a metric to edit or create new</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
