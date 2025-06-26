import * as LucideIcons from 'lucide-react';
import React from 'react';

const iconNames = Object.keys(LucideIcons).filter(key => key !== 'createLucideIcon' && key !== 'icons' && typeof LucideIcons[key as keyof typeof LucideIcons] === 'object');

const DynamicIcon = ({ name, ...props }: { name: string } & LucideIcons.LucideProps) => {
  const IconComponent = LucideIcons[name as keyof typeof LucideIcons] as LucideIcons.LucideIcon;
  if (!IconComponent || typeof IconComponent !== 'function') {
    console.warn(`DynamicIcon: Icon "${name}" not found or is not a valid component. Using default.`);
    return <LucideIcons.ListChecks {...props} />;
  }

  try {
    return <IconComponent {...props} />;
  } catch (e) {
    console.error(`Error rendering DynamicIcon with name: ${name}`, e);
    return <LucideIcons.ListChecks {...props} />;
  }
};

export { DynamicIcon, iconNames };
