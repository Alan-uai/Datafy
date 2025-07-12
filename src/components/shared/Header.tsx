
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { LogOut, BarChart3, Settings } from 'lucide-react';
import { AppLogo } from './AppLogo';
import { ThemeToggleButton } from './ThemeToggleButton';

export function Header() {
  const { currentUser, logout, userProfile } = useAuth();
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
  
  const hasPremium = !!userProfile?.premium;

  const AnalyticsButton = () => (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={() => hasPremium && router.push('/analytics')}
      disabled={!hasPremium}
      className={!hasPremium ? 'opacity-50 cursor-not-allowed' : ''}
    >
      <BarChart3 className="h-5 w-5" />
    </Button>
  );

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-50 flex items-center justify-between h-16 px-4 md:px-6 border-b bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link href="/">
            <AppLogo />
          </Link>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          {currentUser && (
            <>
              <ThemeToggleButton />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => router.push('/settings')}>
                    <Settings className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Configurações</p>
                </TooltipContent>
              </Tooltip>
            
              <Tooltip>
                <TooltipTrigger asChild>
                   <AnalyticsButton/>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Análise {hasPremium ? '' : '(Premium)'}</p>
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
