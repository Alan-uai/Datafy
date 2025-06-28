
'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { VoiceCommandFloatingMic } from '@/components/shared/VoiceCommandFloatingMic';

interface VoiceCommandContextType {
  isListening: boolean;
  isActivated: boolean;
  toggleVoiceCommand: () => void;
  addProductFromVoice: (productData: any) => void;
}

const VoiceCommandContext = createContext<VoiceCommandContextType | undefined>(undefined);

export const useVoiceCommand = () => {
  const context = useContext(VoiceCommandContext);
  if (!context) {
    throw new Error('useVoiceCommand must be used within a VoiceCommandProvider');
  }
  return context;
};

export const VoiceCommandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isListening, setIsListening] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [voiceCommandEnabled, setVoiceCommandEnabled] = useState(false);
  const [voiceActivationKeyword, setVoiceActivationKeyword] = useState('datafy');
  const [auditoryFeedback, setAuditoryFeedback] = useState(true);
  const [language, setLanguage] = useState('pt-BR');
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const voiceCommandActiveModeRef = useRef(false);

  // Load settings from localStorage
  useEffect(() => {
    const loadSetting = <T,>(key: string, setter: React.Dispatch<React.SetStateAction<T>>, parser: (value: string) => T, defaultValue: T) => {
      const savedValue = localStorage.getItem(key);
      if (savedValue !== null) {
        setter(parser(savedValue));
      } else {
        setter(defaultValue);
      }
    };

    loadSetting('datafy-voice-command-enabled', setVoiceCommandEnabled, JSON.parse, false);
    loadSetting('datafy-voice-activation-keyword', setVoiceActivationKeyword, (v) => v, 'datafy');
    loadSetting('datafy-auditory-feedback', setAuditoryFeedback, JSON.parse, true);
    loadSetting('datafy-language', setLanguage, (v) => v, 'pt-BR');
  }, []);

  const parseProductCommand = (transcript: string) => {
    const patterns = [
      /adicionar produto\s+([^,]+),?\s*marca\s+([^,]+),?\s*(\d+)\s*unidades?\s*e?\s*vence\s*em\s+(.+)/i,
      /adicionar\s+([^,]+),?\s*([^,]+),?\s*(\d+),?\s*(\d+)\s*do?\s*(\d+)/i,
      /adicionar\s+([^\s]+)\s*marca\s+([^\s]+)\s*(\d+)\s*unidades?\s*vence\s*(\d+)\s*de\s*(\w+)/i,
    ];

    for (const pattern of patterns) {
      const match = transcript.match(pattern);
      if (match) {
        if (pattern === patterns[0]) {
          return {
            produto: match[1].trim(),
            marca: match[2].trim(),
            unidade: match[3],
            validade: parseVoiceDate(match[4])
          };
        } else if (pattern === patterns[1]) {
          const day = match[4];
          const month = match[5];
          const year = new Date().getFullYear();
          return {
            produto: match[1].trim(),
            marca: match[2].trim(),
            unidade: match[3],
            validade: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
          };
        } else if (pattern === patterns[2]) {
          const day = match[4];
          const monthName = match[5];
          const monthNumber = getMonthNumber(monthName);
          const year = new Date().getFullYear();
          return {
            produto: match[1].trim(),
            marca: match[2].trim(),
            unidade: match[3],
            validade: `${year}-${monthNumber.padStart(2, '0')}-${day.padStart(2, '0')}`
          };
        }
      }
    }
    return null;
  };

  const parseVoiceDate = (dateText: string): string => {
    const numbers = {
      'um': '1', 'dois': '2', 'três': '3', 'quatro': '4', 'cinco': '5',
      'seis': '6', 'sete': '7', 'oito': '8', 'nove': '9', 'dez': '10',
      'onze': '11', 'doze': '12', 'treze': '13', 'quatorze': '14', 'quinze': '15',
      'dezesseis': '16', 'dezessete': '17', 'dezoito': '18', 'dezenove': '19',
      'vinte': '20', 'vinte e um': '21', 'vinte e dois': '22', 'vinte e três': '23',
      'vinte e quatro': '24', 'vinte e cinco': '25', 'vinte e seis': '26',
      'vinte e sete': '27', 'vinte e oito': '28', 'vinte e nove': '29',
      'trinta': '30', 'trinta e um': '31'
    };

    const months = {
      'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04',
      'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
      'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
    };

    let day = '';
    let month = '';
    const year = new Date().getFullYear();

    for (const [word, num] of Object.entries(numbers)) {
      if (dateText.includes(word)) {
        day = num;
        break;
      }
    }

    for (const [monthName, monthNum] of Object.entries(months)) {
      if (dateText.includes(monthName)) {
        month = monthNum;
        break;
      }
    }

    if (day && month) {
      return `${year}-${month}-${day.padStart(2, '0')}`;
    }

    return '';
  };

  const getMonthNumber = (monthName: string): string => {
    const months: { [key: string]: string } = {
      'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04',
      'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
      'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
    };
    return months[monthName.toLowerCase()] || '01';
  };

  // Voice Command Logic
  useEffect(() => {
    if (!voiceCommandEnabled || !('webkitSpeechRecognition' in window)) {
      return;
    }

    const recognitionInstance: SpeechRecognition = new (window as any).webkitSpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = language;
    recognitionRef.current = recognitionInstance;

    recognitionInstance.onstart = () => {
      setIsListening(true);
      console.log("Reconhecimento de voz iniciado.");
    };

    recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
      const finalTranscript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');

      const lowerCaseFinalTranscript = finalTranscript.toLowerCase().trim();
      const activationKeywordLower = voiceActivationKeyword.toLowerCase().trim();

      if (!voiceCommandActiveModeRef.current) {
        if (lowerCaseFinalTranscript.includes(activationKeywordLower)) {
          voiceCommandActiveModeRef.current = true;
          setIsActivated(true);
          console.log(`Palavra de ativação "${voiceActivationKeyword}" detectada. Modo de comando ativado.`);
          recognitionInstance.stop();
        }
      } else {
        const productCommand = parseProductCommand(lowerCaseFinalTranscript);
        if (productCommand) {
          console.log("Comando de produto detectado:", productCommand);
          // Dispatch custom event with product data
          window.dispatchEvent(new CustomEvent('addProductFromVoice', { detail: productCommand }));
          voiceCommandActiveModeRef.current = false;
          setIsActivated(false);
          recognitionInstance.stop();
        } else if (lowerCaseFinalTranscript.includes("parar de ouvir") || lowerCaseFinalTranscript.includes("cancelar")) {
          voiceCommandActiveModeRef.current = false;
          setIsActivated(false);
          recognitionInstance.stop();
        }
      }
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
      if (voiceCommandEnabled && !voiceCommandActiveModeRef.current) {
        setTimeout(() => {
          if (recognitionRef.current && voiceCommandEnabled) {
            recognitionInstance.start();
          }
        }, 1000);
      } else if (voiceCommandActiveModeRef.current) {
        setTimeout(() => {
          if (recognitionRef.current && voiceCommandEnabled) {
            recognitionInstance.start();
          }
        }, 500);
      }
    };

    recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Erro no reconhecimento de voz:", event.error);
      setIsListening(false);
      setIsActivated(false);
      voiceCommandActiveModeRef.current = false;
      if (event.error === 'no-speech' && voiceCommandEnabled) {
        setTimeout(() => {
          if (recognitionRef.current) {
            recognitionInstance.start();
          }
        }, 1000);
      }
    };

    if (voiceCommandEnabled) {
      recognitionInstance.start();
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
        setIsActivated(false);
        voiceCommandActiveModeRef.current = false;
      }
    };
  }, [voiceCommandEnabled, voiceActivationKeyword, auditoryFeedback, language]);

  const toggleVoiceCommand = () => {
    const newState = !voiceCommandEnabled;
    setVoiceCommandEnabled(newState);
    localStorage.setItem('datafy-voice-command-enabled', JSON.stringify(newState));
    
    if (!newState && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      setIsActivated(false);
      voiceCommandActiveModeRef.current = false;
    }
  };

  const addProductFromVoice = (productData: any) => {
    // This function can be called by components that need to handle voice-added products
    console.log('Product added from voice:', productData);
  };

  return (
    <VoiceCommandContext.Provider value={{
      isListening,
      isActivated,
      toggleVoiceCommand,
      addProductFromVoice
    }}>
      {children}
      {voiceCommandEnabled && (
        <VoiceCommandFloatingMic
          isListening={isListening}
          isActivated={isActivated}
          onToggle={toggleVoiceCommand}
        />
      )}
    </VoiceCommandContext.Provider>
  );
};
