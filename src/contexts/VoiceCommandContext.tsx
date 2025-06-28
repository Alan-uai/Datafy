
'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { VoiceCommandFloatingMic } from '@/components/shared/VoiceCommandFloatingMic';

interface VoiceCommandContextType {
  isListening: boolean;
  isActivated: boolean;
  toggleVoiceCommand: () => void;
  addProductFromVoice: (productData: any) => void;
  testMicrophone: () => void;
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
    // Enhanced patterns to better capture voice commands
    const patterns = [
      // Pattern 1: "adicionar produto [nome] marca [marca] [quantidade] unidades vence em [data]"
      /(?:adicionar\s+produto\s+|adicionar\s+)([^,]+?)(?:\s*,?\s*marca\s+([^,]+?))?(?:\s*,?\s*(\d+)\s*(?:unidades?|quantidade?))?(?:\s*(?:e\s*)?(?:vence\s*(?:em\s*)?|validade\s*)?(.+))?/i,
      
      // Pattern 2: "adicionar [produto], [marca], [quantidade], [dia] do [mes]"
      /adicionar\s+([^,]+),?\s*([^,]+),?\s*(\d+),?\s*(\d+)\s*do?\s*(\d+)/i,
      
      // Pattern 3: More flexible pattern for natural speech
      /adicionar\s+(.+?)(?:\s+marca\s+(.+?))?(?:\s+(\d+)\s*(?:unidades?|quantidade?))?(?:\s+(?:vence|validade)\s+(.+))?$/i,
    ];

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const match = transcript.match(pattern);
      if (match) {
        if (i === 0) { // Enhanced main pattern
          const produto = match[1]?.trim();
          const marca = match[2]?.trim() || '';
          const unidade = match[3] || '1';
          const dateText = match[4]?.trim();
          
          if (produto) {
            return {
              produto: produto,
              marca: marca,
              unidade: unidade,
              validade: dateText ? parseVoiceDate(dateText) : ''
            };
          }
        } else if (i === 1) { // Day/month pattern
          const day = match[4];
          const month = match[5];
          const year = new Date().getFullYear();
          return {
            produto: match[1].trim(),
            marca: match[2].trim(),
            unidade: match[3],
            validade: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
          };
        } else if (i === 2) { // Flexible pattern
          const produto = match[1]?.trim();
          const marca = match[2]?.trim() || '';
          const unidade = match[3] || '1';
          const dateText = match[4]?.trim();
          
          if (produto) {
            return {
              produto: produto,
              marca: marca,
              unidade: unidade,
              validade: dateText ? parseVoiceDate(dateText) : ''
            };
          }
        }
      }
    }
    return null;
  };

  const parseVoiceDate = (dateText: string): string => {
    if (!dateText) return '';
    
    const cleanText = dateText.toLowerCase().trim();
    
    // Try to extract numeric dates first (15/06, 15 de junho, etc.)
    const numericDateMatch = cleanText.match(/(\d{1,2})\s*(?:de|do|\/)?\s*(\d{1,2}|\w+)/);
    if (numericDateMatch) {
      const day = numericDateMatch[1];
      const monthOrNum = numericDateMatch[2];
      
      // Check if second part is a month name
      const monthNumber = getMonthNumber(monthOrNum);
      if (monthNumber !== '01') { // Not default value
        return `${new Date().getFullYear()}-${monthNumber}-${day.padStart(2, '0')}`;
      } else if (/^\d+$/.test(monthOrNum)) {
        // It's a numeric month
        return `${new Date().getFullYear()}-${monthOrNum.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    
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

    // Find day
    for (const [word, num] of Object.entries(numbers)) {
      if (cleanText.includes(word)) {
        day = num;
        break;
      }
    }

    // Find month
    for (const [monthName, monthNum] of Object.entries(months)) {
      if (cleanText.includes(monthName)) {
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
      'janeiro': '01', 'jan': '01',
      'fevereiro': '02', 'fev': '02',
      'março': '03', 'mar': '03',
      'abril': '04', 'abr': '04',
      'maio': '05', 'mai': '05',
      'junho': '06', 'jun': '06',
      'julho': '07', 'jul': '07',
      'agosto': '08', 'ago': '08',
      'setembro': '09', 'set': '09',
      'outubro': '10', 'out': '10',
      'novembro': '11', 'nov': '11',
      'dezembro': '12', 'dez': '12',
      // Numeric months
      '1': '01', '2': '02', '3': '03', '4': '04', '5': '05', '6': '06',
      '7': '07', '8': '08', '9': '09', '10': '10', '11': '11', '12': '12',
      '01': '01', '02': '02', '03': '03', '04': '04', '05': '05', '06': '06',
      '07': '07', '08': '08', '09': '09'
    };
    return months[monthName.toLowerCase()] || '01';
  };

  const parseDeleteCommand = (transcript: string) => {
    const patterns = [
      /apagar produto\s+(\d+)/i,
      /excluir produto\s+(\d+)/i,
      /remover produto\s+(\d+)/i,
      /deletar produto\s+(\d+)/i,
    ];

    for (const pattern of patterns) {
      const match = transcript.match(pattern);
      if (match) {
        return {
          action: 'delete',
          productId: parseInt(match[1])
        };
      }
    }
    return null;
  };

  const startVoiceRecognition = () => {
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
        // More precise activation keyword detection
        const activationVariants = [
          activationKeywordLower,
          'datafai',
          'datafi',
          'data fi',
          'data fai'
        ];
        
        const hasActivationKeyword = activationVariants.some(variant => 
          lowerCaseFinalTranscript.includes(variant)
        );
        
        if (hasActivationKeyword) {
          voiceCommandActiveModeRef.current = true;
          setIsActivated(true);
          console.log(`Palavra de ativação "${voiceActivationKeyword}" detectada. Modo de comando ativado.`);
          recognitionInstance.stop();
        }
      } else {
        const productCommand = parseProductCommand(lowerCaseFinalTranscript);
        const deleteCommand = parseDeleteCommand(lowerCaseFinalTranscript);
        
        if (productCommand) {
          console.log("Comando de produto detectado:", productCommand);
          window.dispatchEvent(new CustomEvent('addProductFromVoice', { detail: productCommand }));
          voiceCommandActiveModeRef.current = false;
          setIsActivated(false);
          recognitionInstance.stop();
        } else if (deleteCommand) {
          console.log("Comando de exclusão detectado:", deleteCommand);
          window.dispatchEvent(new CustomEvent('deleteProductFromVoice', { detail: deleteCommand }));
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

    recognitionInstance.start();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
        setIsActivated(false);
        voiceCommandActiveModeRef.current = false;
      }
    };
  };

  // Voice Command Logic - only starts when manually activated
  useEffect(() => {
    if (!voiceCommandEnabled) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
        setIsActivated(false);
        voiceCommandActiveModeRef.current = false;
      }
      return;
    }
    
    // Only start recognition if voice command is enabled AND we have all settings loaded
    if (voiceCommandEnabled && voiceActivationKeyword && typeof window !== 'undefined') {
      startVoiceRecognition();
    }
  }, [voiceCommandEnabled]);

  const toggleVoiceCommand = () => {
    const newState = !voiceCommandEnabled;
    setVoiceCommandEnabled(newState);
    localStorage.setItem('datafy-voice-command-enabled', JSON.stringify(newState));
    
    if (newState) {
      startVoiceRecognition();
    } else if (recognitionRef.current) {
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

  const testMicrophone = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Seu navegador não suporta reconhecimento de voz. Use Google Chrome.");
      return;
    }

    const testRecognition: SpeechRecognition = new (window as any).webkitSpeechRecognition();
    testRecognition.continuous = false;
    testRecognition.interimResults = false;
    testRecognition.lang = language;

    let testResult = "";

    testRecognition.onstart = () => {
      alert("Teste iniciado! Diga 'Datafy adicionar produto arroz marca pileco 5 unidades vence 15 de junho' para testar completamente.");
    };

    testRecognition.onresult = (event: SpeechRecognitionEvent) => {
      testResult = event.results[0][0].transcript;
      console.log("Transcrito:", testResult);
      
      const lowerCase = testResult.toLowerCase();
      const hasDatafy = lowerCase.includes(voiceActivationKeyword.toLowerCase());
      const hasAddCommand = lowerCase.includes("adicionar") || lowerCase.includes("adicionar produto");
      const productCommand = parseProductCommand(lowerCase);
      const deleteCommand = parseDeleteCommand(lowerCase);

      let message = `Transcrito: "${testResult}"\n\n`;
      message += `✓ Palavra de ativação "${voiceActivationKeyword}": ${hasDatafy ? 'DETECTADA' : 'NÃO DETECTADA'}\n`;
      message += `✓ Comando "adicionar": ${hasAddCommand ? 'DETECTADO' : 'NÃO DETECTADO'}\n`;
      
      if (productCommand) {
        message += `✓ Produto parseado: ${productCommand.produto}, Marca: ${productCommand.marca}, Unidades: ${productCommand.unidade}, Validade: ${productCommand.validade}\n`;
      }
      
      if (deleteCommand) {
        message += `✓ Comando de exclusão parseado: Apagar produto ID ${deleteCommand.productId}\n`;
      }

      alert(message);
    };

    testRecognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      alert(`Erro no teste: ${event.error}`);
    };

    testRecognition.start();
  };

  return (
    <VoiceCommandContext.Provider value={{
      isListening,
      isActivated,
      toggleVoiceCommand,
      addProductFromVoice,
      testMicrophone
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
