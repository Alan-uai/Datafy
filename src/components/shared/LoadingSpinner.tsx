
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
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `twinkle ${2 + Math.random() * 3}s infinite ${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* 3D Floating Logo */}
      <div className="mb-16 relative">
        <div 
          className="animate-float-3d"
          style={{
            transformStyle: 'preserve-3d',
          }}
        >
          <AppLogo iconSize={60} textSize="text-5xl" className="text-white drop-shadow-2xl" />
        </div>
        
        {/* Holographic glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-blue-500/20 to-purple-500/20 blur-xl animate-pulse" />
      </div>

      {/* Loading Animation with 5 Squares */}
      <div className="relative">
        <div className="relative w-96 h-20 overflow-hidden rounded-xl bg-black/50 backdrop-blur-lg border border-cyan-500/30 shadow-2xl">
          {/* Background grid effect */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(34,211,238,0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(34,211,238,0.3) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}
          />
          
          {/* Text that gets revealed by squares */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span 
              className="text-2xl font-bold tracking-wider text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text"
              style={{
                filter: 'brightness(0)',
              }}
            >
              {text}
            </span>
          </div>

          {/* Moving squares that reveal the text */}
          <div className="absolute inset-0">
            {[0, 1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className="absolute w-14 h-14 rounded-lg"
                style={{
                  left: `${20 + index * 60}px`,
                  top: '12px',
                  background: `
                    linear-gradient(45deg, 
                      rgba(34, 211, 238, 0.8), 
                      rgba(59, 130, 246, 0.8), 
                      rgba(147, 51, 234, 0.8)
                    )
                  `,
                  boxShadow: `
                    0 0 30px rgba(34, 211, 238, 0.8),
                    inset 0 0 30px rgba(255, 255, 255, 0.2),
                    0 0 60px rgba(59, 130, 246, 0.6)
                  `,
                  border: '2px solid rgba(34, 211, 238, 0.5)',
                  animation: `squareReveal 6s ease-in-out infinite ${index * 0.3}s`,
                  maskImage: 'radial-gradient(circle at center, white 45%, transparent 50%)',
                  WebkitMaskImage: 'radial-gradient(circle at center, white 45%, transparent 50%)',
                  backdropFilter: 'blur(10px)',
                }}
              />
            ))}
          </div>

          {/* Reveal effect overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span 
              className="text-2xl font-bold tracking-wider text-white mix-blend-screen"
              style={{
                maskImage: 'var(--square-mask, none)',
                WebkitMaskImage: 'var(--square-mask, none)',
              }}
            >
              {text}
            </span>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mt-6 w-96 bg-gray-800/50 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full animate-loading-progress"
          />
        </div>
      </div>

      {/* Floating 3D elements */}
      <div className="absolute top-20 left-20 w-16 h-16 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-lg animate-float-slow transform-gpu" 
           style={{ transform: 'rotateX(45deg) rotateY(45deg)' }} />
      
      <div className="absolute bottom-20 right-20 w-12 h-12 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full animate-float-reverse transform-gpu" 
           style={{ transform: 'rotateX(-30deg) rotateZ(30deg)' }} />

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        @keyframes float-3d {
          0%, 100% { 
            transform: translateY(0px) rotateX(0deg) rotateY(0deg); 
          }
          25% { 
            transform: translateY(-10px) rotateX(5deg) rotateY(5deg); 
          }
          50% { 
            transform: translateY(-15px) rotateX(0deg) rotateY(10deg); 
          }
          75% { 
            transform: translateY(-5px) rotateX(-5deg) rotateY(5deg); 
          }
        }

        @keyframes squareReveal {
          0% { 
            transform: translateX(0px) translateY(0px) rotateZ(0deg) scale(0.8);
            opacity: 0.5;
          }
          12.5% { 
            transform: translateX(60px) translateY(-25px) rotateZ(180deg) scale(1.1);
            opacity: 1;
          }
          25% { 
            transform: translateX(120px) translateY(0px) rotateZ(180deg) scale(1);
            opacity: 0.8;
          }
          37.5% { 
            transform: translateX(180px) translateY(-25px) rotateZ(360deg) scale(1.1);
            opacity: 1;
          }
          50% { 
            transform: translateX(240px) translateY(0px) rotateZ(360deg) scale(1);
            opacity: 0.8;
          }
          62.5% { 
            transform: translateX(180px) translateY(25px) rotateZ(540deg) scale(1.1);
            opacity: 1;
          }
          75% { 
            transform: translateX(120px) translateY(0px) rotateZ(540deg) scale(1);
            opacity: 0.8;
          }
          87.5% { 
            transform: translateX(60px) translateY(25px) rotateZ(720deg) scale(1.1);
            opacity: 1;
          }
          100% { 
            transform: translateX(0px) translateY(0px) rotateZ(720deg) scale(0.8);
            opacity: 0.5;
          }
        }

        @keyframes loading-progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }

        @keyframes float-slow {
          0%, 100% { 
            transform: translateY(0px) rotateX(45deg) rotateY(45deg); 
          }
          50% { 
            transform: translateY(-20px) rotateX(45deg) rotateY(225deg); 
          }
        }

        @keyframes float-reverse {
          0%, 100% { 
            transform: translateY(0px) rotateX(-30deg) rotateZ(30deg); 
          }
          50% { 
            transform: translateY(15px) rotateX(-30deg) rotateZ(210deg); 
          }
        }

        .animate-float-3d { 
          animation: float-3d 4s ease-in-out infinite; 
        }
        
        .animate-float-slow { 
          animation: float-slow 8s ease-in-out infinite; 
        }
        
        .animate-float-reverse { 
          animation: float-reverse 6s ease-in-out infinite; 
        }
        
        .animate-loading-progress {
          animation: loading-progress 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
