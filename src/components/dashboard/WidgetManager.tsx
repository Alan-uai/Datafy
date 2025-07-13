
"use client";

import React, { useMemo } from 'react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WIDGET_MAP, type AllWidgetType, type WidgetProps, type ExpiryWidgetProps } from './widgets/widget-map';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { X, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface WidgetManagerProps {
  isEditingWidgets: boolean;
  hasPremium: boolean;
  activeWidgets: AllWidgetType[];
  widgetDataProps: WidgetProps & ExpiryWidgetProps;
  onAddWidget: (id: AllWidgetType) => void;
  onRemoveWidget: (id: AllWidgetType) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

const SortableWidget = ({ id, isEditing, onRemove, children }: { id: AllWidgetType, isEditing: boolean, onRemove: (id: AllWidgetType) => void, children: React.ReactNode }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative group/widget">
            {isEditing && (
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 z-10 rounded-full bg-transparent hover:bg-destructive/20 text-destructive opacity-0 group-hover/widget:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); onRemove(id); }}>
                    <X className="h-4 w-4" />
                </Button>
            )}
            {children}
        </div>
    );
};

const AvailableWidgetCard = ({ widgetId, onAdd, isLocked, dashboardScale }: { widgetId: AllWidgetType; onAdd: () => void; isLocked: boolean; dashboardScale: 'normal' | 'compact' }) => {
    const widgetInfo = WIDGET_MAP[widgetId];
    const Icon = widgetInfo.Icon;
    return (
      <button onClick={onAdd} disabled={isLocked} className={cn("relative flex flex-col items-center justify-center text-center p-4 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors h-full w-40 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent", dashboardScale === 'compact' && 'w-auto p-2 flex-grow basis-0')}>
        {isLocked && <div className="absolute inset-0 bg-black/30 rounded-lg z-10 flex items-center justify-center"><Lock className="w-6 h-6 text-yellow-400" /></div>}
        <Icon className="h-6 w-6 mb-2" />
        <span className="text-sm font-medium">{widgetInfo.title}</span>
      </button>
    );
};

export function WidgetManager({ isEditingWidgets, hasPremium, activeWidgets, widgetDataProps, onAddWidget, onRemoveWidget, onDragEnd }: WidgetManagerProps) {
  const { toast } = useToast();
  const availableWidgets = useMemo(() => {
    const allWidgetKeys = Object.keys(WIDGET_MAP) as AllWidgetType[];
    return allWidgetKeys.filter(key => !activeWidgets.includes(key));
  }, [activeWidgets]);

  const dashboardScale = widgetDataProps.preferences?.dashboardScale || 'normal';

  const handleAddWidget = (widgetId: AllWidgetType) => {
    const widgetInfo = WIDGET_MAP[widgetId];
    if (widgetInfo.premium && !hasPremium) {
      toast({ variant: "destructive", title: "Recurso Premium", description: `O widget '${widgetInfo.title}' requer uma assinatura Premium.` });
      return;
    }
    onAddWidget(widgetId);
  };
  
  return (
    <>
      {isEditingWidgets && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Adicionar Widgets</h3>
          <ScrollArea className={cn("w-full whitespace-nowrap", dashboardScale === 'compact' && "sm:whitespace-normal")}>
            <div className={cn("flex gap-4 pb-4", dashboardScale === 'compact' && "sm:flex-wrap")}>
              {availableWidgets.map(widgetId => (
                <AvailableWidgetCard 
                  key={widgetId} 
                  widgetId={widgetId} 
                  onAdd={() => handleAddWidget(widgetId)}
                  isLocked={WIDGET_MAP[widgetId].premium && !hasPremium}
                  dashboardScale={dashboardScale}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" className={cn(dashboardScale === 'compact' && "sm:hidden")} />
          </ScrollArea>
        </div>
      )}

      <DndContext sensors={[]} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={activeWidgets} strategy={verticalListSortingStrategy}>
          <div className={cn("grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6", dashboardScale === 'compact' && 'grid-cols-2 md:grid-cols-2')}>
            {activeWidgets.map(widgetId => {
              const widgetInfo = WIDGET_MAP[widgetId];
              if (!widgetInfo || (widgetInfo.premium && !hasPremium)) return null;
              
              const WidgetComponent = widgetInfo.component;

              return (
                <SortableWidget key={widgetId} id={widgetId} isEditing={isEditingWidgets} onRemove={onRemoveWidget}>
                   {widgetInfo.id === 'expiryAttention' ? (
                        <WidgetComponent
                            listProducts={widgetDataProps.listProducts}
                            attentionHorizon={widgetDataProps.preferences.attentionHorizonDays}
                            onHorizonChange={(value: number) => widgetDataProps.savePreferences({ attentionHorizonDays: value })}
                        />
                    ) : (
                        <WidgetComponent {...widgetDataProps as any} />
                    )}
                </SortableWidget>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
}
