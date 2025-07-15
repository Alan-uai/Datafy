// src/components/borders/RoyalCrownBorder.tsx
import React from 'react';

export const RoyalCrownBorder = () => (
  <svg
    viewBox="0 0 250 250"
    className="absolute w-full h-full"
    style={{ filter: "drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.1))" }}
  >
    {/* Crown Base */}
    <path d="M 90 60 Q 125 50 160 60 L 170 80 L 80 80 Z" fill="#ffd700" stroke="#fca503" strokeWidth="2" />
    {/* Crown Spikes */}
    <path d="M 90 60 L 100 40 L 110 60" fill="#ffd700" stroke="#fca503" strokeWidth="2" />
    <path d="M 115 60 L 125 35 L 135 60" fill="#ffd700" stroke="#fca503" strokeWidth="2" />
    <path d="M 140 60 L 150 40 L 160 60" fill="#ffd700" stroke="#fca503" strokeWidth="2" />
    {/* Jewels */}
    <circle cx="105" cy="70" r="4" fill="#ff0000" />
    <circle cx="125" cy="65" r="5" fill="#0000ff" />
    <circle cx="145" cy="70" r="4" fill="#00ff00" />
    {/* Wings */}
    <path d="M 60 150 C 20 120, 40 80, 80 100 S 100 180, 60 150 Z" fill="#f0f0f0" stroke="#ccc" strokeWidth="2" transform="translate(-10, 0)" />
    <path d="M 190 150 C 230 120, 210 80, 170 100 S 150 180, 190 150 Z" fill="#f0f0f0" stroke="#ccc" strokeWidth="2" transform="translate(10, 0)" />
  </svg>
);
