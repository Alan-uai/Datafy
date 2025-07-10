
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { LogOut, Sun, User as UserIcon, BarChart3, Settings } from 'lucide-react';
import { AppLogo } from './AppLogo';
import { useUserProfile } from '@/hooks/useUserProfile';
import { columnNames } from '../dashboard';
import { WIDGET_MAP, AllWidgetType } from '../dashboard/widgets/widget-map';

export function Header() {
  const { currentUser, logout } = useAuth();
  const { userProfile, setUserProfile, savePreferences } = useUserProfile();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const handleColumnVisibilityChange = (key: string, value: boolean) => {
    if (!userProfile) return;
    const newVisibility = { ...userProfile.preferences.columnVisibility, [key]: value };
    setUserProfile({
      ...userProfile,
      preferences: { ...userProfile.preferences, columnVisibility: newVisibility },
    });
    // This will now debounce in the hook
    savePreferences({ columnVisibility: newVisibility });
  };
  
  const handleWidgetEditing = () => {
      if (!userProfile) return;
      const isEditing = !userProfile.preferences.isEditingWidgets;
      savePreferences({ isEditingWidgets: isEditing });
  };

  // Only show dashboard controls on the dashboard page
  const showDashboardControls = pathname === '/';

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-50 flex items-center justify-between h-16 px-4 md:px-6 border-b bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link href="/">
            <AppLogo />
          </Link>
          <h1 className="text-xl font-bold hidden sm:block">
            {pathname === '/' && 'Dashboard'}
            {pathname === '/analytics' && 'Análise'}
            {pathname === '/profile' && 'Meu Perfil'}
          </h1>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          {currentUser && (
            <>
              {showDashboardControls && userProfile && (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-0 sm:mr-2" />
                        <span className="hidden sm:inline">Colunas</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Alternar Colunas</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {Object.entries(columnNames).map(([key, name]) => (
                         <DropdownMenuCheckboxItem
                           key={key}
                           className="capitalize"
                           checked={userProfile.preferences.columnVisibility[key] ?? true}
                           onCheckedChange={(value) => handleColumnVisibilityChange(key, !!value)}
                           onSelect={(e) => e.preventDefault()}
                         >
                           {name}
                         </DropdownMenuCheckboxItem>
                       ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button variant="outline" size="sm" onClick={handleWidgetEditing}>
                      <Settings className="h-4 w-4 mr-0 sm:mr-2" />
                      <span className="hidden sm:inline">{userProfile.preferences.isEditingWidgets ? "Finalizar" : "Widgets"}</span>
                  </Button>
                </>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                   <Button variant="ghost" size="icon" onClick={() => router.push('/analytics')}>
                      <BarChart3 className="h-5 w-5" />
                   </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Análise</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/profile">
                    <Avatar className="h-9 w-9 cursor-pointer border-2 border-primary/50 hover:border-primary transition-colors">
                      <AvatarImage src={currentUser.photoURL || ''} alt={currentUser.displayName || 'User Avatar'} />
                      <AvatarFallback className="bg-primary/20 text-primary font-bold">
                        {getInitials(currentUser.displayName, currentUser.email)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Meu Perfil</p>
                </TooltipContent>
              </Tooltip>

               <Tooltip>
                <TooltipTrigger asChild>
                   <Button variant="ghost" size="icon" onClick={handleLogout} className="text-red-500 hover:text-red-500 hover:bg-red-500/10">
                      <LogOut className="h-5 w-5" />
                   </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sair</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </header>
    </TooltipProvider>
  );
}
