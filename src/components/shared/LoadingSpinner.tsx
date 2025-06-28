
<old_str>import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
 size?: 'small' | 'medium' | 'large'; // Define tamanhos comuns se aplicável
 className?: string;
}

export function LoadingSpinner({ size = 'medium', className }: LoadingSpinnerProps) {
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
    // Adicione outros tamanhos conforme necessário
  }

  return (
    <Loader2 className={cn('animate-spin', sizeClass, className)} />
  );
}</old_str>
<new_str>import { Loader2 } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
      <div className="mb-16">
        <AppLogo iconSize={60} textSize="text-5xl" className="text-white" />
      </div>
      
      <div className="relative">
        {/* Loading track with text */}
        <div className="relative w-80 h-16 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xl font-bold tracking-wider">
            CARREGANDO
          </div>
          
          {/* Animated squares */}
          <div className="absolute inset-0">
            {[0, 1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className={`absolute w-12 h-12 border-2 border-cyan-400 bg-transparent shadow-[0_0_20px_rgba(34,211,238,0.6)] animate-square-${index + 1}`}
                style={{
                  animationDelay: `${index * 0.8}s`,
                  animationDuration: '4s',
                  animationIterationCount: 'infinite',
                  animationTimingFunction: 'ease-in-out'
                }}
              />
            ))}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes square-1 {
          0%, 20% { transform: translateX(0px) translateY(16px); }
          25% { transform: translateX(20px) translateY(8px); }
          30% { transform: translateX(40px) translateY(16px); }
          35% { transform: translateX(60px) translateY(8px); }
          40% { transform: translateX(80px) translateY(16px); }
          50% { transform: translateX(100px) translateY(16px); }
          60% { transform: translateX(120px) translateY(8px); }
          70% { transform: translateX(140px) translateY(16px); }
          80% { transform: translateX(160px) translateY(8px); }
          90% { transform: translateX(180px) translateY(16px); }
          100% { transform: translateX(320px) translateY(16px); }
        }
        
        @keyframes square-2 {
          0%, 20% { transform: translateX(20px) translateY(16px); }
          25% { transform: translateX(0px) translateY(24px); }
          30% { transform: translateX(20px) translateY(16px); }
          35% { transform: translateX(40px) translateY(24px); }
          40% { transform: translateX(60px) translateY(16px); }
          50% { transform: translateX(80px) translateY(16px); }
          60% { transform: translateX(100px) translateY(24px); }
          70% { transform: translateX(120px) translateY(16px); }
          80% { transform: translateX(140px) translateY(24px); }
          90% { transform: translateX(160px) translateY(16px); }
          100% { transform: translateX(340px) translateY(16px); }
        }
        
        @keyframes square-3 {
          0%, 20% { transform: translateX(40px) translateY(16px); }
          25% { transform: translateX(60px) translateY(24px); }
          30% { transform: translateX(80px) translateY(16px); }
          35% { transform: translateX(100px) translateY(8px); }
          40% { transform: translateX(120px) translateY(16px); }
          50% { transform: translateX(140px) translateY(16px); }
          60% { transform: translateX(160px) translateY(24px); }
          70% { transform: translateX(180px) translateY(16px); }
          80% { transform: translateX(200px) translateY(8px); }
          90% { transform: translateX(220px) translateY(16px); }
          100% { transform: translateX(360px) translateY(16px); }
        }
        
        @keyframes square-4 {
          0%, 20% { transform: translateX(60px) translateY(16px); }
          25% { transform: translateX(80px) translateY(8px); }
          30% { transform: translateX(100px) translateY(16px); }
          35% { transform: translateX(120px) translateY(24px); }
          40% { transform: translateX(140px) translateY(16px); }
          50% { transform: translateX(160px) translateY(16px); }
          60% { transform: translateX(180px) translateY(8px); }
          70% { transform: translateX(200px) translateY(16px); }
          80% { transform: translateX(220px) translateY(24px); }
          90% { transform: translateX(240px) translateY(16px); }
          100% { transform: translateX(380px) translateY(16px); }
        }
        
        @keyframes square-5 {
          0%, 20% { transform: translateX(80px) translateY(16px); }
          25% { transform: translateX(100px) translateY(24px); }
          30% { transform: translateX(120px) translateY(16px); }
          35% { transform: translateX(140px) translateY(8px); }
          40% { transform: translateX(160px) translateY(16px); }
          50% { transform: translateX(180px) translateY(16px); }
          60% { transform: translateX(200px) translateY(24px); }
          70% { transform: translateX(220px) translateY(16px); }
          80% { transform: translateX(240px) translateY(8px); }
          90% { transform: translateX(260px) translateY(16px); }
          100% { transform: translateX(400px) translateY(16px); }
        }
        
        .animate-square-1 { animation: square-1 4s ease-in-out infinite; }
        .animate-square-2 { animation: square-2 4s ease-in-out infinite; }
        .animate-square-3 { animation: square-3 4s ease-in-out infinite; }
        .animate-square-4 { animation: square-4 4s ease-in-out infinite; }
        .animate-square-5 { animation: square-5 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}</new_str>
