import type { WidgetConfig } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, LineChartIcon, ListChecks, Zap, HelpCircle } from 'lucide-react'; // Zap for KPI, HelpCircle for generic
import { BarChart, LineChart, ResponsiveContainer } from 'recharts'; // Import recharts components

// Minimal mock data for charts
const mockLineChartData = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 700 },
];

const mockBarChartData = [
  { name: 'A', value: 20 },
  { name: 'B', value: 50 },
  { name: 'C', value: 30 },
  { name: 'D', value: 70 },
];

interface WidgetCardProps {
  widget: WidgetConfig;
}

const iconMap: Record<WidgetConfig['type'], React.ElementType> = {
  'kpi': Zap,
  'line-chart': LineChartIcon,
  'bar-chart': BarChart3,
  'tasks': ListChecks,
  'generic': HelpCircle,
};

export function WidgetCard({ widget }: WidgetCardProps) {
  const IconComponent = iconMap[widget.type] || HelpCircle;
  
  const colSpanDesktop = widget.gridSpanDesktop ? `lg:col-span-${widget.gridSpanDesktop}` : 'lg:col-span-1';
  const colSpanMobile = widget.gridSpanMobile ? `col-span-${widget.gridSpanMobile}` : 'col-span-1';

  return (
    <Card className={`${colSpanMobile} ${colSpanDesktop} flex flex-col`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium font-headline">{widget.title}</CardTitle>
        <IconComponent className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex-grow">
        {widget.type === 'kpi' && (
          <div className="text-4xl font-bold text-primary">
            {widget.data?.value || 'N/A'}
          </div>
        )}
        {widget.type === 'line-chart' && (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={widget.data || mockLineChartData}>
              <LineChartIcon type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
            </LineChart>
          </ResponsiveContainer>
        )}
        {widget.type === 'bar-chart' && (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={widget.data || mockBarChartData}>
              <BarChart3 dataKey="value" fill="hsl(var(--accent))" />
            </BarChart>
          </ResponsiveContainer>
        )}
        {widget.type === 'tasks' && (
          <ul className="space-y-2 text-sm">
            {(widget.data?.items || ['Task 1', 'Task 2', 'Task 3']).map((task: string, index: number) => (
              <li key={index} className="flex items-center">
                <ListChecks className="mr-2 h-4 w-4 text-green-500" /> {task}
              </li>
            ))}
          </ul>
        )}
        {widget.type === 'generic' && (
           <p className="text-sm text-muted-foreground">{widget.data?.content || 'Generic widget content.'}</p>
        )}
         {widget.data?.description && <CardDescription className="text-xs text-muted-foreground pt-1">{widget.data.description}</CardDescription>}
      </CardContent>
    </Card>
  );
}
