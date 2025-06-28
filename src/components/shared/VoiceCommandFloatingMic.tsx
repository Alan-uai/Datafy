
import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceCommandFloatingMicProps {
  isListening: boolean;
  isActivated: boolean;
  onToggle: () => void;
}

export const VoiceCommandFloatingMic: React.FC<VoiceCommandFloatingMicProps> = ({
  isListening,
  isActivated,
  onToggle
}) => {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={onToggle}
        className={cn(
          "relative w-14 h-14 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110",
          "flex items-center justify-center",
          isActivated 
            ? "bg-green-500 hover:bg-green-600 animate-pulse" 
            : isListening 
              ? "bg-blue-500 hover:bg-blue-600 animate-bounce" 
              : "bg-gray-500 hover:bg-gray-600"
        )}
      >
        {isListening ? (
          <Mic className="h-6 w-6 text-white" />
        ) : (
          <MicOff className="h-6 w-6 text-white" />
        )}
        
        {isActivated && (
          <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
        )}
        
        {isListening && !isActivated && (
          <div className="absolute inset-0 rounded-full bg-blue-400 animate-pulse opacity-50" />
        )}
      </button>
      
      {isActivated && (
        <div className="absolute bottom-16 right-0 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          Comando ativo - fale agora
        </div>
      )}
      
      {isListening && !isActivated && (
        <div className="absolute bottom-16 right-0 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          Diga "Datafy" para ativar
        </div>
      )}
    </div>
  );
};
