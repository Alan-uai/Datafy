import { Dashboard } from "@/components/dashboard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Home as HomeIcon, Settings, BarChart, Sun, Database, Grid3x3 } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 flex items-center justify-between h-16 px-4 md:px-6 border-b bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Grid3x3 className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Datafy</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Sun className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <HomeIcon className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <BarChart className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
          <Avatar className="h-9 w-9 border-2 border-primary">
            <AvatarFallback className="bg-primary text-primary-foreground">A</AvatarFallback>
          </Avatar>
        </div>
      </header>
      <main className="flex-1">
        <Dashboard />
      </main>
    </div>
  );
}
