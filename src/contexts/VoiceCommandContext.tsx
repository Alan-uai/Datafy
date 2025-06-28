'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { VoiceCommandFloatingMic } from '@/components/shared/VoiceCommandFloatingMic';

interface VoiceCommandContextType {
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  transcript: string;
  confidence: number;
}

const VoiceCommandContext = createContext<VoiceCommandContextType | undefined>(undefined);

export function useVoiceCommand() {
  const context = useContext(VoiceCommandContext);
  if (context === undefined) {
    throw new Error('useVoiceCommand must be used within a VoiceCommandProvider');
  }
  return context;
}

export function VoiceCommandProvider({ children }: { children: React.ReactNode }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';

      recognition.onstart = () => {
        console.log('Reconhecimento de voz iniciado.');
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let finalConfidence = 0;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
            finalConfidence = result[0].confidence;
          }
        }

        if (finalTranscript) {
          setTranscript(finalTranscript);
          setConfidence(finalConfidence);
        }
      };

      recognition.onend = () => {
        console.log('Reconhecimento de voz encerrado.');
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.log('Erro no reconhecimento de voz:', event.error);
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isClient]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  if (!isClient) {
    return <>{children}</>;
  }

  return (
    <VoiceCommandContext.Provider
      value={{
        isListening,
        startListening,
        stopListening,
        transcript,
        confidence,
      }}
    >
      {children}
      <VoiceCommandFloatingMic />
    </VoiceCommandContext.Provider>
  );
}