// src/components/borders/SpookyBorder.tsx
import React from 'react';

export const SpookyBorder = () => (
  <svg
    viewBox="0 0 250 250"
    className="absolute w-full h-full"
    style={{ filter: "drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.2))" }}
  >
    {/* Witch Hat */}
    <g transform="rotate(-20 100 100)">
        <path d="M 80 80 L 150 80 L 115 30 Z" fill="#3c1e69" />
        <path d="M 70 80 A 50 10 0 0 0 160 80" fill="#4a2a7e" />
        <rect x="100" y="70" width="30" height="10" fill="#6c42a6" />
    </g>
    {/* Broomstick */}
    <g transform="translate(100, 100) rotate(25)">
        <rect x="0" y="0" width="10" height="80" fill="#a0522d" />
        <path d="M -15 80 C 0 100, 10 100, 25 80 L 5 75 Z" fill="#f4a460" />
    </g>
    {/* Ghost */}
    <path d="M 40 150 Q 50 120, 60 150 T 80 150 L 75 170 L 65 165 L 55 170 L 45 165 Z" fill="rgba(255,255,255,0.8)" />
    <circle cx="55" cy="145" r="2" fill="black" />
    <circle cx="65" cy="145" r="2" fill="black" />
  </svg>
);
