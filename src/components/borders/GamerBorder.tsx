// src/components/borders/GamerBorder.tsx
import React from 'react';

export const GamerBorder = () => (
  <svg
    viewBox="0 0 250 250"
    className="absolute w-full h-full"
    style={{ filter: "drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.1))" }}
  >
    {/* Headset Band */}
    <path
      d="M 60 50 A 65 65 0 0 1 190 50"
      fill="none"
      stroke="#333"
      strokeWidth="10"
      strokeLinecap="round"
    />
    {/* Left Earcup */}
    <rect x="45" y="50" width="30" height="50" rx="10" fill="#444" stroke="#555" strokeWidth="2" />
    <circle cx="60" cy="75" r="8" fill="#00ff00" />
    {/* Right Earcup */}
    <rect x="175" y="50" width="30" height="50" rx="10" fill="#444" stroke="#555" strokeWidth="2" />
    <circle cx="190" cy="75" r="8" fill="#00ff00" />
    {/* Bottom Controller */}
    <path d="M 90 220 L 70 200 H 180 L 160 220 Z" fill="#333" />
    {/* D-Pad */}
    <rect x="80" y="202" width="5" height="15" fill="#555" />
    <rect x="75" y="207" width="15" height="5" fill="#555" />
     {/* Buttons */}
    <circle cx="160" cy="205" r="4" fill="#ff0000" />
    <circle cx="170" cy="212" r="4" fill="#0000ff" />
  </svg>
);
