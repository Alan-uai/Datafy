import { LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

interface AppLogoProps {
  className?: string;
  iconSize?: number;
  textSize?: string;
}

export function AppLogo({ className, iconSize = 24, textSize = "text-2xl" }: AppLogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <LayoutDashboard size={iconSize} className="text-primary" />
      <span className={`font-semibold ${textSize} text-foreground`}>Dashify</span>
    </Link>
  );
}
