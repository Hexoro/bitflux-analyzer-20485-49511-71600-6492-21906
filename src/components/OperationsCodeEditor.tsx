/**
 * Operations Code Editor - Write and edit operation definitions with full documentation
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
  Cog,
  Save,
  Plus,
  Trash2,
  Code,
  Info,
  Link,
  Variable,
} from 'lucide-react';
import { toast } from 'sonner';
import { predefinedManager, PredefinedOperation } from '@/lib/predefinedManager';

interface OperationReference {
  usedIn: string[];
  costInScoring?: number;
  policies: string[];
}

export const OperationsCodeEditor = () => {
  const [selectedOp, setSelectedOp] = useState<PredefinedOperation | null>(null);
  const [editForm, setEditForm] = useState<Partial<PredefinedOperation>>({});
  const [paramInput, setParamInput] = useState({ name: '', type: '', description: '' });
  const [isNew, setIsNew] = useState(false);
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const unsubscribe = predefinedManager.subscribe(() => forceUpdate({}));
    return unsubscribe;
  }, []);

  const operations = predefinedManager.getAllOperations();

  const getOperationReferences = (opId: string): OperationReference => {
    const usedIn: string[] = [];
    const policies: string[] = [];
    let costInScoring: number | undefined;

    // Check strategy files
    try {
      const strategies = localStorage.getItem('bitwise_strategies');
      if (strategies?.includes(opId)) {
        usedIn.push('Strategy Files');
      }

      // Check scoring files for cost
      const scoring = localStorage.getItem('bitwise_scoring_lua');
      if (scoring) {
        const parsed = JSON.parse(scoring);
        for (const file of parsed) {
          const costMatch = file.content.match(new RegExp(`${opId}\\s*=\\s*(\\d+)`));
          if (costMatch) {
            costInScoring = parseInt(costMatch[1]);
          }
        }
      }

      // Check policy files
      const policiesData = localStorage.getItem('bitwise_policies');
      if (policiesData) {
        const parsed = JSON.parse(policiesData);
        for (const file of parsed) {
          if (file.content.includes(opId)) {
            policies.push(file.name);
          }
        }
      }
    } catch (e) {
      // Ignore parse errors
    }

    return { usedIn, costInScoring, policies };
  };

  const handleSelectOp = (op: PredefinedOperation) => {
    setSelectedOp(op);
    setEditForm({ ...op });
    setIsNew(false);
  };

  const handleNewOp = () => {
    setSelectedOp(null);
    setEditForm({
      id: '',
      name: '',
      description: '',
      parameters: [],
      category: 'Custom',
    });
    setIsNew(true);
  };

  const handleAddParam = () => {
    if (!paramInput.name || !paramInput.type) {
      toast.error('Parameter name and type required');
      return;
    }

    setEditForm({
      ...editForm,
      parameters: [...(editForm.parameters || []), { ...paramInput }],
    });
    setParamInput({ name: '', type: '', description: '' });
  };

  const handleRemoveParam = (index: number) => {
    setEditForm({
      ...editForm,
      parameters: editForm.parameters?.filter((_, i) => i !== index),
    });
  };

  const handleSave = () => {
    if (!editForm.id || !editForm.name) {
      toast.error('ID and Name are required');
      return;
    }

    const op: PredefinedOperation = {
      id: editForm.id,
      name: editForm.name,
      description: editForm.description || '',
      parameters: editForm.parameters || [],
      category: editForm.category,
    };

    if (isNew) {
      predefinedManager.addOperation(op);
      toast.success('Operation created');
    } else {
      predefinedManager.updateOperation(op.id, op);
      toast.success('Operation updated');
    }

    setSelectedOp(op);
    setIsNew(false);
  };

  const handleDelete = () => {
    if (selectedOp) {
      predefinedManager.deleteOperation(selectedOp.id);
      setSelectedOp(null);
      setEditForm({});
      toast.success('Operation deleted');
    }
  };

  const categories = predefinedManager.getOperationCategories();

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {/* Left: Operation List with References */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Operations ({operations.length})</h3>
          <Button size="sm" variant="outline" onClick={handleNewOp}>
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
                    {operations.filter(op => op.category === category).map(op => {
                      const refs = getOperationReferences(op.id);
                      return (
                        <div
                          key={op.id}
                          className={`p-2 rounded cursor-pointer transition-colors ${
                            selectedOp?.id === op.id
                              ? 'bg-primary/20 border border-primary'
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => handleSelectOp(op)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono text-xs">{op.id}</Badge>
                              <span className="text-sm">{op.name}</span>
                            </div>
                            {refs.costInScoring !== undefined && (
                              <Badge className="bg-cyan-500/20 text-cyan-500 text-xs">
                                Cost: {refs.costInScoring}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{op.description}</p>
                          
                          {/* Parameters */}
                          {op.parameters && op.parameters.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {op.parameters.map((p, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {p.name}: {p.type}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* References */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {refs.usedIn.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                <Link className="w-3 h-3 mr-1" />
                                Used
                              </Badge>
                            )}
                            {refs.policies.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                In {refs.policies.length} policies
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

      {/* Right: Editor */}
      <div className="flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Cog className="w-4 h-4" />
                {isNew ? 'New Operation' : selectedOp?.name || 'Select an operation'}
              </div>
              <div className="flex gap-1">
                {(selectedOp || isNew) && (
                  <>
                    <Button size="sm" variant="outline" onClick={handleSave}>
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                    {selectedOp && (
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={handleDelete}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto space-y-3">
            {(selectedOp || isNew) ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">ID (uppercase)</Label>
                    <Input
                      value={editForm.id || ''}
                      onChange={e => setEditForm({ ...editForm, id: e.target.value.toUpperCase() })}
                      placeholder="XOR"
                      disabled={!isNew}
                      className="h-8 text-sm font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Category</Label>
                    <Input
                      value={editForm.category || ''}
                      onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                      placeholder="Logic Gates"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={editForm.name || ''}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="XOR Gate"
                    className="h-8 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    value={editForm.description || ''}
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Bitwise exclusive OR operation"
                    className="text-sm min-h-[60px]"
                  />
                </div>

                {/* Parameters */}
                <div className="space-y-2">
                  <Label className="text-xs">Parameters</Label>
                  
                  {editForm.parameters && editForm.parameters.length > 0 && (
                    <div className="space-y-1">
                      {editForm.parameters.map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                          <div className="flex items-center gap-2">
                            <Variable className="w-3 h-3" />
                            <span className="font-mono">{p.name}</span>
                            <Badge variant="outline">{p.type}</Badge>
                            <span className="text-muted-foreground">{p.description}</span>
                          </div>
                          <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => handleRemoveParam(i)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Input
                      value={paramInput.name}
                      onChange={e => setParamInput({ ...paramInput, name: e.target.value })}
                      placeholder="name"
                      className="h-7 text-xs flex-1"
                    />
                    <Input
                      value={paramInput.type}
                      onChange={e => setParamInput({ ...paramInput, type: e.target.value })}
                      placeholder="type"
                      className="h-7 text-xs w-20"
                    />
                    <Input
                      value={paramInput.description}
                      onChange={e => setParamInput({ ...paramInput, description: e.target.value })}
                      placeholder="description"
                      className="h-7 text-xs flex-1"
                    />
                    <Button size="sm" variant="outline" className="h-7" onClick={handleAddParam}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Documentation */}
                {selectedOp && (
                  <div className="p-2 bg-muted/30 rounded text-xs space-y-1">
                    <div className="flex items-center gap-1 font-medium">
                      <Info className="w-3 h-3" />
                      Usage in Code
                    </div>
                    <p>
                      <code className="text-cyan-500">
                        apply_operation("{selectedOp.id}"
                        {selectedOp.parameters && selectedOp.parameters.length > 0 && 
                          `, {${selectedOp.parameters.map(p => `"${p.name}": value`).join(', ')}}`
                        })
                      </code>
                    </p>
                    <p><span className="text-muted-foreground">Check allowed:</span> <code className="text-cyan-500">is_operation_allowed("{selectedOp.id}")</code></p>
                    <p><span className="text-muted-foreground">Get cost:</span> <code className="text-cyan-500">get_cost("{selectedOp.id}")</code></p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Cog className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Select an operation to edit or create new</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
