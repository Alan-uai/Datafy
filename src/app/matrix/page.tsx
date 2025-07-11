
"use client";

import { cn } from "@/lib/utils";

export default function MatrixPage() {
  return (
    <div
      className={cn(
        "matrix",
        "fixed inset-0 w-full h-full"
      )}
    >
        <div className="w-full h-full" style={{
            position: 'relative',
            backgroundImage: `
                radial-gradient(ellipse at 50% 50%, hsla(120,80%,50%,0.2) 0%, transparent 40%),
                linear-gradient(transparent 50%, hsla(120, 80%, 30%, 0.8) 100%)
            `,
            backgroundSize: '100% 100%, 2px 200px',
            animation: 'matrix-rain 5s linear infinite',
            willChange: 'background-position'
        }}>
        </div>
    </div>
  );
}
