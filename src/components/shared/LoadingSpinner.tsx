
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppLogo } from './AppLogo';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  fullPage?: boolean;
  text?: string;
}

export function LoadingSpinner({ size = 'medium', className, fullPage = false, text = 'CARREGANDO' }: LoadingSpinnerProps) {
  if (fullPage) {
    return <CustomLoadingPage text={text} />;
  }

  let sizeClass = 'h-4 w-4';
  switch (size) {
    case 'small':
      sizeClass = 'h-3 w-3';
      break;
    case 'medium':
      sizeClass = 'h-4 w-4';
      break;
    case 'large':
      sizeClass = 'h-6 w-6';
      break;
  }

  return (
    <Loader2 className={cn('animate-spin', sizeClass, className)} />
  );
}

function CustomLoadingPage({ text }: { text: string }) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black flex flex-col items-center justify-center z-50 overflow-hidden">
      {/* Background particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="mb-16 animate-float">
        <AppLogo iconSize={60} textSize="text-5xl" className="text-white drop-shadow-2xl" />
      </div>

      <div className="relative">
        {/* Loading track with text */}
        <div className="relative w-96 h-20 overflow-hidden rounded-xl bg-black/30 backdrop-blur-sm border border-cyan-500/20">
          {/* Background text - only visible through squares */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold tracking-wider text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text opacity-0">
              {text}
            </span>
          </div>
          
          {/* Visible text layer - revealed by squares */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span 
              className="text-2xl font-bold tracking-wider text-white"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, transparent 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                maskImage: 'var(--mask-gradient, linear-gradient(90deg, transparent 0%, transparent 100%))',
                WebkitMaskImage: 'var(--mask-gradient, linear-gradient(90deg, transparent 0%, transparent 100%))',
              }}
            >
              {text}
            </span>
          </div>

          {/* 5 animated squares */}
          <div className="absolute inset-0">
            {[0, 1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className="absolute w-14 h-14 bg-transparent border-2 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8),inset_0_0_20px_rgba(34,211,238,0.3)] rounded-lg backdrop-blur-sm"
                style={{
                  left: `${20 + index * 60}px`,
                  top: '12px',
                  animation: `squareAnimation 6s ease-in-out infinite ${index * 0.2}s`,
                  background: 'rgba(34, 211, 238, 0.1)',
                  maskImage: `radial-gradient(circle at center, white 40%, transparent 45%)`,
                  WebkitMaskImage: `radial-gradient(circle at center, white 40%, transparent 45%)`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes squareAnimation {
          0% { 
            transform: translateX(0px) translateY(0px) rotateZ(0deg); 
            background: rgba(34, 211, 238, 0.1);
          }
          12.5% { 
            transform: translateX(60px) translateY(-20px) rotateZ(180deg); 
            background: rgba(34, 211, 238, 0.3);
          }
          25% { 
            transform: translateX(120px) translateY(0px) rotateZ(180deg); 
            background: rgba(34, 211, 238, 0.1);
          }
          37.5% { 
            transform: translateX(180px) translateY(-20px) rotateZ(360deg); 
            background: rgba(34, 211, 238, 0.3);
          }
          50% { 
            transform: translateX(240px) translateY(0px) rotateZ(360deg); 
            background: rgba(34, 211, 238, 0.1);
          }
          62.5% { 
            transform: translateX(180px) translateY(20px) rotateZ(540deg); 
            background: rgba(34, 211, 238, 0.3);
          }
          75% { 
            transform: translateX(120px) translateY(0px) rotateZ(540deg); 
            background: rgba(34, 211, 238, 0.1);
          }
          87.5% { 
            transform: translateX(60px) translateY(20px) rotateZ(720deg); 
            background: rgba(34, 211, 238, 0.3);
          }
          100% { 
            transform: translateX(0px) translateY(0px) rotateZ(720deg); 
            background: rgba(34, 211, 238, 0.1);
          }
        }

        .animate-float { 
          animation: float 3s ease-in-out infinite; 
        }
      `}</style>
    </div>
  );
}
