export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string; 
}

export type WidgetType = 'kpi' | 'line-chart' | 'bar-chart' | 'tasks' | 'generic';

export interface WidgetConfig {
  id: string;
  title: string;
  type: WidgetType;
  data?: any; 
  gridSpanDesktop?: number; // 1 to 4 for col-span on desktop
  gridSpanMobile?: number; // 1 to 2 for col-span on mobile
  icon?: React.ElementType; // Lucide icon component
}
