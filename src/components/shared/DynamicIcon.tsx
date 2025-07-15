
"use client";

import * as Icons from 'lucide-react';

// A mapping from string names to Lucide icon components
const iconMap: { [key: string]: React.ComponentType<any> } = {
  User: Icons.User,
  Mail: Icons.Mail,
  Calendar: Icons.Calendar,
  Edit3: Icons.Edit3,
  Save: Icons.Save,
  X: Icons.X,
  LogOut: Icons.LogOut,
  Settings: Icons.Settings,
  Shield: Icons.Shield,
  Sparkles: Icons.Sparkles,
  Trophy: Icons.Trophy,
  Target: Icons.Target,
  MapPin: Icons.MapPin,
  Phone: Icons.Phone,
  Globe: Icons.Globe,
  Camera: Icons.Camera,
  Heart: Icons.Heart,
  Star: Icons.Star,
  Zap: Icons.Zap,
  Lock: Icons.Lock,
  Bell: Icons.Bell,
  Palette: Icons.Palette,
  Moon: Icons.Moon,
  Sun: Icons.Sun,
  Music: Icons.Music,
  Eye: Icons.Eye,
  Smartphone: Icons.Smartphone,
  Crown: Icons.Crown,
  Package: Icons.Package,
  BarChart3: Icons.BarChart3,
  ShoppingCart: Icons.ShoppingCart,
  List: Icons.List,
  CalendarCheck: Icons.CalendarCheck,
  BarChart: Icons.BarChart,
  Edit: Icons.Edit,
  Trash2: Icons.Trash2,
  Beer: Icons.Beer,
  Refrigerator: Icons.Refrigerator,
  Snowflake: Icons.Snowflake,
  Weight: Icons.Weight,
  Apple: Icons.Apple,
  Carrot: Icons.Carrot,
  Milk: Icons.Milk,
  Bot: Icons.Bot,
  Space: Icons.Sparkles, // Using Sparkles as a placeholder for Space
  Cherry: Icons.Leaf, // Using Leaf as a placeholder for Cherry
  Waves: Icons.Waves,
  Sunset: Icons.Sunset,
  Trees: Icons.Trees,
  Rocket: Icons.Rocket,
  DraftingCompass: Icons.DraftingCompass,
  SunMoon: Icons.SunMoon,
  Flame: Icons.Flame,
  Wind: Icons.Wind,
  Mountain: Icons.Mountain,
  Paintbrush: Icons.Paintbrush,
  // Add other icons as needed
};

interface DynamicIconProps extends Icons.LucideProps {
  name: string;
}

export const DynamicIcon = ({ name, ...props }: DynamicIconProps) => {
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    // Fallback icon
    return <Icons.HelpCircle {...props} />;
  }

  return <IconComponent {...props} />;
};
