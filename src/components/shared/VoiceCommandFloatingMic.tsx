

'use client';

import React from 'react';
import { Mic, MicOff, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <>
      {/* Voice Command Button - positioned to not overlap with FAB */}
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={onToggle}
          className={cn(
            "relative w-12 h-12 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110",
            "flex items-center justify-center",
            isActivated 
              ? "bg-green-500 hover:bg-green-600 animate-pulse shadow-green-500/50" 
              : isListening 
                ? "bg-blue-500 hover:bg-blue-600" 
                : "bg-gray-600 hover:bg-gray-700"
          )}
          aria-label={isListening ? "Parar comando de voz" : "Iniciar comando de voz"}
        >
          {isListening ? (
            <Mic className="h-5 w-5 text-white" />
          ) : (
            <MicOff className="h-5 w-5 text-white" />
          )}
          
          {isActivated && (
            <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
          )}
          
          {isListening && !isActivated && (
            <div className="absolute inset-0 rounded-full bg-blue-400 animate-pulse opacity-50" />
          )}
        </button>
      </div>

      {/* Voice Command Footer Overlay */}
      <AnimatePresence>
        {isActivated && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-green-600 to-green-500 text-white p-4 shadow-lg"
          >
            <div className="container mx-auto flex items-center justify-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                <MessageSquare className="h-5 w-5" />
                <span className="font-medium">Comando ativo - fale agora</span>
              </div>
            </div>
            <div className="text-center text-sm opacity-90 mt-2">
              Exemplo: "produto arroz, marca Pileco, 78 unidades, vencendo em 23 do 7"
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Listening Status - Small indicator */}
      <AnimatePresence>
        {isListening && !isActivated && (
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            className="fixed bottom-20 left-4 z-40 bg-black bg-opacity-80 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap"
          >
            Diga "Datafy" para ativar comandos
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

