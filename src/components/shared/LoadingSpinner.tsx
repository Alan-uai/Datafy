import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  text = 'Carregando', 
  className 
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center min-h-[200px]", className)}>
      <div className="relative mb-4">
        {/* Container for the squares */}
        <div className="flex space-x-1">
          {[0, 1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-sm shadow-lg"
              style={{
                animation: `squareMove 2s ease-in-out infinite`,
                animationDelay: `${index * 0.2}s`,
                transform: 'perspective(100px)',
              }}
            />
          ))}
        </div>

        {/* Text mask effect */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span 
            className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"
            style={{
              backgroundImage: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'textReveal 2s ease-in-out infinite',
            }}
          >
            {text}
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes squareMove {
          0%, 20% {
            transform: translateX(0) translateY(0) rotateY(0deg);
          }
          25% {
            transform: translateX(80px) translateY(-20px) rotateY(180deg);
          }
          50% {
            transform: translateX(80px) translateY(0) rotateY(180deg);
          }
          75% {
            transform: translateX(0) translateY(20px) rotateY(360deg);
          }
          100% {
            transform: translateX(0) translateY(0) rotateY(360deg);
          }
        }

        @keyframes textReveal {
          0%, 20% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
};