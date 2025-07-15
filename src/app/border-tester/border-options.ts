// src/app/border-tester/border-options.ts
import { Cat, Bird, Crown, Heart, Ghost, Bot, Shell, Gamepad2 } from 'lucide-react';
import type { FC } from 'react';

// Importa os componentes de borda
import { CatEarsBorder } from '@/components/borders/CatEarsBorder';
import { AngelWingsBorder } from '@/components/borders/AngelWingsBorder';
import { RoyalCrownBorder } from '@/components/borders/RoyalCrownBorder';
import { SpookyBorder } from '@/components/borders/SpookyBorder';
import { GamerBorder } from '@/components/borders/GamerBorder';

interface BorderOption {
  id: string;
  label: string;
  icon: FC<any>;
  component: FC<any>;
  animationColor: string;
}

export const BORDER_OPTIONS: BorderOption[] = [
  {
    id: 'cat-ears',
    label: 'Orelhas de Gato',
    icon: Cat,
    component: CatEarsBorder,
    animationColor: 'hsl(300, 100%, 80%)', // Pinkish
  },
  {
    id: 'angel-wings',
    label: 'Asas de Anjo',
    icon: Bird,
    component: AngelWingsBorder,
    animationColor: 'hsl(200, 100%, 80%)', // Light Blue
  },
  {
    id: 'royal-crown',
    label: 'Coroa Real',
    icon: Crown,
    component: RoyalCrownBorder,
    animationColor: 'hsl(50, 100%, 70%)', // Gold
  },
  {
    id: 'spooky',
    label: 'Assustador',
    icon: Ghost,
    component: SpookyBorder,
    animationColor: 'hsl(270, 100%, 80%)', // Purple
  },
  {
    id: 'gamer',
    label: 'Gamer',
    icon: Gamepad2,
    component: GamerBorder,
    animationColor: 'hsl(120, 100%, 70%)', // Green
  },
];
