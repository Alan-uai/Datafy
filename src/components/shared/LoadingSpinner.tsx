import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppLogo } from './AppLogo';

interface LoadingSpinnerProps {
 size?: 'small' | 'medium' | 'large';
 className?: string;
 fullPage?: boolean;
}

export function LoadingSpinner({ size = 'medium', className, fullPage = false }: LoadingSpinnerProps) {
  if (fullPage) {
    return <CustomLoadingPage />;
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

function CustomLoadingPage() {
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
        <div className="relative w-80 h-16 overflow-hidden rounded-xl bg-black/30 backdrop-blur-sm border border-cyan-500/20">
          <div className="absolute inset-0 flex items-center justify-center text-white/30 text-xl font-bold tracking-wider">
            CARREGANDO
          </div>

          {/* Animated squares */}
          <div className="absolute inset-0">
            {[0, 1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className="absolute w-12 h-12 border-2 border-cyan-400 bg-transparent shadow-[0_0_20px_rgba(34,211,238,0.6)] rounded-lg animate-square"
                style={{
                  animationDelay: `${index * 0.8}s`,
                  animationDuration: '4s',
                  animationIterationCount: 'infinite',
                  animationTimingFunction: 'ease-in-out',
                  left: `${index * 20}px`,
                  top: '16px'
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

        @keyframes square {
          0%, 20% { transform: translateX(0px) translateY(0px); }
          25% { transform: translateX(20px) translateY(-8px); }
          30% { transform: translateX(40px) translateY(0px); }
          35% { transform: translateX(60px) translateY(-8px); }
          40% { transform: translateX(80px) translateY(0px); }
          50% { transform: translateX(100px) translateY(0px); }
          60% { transform: translateX(120px) translateY(-8px); }
          70% { transform: translateX(140px) translateY(0px); }
          80% { transform: translateX(160px) translateY(-8px); }
          90% { transform: translateX(180px) translateY(0px); }
          100% { transform: translateX(320px) translateY(0px); }
        }

        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-square { animation: square 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}