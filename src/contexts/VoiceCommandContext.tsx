
'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { VoiceCommandFloatingMic } from '@/components/shared/VoiceCommandFloatingMic';

interface VoiceCommandContextType {
  isListening: boolean;
  isActivated: boolean;
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
  const [isActivated, setIsActivated] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const activationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        let interimTranscript = '';
        let finalConfidence = 0;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          
          if (result.isFinal) {
            finalTranscript += transcript;
            finalConfidence = result[0].confidence;
          } else {
            interimTranscript += transcript;
          }
        }

        const fullTranscript = finalTranscript || interimTranscript;
        setTranscript(fullTranscript);
        setConfidence(finalConfidence);

        // Check for activation word "Datafy"
        if (fullTranscript.toLowerCase().includes('datafy') && !isActivated) {
          console.log('Palavra de ativação detectada: Datafy');
          setIsActivated(true);
          setTranscript('');
          
          // Set timeout to deactivate after 10 seconds
          if (activationTimeoutRef.current) {
            clearTimeout(activationTimeoutRef.current);
          }
          activationTimeoutRef.current = setTimeout(() => {
            setIsActivated(false);
          }, 10000);
        }

        // Process commands when activated
        if (isActivated && finalTranscript && !finalTranscript.toLowerCase().includes('datafy')) {
          processVoiceCommand(finalTranscript);
          setIsActivated(false);
          if (activationTimeoutRef.current) {
            clearTimeout(activationTimeoutRef.current);
          }
        }
      };

      recognition.onend = () => {
        console.log('Reconhecimento de voz encerrado.');
        setIsListening(false);
        // Auto restart if it was stopped unexpectedly
        if (isListening) {
          setTimeout(() => {
            startListening();
          }, 1000);
        }
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
      if (activationTimeoutRef.current) {
        clearTimeout(activationTimeoutRef.current);
      }
    };
  }, [isClient, isActivated, isListening]);

  const processVoiceCommand = (command: string) => {
    console.log('Processando comando:', command);
    
    // Extract product information from voice command
    const productData = extractProductFromVoice(command);
    
    if (productData) {
      // Dispatch custom event to add product
      const event = new CustomEvent('addProductFromVoice', { detail: productData });
      window.dispatchEvent(event);
    }
  };

  const extractProductFromVoice = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    // Patterns to extract product information
    const productPattern = /produto\s+([^,]+)(?:,\s*marca\s+([^,]+))?(?:,\s*(\d+)\s*unidades?)?(?:,\s*vencendo?\s*em\s*(\d+)\s*(?:do|de|\/)\s*(\d+))?/i;
    const match = lowerCommand.match(productPattern);
    
    if (match) {
      const [, produto, marca, quantidade, dia, mes] = match;
      
      let dataVencimento = null;
      if (dia && mes) {
        const currentYear = new Date().getFullYear();
        dataVencimento = new Date(currentYear, parseInt(mes) - 1, parseInt(dia));
        
        // If the date is in the past, assume it's for next year
        if (dataVencimento < new Date()) {
          dataVencimento.setFullYear(currentYear + 1);
        }
      }
      
      return {
        produto: produto.trim(),
        marca: marca ? marca.trim() : '',
        quantidade: quantidade ? parseInt(quantidade) : 1,
        dataVencimento: dataVencimento ? dataVencimento.toISOString().split('T')[0] : ''
      };
    }
    
    return null;
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Erro ao iniciar reconhecimento:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsActivated(false);
      if (activationTimeoutRef.current) {
        clearTimeout(activationTimeoutRef.current);
      }
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isClient) {
    return <>{children}</>;
  }

  return (
    <VoiceCommandContext.Provider
      value={{
        isListening,
        isActivated,
        startListening,
        stopListening,
        transcript,
        confidence,
      }}
    >
      {children}
      <VoiceCommandFloatingMic 
        isListening={isListening}
        isActivated={isActivated}
        onToggle={toggleListening}
      />
    </VoiceCommandContext.Provider>
  );
}
