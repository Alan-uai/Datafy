// src/components/borders/CatEarsBorder.tsx
import React from 'react';

export const CatEarsBorder = () => (
  <svg 
    viewBox="0 0 250 250" 
    className="absolute w-full h-full"
    style={{ filter: "drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.1))" }}
  >
    {/* Left Ear */}
    <path d="M 60,70 Q 70,30 90,65" fill="#f0c4d4" stroke="#e6a5c0" strokeWidth="3" />
    <path d="M 70,68 Q 75,45 85,63" fill="#ffffff" />
    {/* Right Ear */}
    <path d="M 190,70 Q 180,30 160,65" fill="#f0c4d4" stroke="#e6a5c0" strokeWidth="3" />
    <path d="M 180,68 Q 175,45 165,63" fill="#ffffff" />
    {/* Collar */}
    <path 
      d="M 80 200 A 45 45 0 0 0 170 200" 
      fill="none" 
      stroke="#8c5fde" 
      strokeWidth="8"
      strokeLinecap="round"
    />
    {/* Bell */}
    <circle cx="125" cy="210" r="8" fill="#ffd700" stroke="#fca503" strokeWidth="2" />
    <line x1="125" y1="211" x2="125" y2="215" stroke="#a16207" strokeWidth="1.5" />
  </svg>
);
