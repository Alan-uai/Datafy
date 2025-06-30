
"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Eye, 
  EyeOff,
  GripVertical,
  RotateCcw,
  Palette
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { TableLayout, CustomColumn } from '@/types';
import { 
  getTableLayouts, 
  createTableLayout, 
  updateTableLayout, 
  deleteTableLayout,
  setDefaultLayout,
  getDefaultColumns
} from '@/services/tableLayoutService';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface TableLayoutManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currentLayout: TableLayout | null;
  onLayoutChange: (layout: TableLayout) => void;
}

export function TableLayoutManager({ 
  isOpen, 
  onClose, 
  currentLayout, 
  onLayoutChange 
}: TableLayoutManagerProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [layouts, setLayouts] = useState<TableLayout[]>([]);
  const [selectedLayout, setSelectedLayout] = useState<TableLayout | null>(currentLayout);
  const [editingColumns, setEditingColumns] = useState<CustomColumn[]>([]);
  const [newLayoutName, setNewLayoutName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isEditingColumns, setIsEditingColumns] = useState(false);

  const columnTypes = [
    { value: 'text', label: 'Texto' },
    { value: 'number', label: 'Número' },
    { value: 'currency', label: 'Monetário' },
    { value: 'date', label: 'Data' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'select', label: 'Seleção' }
  ];

  useEffect(() => {
    if (isOpen && currentUser?.uid) {
      loadLayouts();
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (selectedLayout) {
      setEditingColumns([...selectedLayout.columns]);
    }
  }, [selectedLayout]);

  const loadLayouts = async () => {
    if (!currentUser?.uid) return;
    
    try {
      const userLayouts = await getTableLayouts(currentUser.uid);
      setLayouts(userLayouts);
      
      if (!selectedLayout && userLayouts.length > 0) {
        const defaultLayout = userLayouts.find(l => l.isDefault) || userLayouts[0];
        setSelectedLayout(defaultLayout);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os layouts."
      });
    }
  };

  const handleCreateLayout = async () => {
    if (!currentUser?.uid || !newLayoutName.trim()) return;

    try {
      const defaultColumns = getDefaultColumns();
      const layoutId = await createTableLayout(
        currentUser.uid,
        newLayoutName.trim(),
        defaultColumns,
        layouts.length === 0 // First layout is default
      );

      const newLayout: TableLayout = {
        id: layoutId,
        name: newLayoutName.trim(),
        userId: currentUser.uid,
        isDefault: layouts.length === 0,
        columns: defaultColumns,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setLayouts([newLayout, ...layouts]);
      setSelectedLayout(newLayout);
      setNewLayoutName('');
      setIsCreatingNew(false);

      toast({
        title: "Layout criado",
        description: `Layout "${newLayoutName}" foi criado com sucesso.`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar o layout."
      });
    }
  };

  const handleSaveColumns = async () => {
    if (!selectedLayout || !currentUser?.uid) return;

    try {
      await updateTableLayout(selectedLayout.id, {
        columns: editingColumns
      });

      const updatedLayout = {
        ...selectedLayout,
        columns: editingColumns,
        updatedAt: new Date()
      };

      setLayouts(layouts.map(l => l.id === selectedLayout.id ? updatedLayout : l));
      setSelectedLayout(updatedLayout);
      setIsEditingColumns(false);

      toast({
        title: "Colunas atualizadas",
        description: "As configurações das colunas foram salvas."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar as configurações."
      });
    }
  };

  const handleSetDefault = async (layout: TableLayout) => {
    if (!currentUser?.uid) return;

    try {
      await setDefaultLayout(currentUser.uid, layout.id);
      
      setLayouts(layouts.map(l => ({
        ...l,
        isDefault: l.id === layout.id
      })));

      onLayoutChange({ ...layout, isDefault: true });

      toast({
        title: "Layout padrão definido",
        description: `"${layout.name}" é agora seu layout padrão.`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível definir o layout padrão."
      });
    }
  };

  const handleDeleteLayout = async (layoutId: string) => {
    try {
      await deleteTableLayout(layoutId);
      const updatedLayouts = layouts.filter(l => l.id !== layoutId);
      setLayouts(updatedLayouts);
      
      if (selectedLayout?.id === layoutId) {
        setSelectedLayout(updatedLayouts[0] || null);
      }

      toast({
        title: "Layout excluído",
        description: "O layout foi removido com sucesso."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir o layout."
      });
    }
  };

  const handleAddColumn = () => {
    const newColumn: CustomColumn = {
      id: `custom_${Date.now()}`,
      name: 'Nova Coluna',
      type: 'text',
      order: editingColumns.length,
      visible: true
    };
    setEditingColumns([...editingColumns, newColumn]);
  };

  const handleUpdateColumn = (index: number, updates: Partial<CustomColumn>) => {
    const updated = [...editingColumns];
    updated[index] = { ...updated[index], ...updates };
    setEditingColumns(updated);
  };

  const handleRemoveColumn = (index: number) => {
    const updated = editingColumns.filter((_, i) => i !== index);
    setEditingColumns(updated);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(editingColumns);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    setEditingColumns(updatedItems);
  };

  const handleResetToDefault = () => {
    setEditingColumns(getDefaultColumns());
    toast({
      title: "Colunas resetadas",
      description: "As colunas foram restauradas para o padrão."
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Gerenciar Layouts de Tabela
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh]">
          {/* Layouts List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Layouts Salvos</h3>
              <Button
                size="sm"
                onClick={() => setIsCreatingNew(true)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Novo
              </Button>
            </div>

            {isCreatingNew && (
              <Card className="p-3">
                <div className="space-y-2">
                  <Input
                    placeholder="Nome do layout"
                    value={newLayoutName}
                    onChange={(e) => setNewLayoutName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleCreateLayout}>
                      <Save className="w-4 h-4 mr-1" />
                      Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsCreatingNew(false);
                        setNewLayoutName('');
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            <div className="space-y-2 overflow-y-auto max-h-96">
              {layouts.map(layout => (
                <Card
                  key={layout.id}
                  className={`p-3 cursor-pointer transition-colors ${
                    selectedLayout?.id === layout.id
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedLayout(layout)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{layout.name}</span>
                        {layout.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            Padrão
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {layout.columns.filter(c => c.visible).length} colunas visíveis
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {!layout.isDefault && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetDefault(layout);
                          }}
                        >
                          <Palette className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLayout(layout.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Column Editor */}
          {selectedLayout && (
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  Colunas - {selectedLayout.name}
                </h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleResetToDefault}
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Resetar
                  </Button>
                  {isEditingColumns ? (
                    <Button size="sm" onClick={handleSaveColumns}>
                      <Save className="w-4 h-4 mr-1" />
                      Salvar
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => setIsEditingColumns(true)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  )}
                </div>
              </div>

              <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                {isEditingColumns ? (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="columns">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                          {editingColumns.map((column, index) => (
                            <Draggable key={column.id} draggableId={column.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="flex items-center gap-2 p-2 bg-muted/50 rounded border"
                                >
                                  <div {...provided.dragHandleProps}>
                                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                                  </div>

                                  <Checkbox
                                    checked={column.visible}
                                    onCheckedChange={(checked) =>
                                      handleUpdateColumn(index, { visible: !!checked })
                                    }
                                  />

                                  <Input
                                    value={column.name}
                                    onChange={(e) =>
                                      handleUpdateColumn(index, { name: e.target.value })
                                    }
                                    className="flex-1"
                                  />

                                  <Select
                                    value={column.type}
                                    onValueChange={(value) =>
                                      handleUpdateColumn(index, { type: value as any })
                                    }
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {columnTypes.map(type => (
                                        <SelectItem key={type.value} value={type.value}>
                                          {type.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>

                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleRemoveColumn(index)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                ) : (
                  <div className="space-y-2">
                    {selectedLayout.columns
                      .sort((a, b) => a.order - b.order)
                      .map(column => (
                        <div
                          key={column.id}
                          className="flex items-center gap-2 p-2 bg-muted/50 rounded"
                        >
                          {column.visible ? (
                            <Eye className="w-4 h-4 text-green-500" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className="flex-1 font-medium">{column.name}</span>
                          <Badge variant="outline">
                            {columnTypes.find(t => t.value === column.type)?.label}
                          </Badge>
                        </div>
                      ))}
                  </div>
                )}

                {isEditingColumns && (
                  <Button
                    onClick={handleAddColumn}
                    className="w-full mt-4"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Coluna
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
