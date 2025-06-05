"use client";

import { WidgetGrid } from '@/components/dashboard/WidgetGrid';
import { AiAssistant } from '@/components/dashboard/AiAssistant';
import type { WidgetConfig } from '@/types';
import { BarChart3, LineChart, ListChecks, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// Sample initial widgets
const initialWidgets: WidgetConfig[] = [
  { 
    id: 'sales-overview', 
    title: 'Sales Overview', 
    type: 'line-chart', 
    icon: LineChart,
    gridSpanDesktop: 2,
    gridSpanMobile: 2,
    data: { 
      description: "Monthly sales trend",
      // Data for chart can be fetched or passed here
    } 
  },
  { 
    id: 'active-users', 
    title: 'Active Users', 
    type: 'kpi',
    icon: Zap,
    data: { value: '1,234', description: "+5% from last week" } 
  },
  { 
    id: 'task-completion', 
    title: 'Task Completion', 
    type: 'bar-chart',
    icon: BarChart3,
    data: {
      description: "Completion rate by department"
    }
  },
  { 
    id: 'upcoming-deadlines', 
    title: 'Upcoming Deadlines', 
    type: 'tasks', 
    icon: ListChecks,
    data: {
      items: ["Project Alpha Phase 1", "Client Proposal Q3", "Team Onboarding"]
    }
  },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-2 font-headline">
        Welcome back, {user?.name || 'User'}!
      </h1>
      <p className="text-muted-foreground mb-8">Here&apos;s your personalized dashboard overview.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-semibold mb-6 font-headline">Your Widgets</h2>
          <WidgetGrid widgets={initialWidgets} />
        </div>
        <div className="lg:col-span-1">
           <h2 className="text-2xl font-semibold mb-6 font-headline">Dashboard Optimizer</h2>
          <AiAssistant />
        </div>
      </div>
    </div>
  );
}
