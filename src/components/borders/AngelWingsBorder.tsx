// src/components/borders/AngelWingsBorder.tsx
import React from 'react';

export const AngelWingsBorder = () => (
  <svg
    viewBox="0 0 250 250"
    className="absolute w-full h-full"
    style={{ filter: "drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.1))" }}
  >
    {/* Left Wing */}
    <path
      d="M 60 125 C 20 100, 20 50, 70 50 S 110 100, 60 125 Z"
      fill="white"
      stroke="#a7d8f9"
      strokeWidth="3"
      transform="translate(-30, 20) rotate(-15 60 125)"
    />
    <path
      d="M 65 145 C 25 120, 25 70, 75 70 S 115 120, 65 145 Z"
      fill="white"
      stroke="#a7d8f9"
      strokeWidth="3"
      transform="translate(-35, 10) rotate(-10 65 145)"
    />
    {/* Right Wing */}
    <path
      d="M 190 125 C 230 100, 230 50, 180 50 S 140 100, 190 125 Z"
      fill="white"
      stroke="#a7d8f9"
      strokeWidth="3"
      transform="translate(30, 20) rotate(15 190 125)"
    />
    <path
      d="M 185 145 C 225 120, 225 70, 175 70 S 135 120, 185 145 Z"
      fill="white"
      stroke="#a7d8f9"
      strokeWidth="3"
      transform="translate(35, 10) rotate(10 185 145)"
    />
    {/* Halo/Heart */}
    <path
      d="M 125 210 C 110 200, 100 215, 125 230 C 150 215, 140 200, 125 210 Z"
      fill="#a7d8f9"
      stroke="#ffffff"
      strokeWidth="2"
    />
  </svg>
);
