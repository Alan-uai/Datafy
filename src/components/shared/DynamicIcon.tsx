import * as LucideIcons from 'lucide-react';
import React from 'react';
import { LucideIcon } from 'lucide-react';
import * as Icons from 'lucide-react';
import {
  Plus,
  PlusCircle,
  ListPlus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  X,
  Check,
  Home,
  User,
  Settings,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
  Mail,
  Phone,
  MapPin,
  Globe,
  Link,
  Share,
  Copy,
  Save,
  Refresh,
  LogOut,
  Menu,
  Bell,
  Bookmark,
  Flag,
  Tag,
  Folder,
  File,
  Image,
  Video,
  Music,
  Archive,
  Lock,
  Unlock,
  Shield,
  Key,
  Database,
  Server,
  Cloud,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Move,
  Crop,
  Scissors,
  Clipboard,
  Type,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  Layers,
  PieChart,
  BarChart,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Sun,
  Moon,
  CloudRain,
  Snowflake,
  Thermometer,
  Wind,
  Compass,
  Navigation,
  Map,
  Camera,
  Mic,
  MicOff,
  Headphones,
  Speaker,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Printer,
  HardDrive,
  Cpu,
  MemoryStick,
  Usb,
  Power,
  Plug,
  Package,
  ShoppingCart,
  Heart,
  Star,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  MoreVertical,
  Info,
  AlertCircle,
  Minus,
  Download,
  Upload,
  Eye,
  EyeOff,
  LucideIcon
} from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

const iconMap: Record<string, keyof typeof Icons> = {
  'Star': 'Star',
  'Trophy': 'Trophy',
  'Zap': 'Zap',
  'Crown': 'Crown',
  'Package': 'Package',
  'Target': 'Target',
  'Settings': 'Settings',
};

// Export all available icon names from lucide-react
export const iconNames = Object.keys(Icons).filter(
  key => 
    key !== 'createLucideIcon' && 
    key !== 'icons' && 
    typeof Icons[key as keyof typeof Icons] === 'object' &&
    key[0] === key[0].toUpperCase() // Ensure it's a PascalCase component name
);

export function DynamicIcon({ name, className, size = 16 }: DynamicIconProps) {
  const iconName = iconMap[name] || name;
  const IconComponent = (Icons as any)[iconName] as LucideIcon;

  if (!IconComponent) {
    return <Icons.HelpCircle className={className} size={size} />;
  }

  return <IconComponent className={className} size={size} />;
}