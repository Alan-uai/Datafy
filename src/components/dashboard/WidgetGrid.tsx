import type { WidgetConfig } from '@/types';
import { WidgetCard } from './WidgetCard';

interface WidgetGridProps {
  widgets: WidgetConfig[];
}

export function WidgetGrid({ widgets }: WidgetGridProps) {
  if (!widgets || widgets.length === 0) {
    return <p className="text-muted-foreground">No widgets to display.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {widgets.map((widget) => (
        <WidgetCard key={widget.id} widget={widget} />
      ))}
    </div>
  );
}
