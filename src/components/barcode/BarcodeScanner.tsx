
"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { BrowserMultiFormatReader, NotFoundException, ChecksumException, FormatException } from '@zxing/library';

interface BarcodeScannerProps {
  onScanSuccess: (data: string) => void;
  onScanError: (message: string) => void;
  isScanning: boolean;
  setIsScanning: (isScanning: boolean) => void;
}

export function BarcodeScanner({ onScanSuccess, onScanError, isScanning, setIsScanning }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const animationFrameIdRef = useRef<number | null>(null);
  const decodingRef = useRef(false);
  const permissionStatusRef = useRef<PermissionState | null>(null);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    // Ensure codeReaderRef.current exists and has a reset method before calling it
    if (codeReaderRef.current && typeof codeReaderRef.current.reset === 'function') {
      codeReaderRef.current.reset();
    }
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    decodingRef.current = false;
  }, []);

  useEffect(() => {
    if (!codeReaderRef.current) {
      codeReaderRef.current = new BrowserMultiFormatReader(undefined, 50);
    }
    return () => {
      cleanupStream();
    };
  }, [cleanupStream]);

  useEffect(() => {
    const requestCameraPermissionAndStart = async () => {
      if (!isScanning) {
        cleanupStream();
        return;
      }

      setIsLoading(true);
      setHasCameraPermission(null); 
      decodingRef.current = false;

      if (!videoRef.current) {
          console.error("Video element ref not available during permission request.");
          onScanError("Elemento de vídeo não está pronto.");
          setHasCameraPermission(false);
          setIsLoading(false);
          return;
      }
      if (!codeReaderRef.current) {
          console.error("CodeReader ref not available during permission request.");
          onScanError("Leitor de código não está pronto.");
          setHasCameraPermission(false);
          setIsLoading(false);
          return;
      }

      try {
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
            permissionStatusRef.current = cameraPermission.state;
            
            cameraPermission.onchange = () => {
              permissionStatusRef.current = cameraPermission.state;
              if (cameraPermission.state === 'denied' && isScanning) {
                setHasCameraPermission(false);
                onScanError('A permissão da câmera foi revogada.');
                toast({ variant: 'destructive', title: 'Permissão Revogada', description: 'O acesso à câmera foi revogado nas configurações.'});
                cleanupStream();
                setIsScanning(false); 
              } else if (cameraPermission.state === 'granted' && isScanning && hasCameraPermission === false) {
                 setHasCameraPermission(null); 
              }
            };

            if (cameraPermission.state === 'denied') {
              setHasCameraPermission(false);
              onScanError('A permissão da câmera foi negada. Habilite nas configurações do navegador.');
              toast({ variant: 'destructive', title: 'Permissão Negada', description: 'Acesso à câmera negado. Verifique as configurações do seu navegador.' });
              setIsLoading(false);
              cleanupStream();
              return;
            }

          } catch (e) {
            console.warn("Permissions API query failed:", e);
          }
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
            if (!videoRef.current) return; // Defensive check after play
            setHasCameraPermission(true); 
          } catch (playError) {
            console.error("Error playing video:", playError);
            setHasCameraPermission(false); 
            const errorTitle = 'Erro ao Iniciar Câmera';
            const errorMessage = playError instanceof Error ? playError.message : 'Não foi possível reproduzir o feed da câmera.';
            onScanError(`Falha ao iniciar a visualização da câmera: ${errorMessage}`);
            toast({ variant: 'destructive', title: errorTitle, description: errorMessage });
            cleanupStream(); 
            setIsLoading(false); 
            return; 
          }
        } else {
           setHasCameraPermission(false);
           throw new Error("Video element reference became null unexpectedly.");
        }

      } catch (error) { 
        console.error('Error accessing or preparing camera:', error);
        setHasCameraPermission(false); 
        let title = 'Acesso à Câmera Negado';
        let description = 'Permissão da câmera negada. Por favor, habilite o acesso à câmera nas configurações do seu navegador e recarregue a página.';
        
        if (error instanceof Error) {
          if (error.name === "OverconstrainedError" || error.name === "ConstraintNotSatisfiedError") {
            title = 'Problema com a Resolução';
            description = "Não foi possível usar a resolução ideal da câmera. Verifique se outra aplicação está usando a câmera ou tente uma resolução menor.";
            try {
                const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                streamRef.current = fallbackStream;
                if (videoRef.current) {
                    videoRef.current.srcObject = fallbackStream;
                    await videoRef.current.play();
                    if (!videoRef.current) return; // Defensive check after play
                    setHasCameraPermission(true); 
                    toast({ title: 'Usando Câmera Reserva', description: 'Não foi possível usar a resolução ideal, usando configurações padrão da câmera.' });
                    setIsLoading(false); 
                    return; 
                } else {
                  setHasCameraPermission(false);
                }
            } catch (fallbackError) {
                console.error('Error accessing camera with fallback constraints:', fallbackError);
                setHasCameraPermission(false);
            }
          } else if (error.name === "NotFoundError") {
            title = 'Câmera Não Encontrada';
            description = 'Nenhuma câmera compatível foi encontrada no seu dispositivo.';
          } else { 
            title = 'Erro na Câmera';
            description = `Ocorreu um erro ao tentar acessar a câmera: ${error.message}`;
          }
        }
        onScanError(description);
        toast({ variant: 'destructive', title, description });
        cleanupStream();
      } finally {
        setIsLoading(false);
      }
    };

    if (isScanning) {
      requestCameraPermissionAndStart();
    } else {
      cleanupStream();
    }
    
    return () => { 
      cleanupStream();
    };
  }, [isScanning, onScanError, toast, cleanupStream, setIsScanning, hasCameraPermission]); 


  useEffect(() => {
    if (!isScanning || decodingRef.current || !videoRef.current || videoRef.current.readyState < videoRef.current.HAVE_METADATA || videoRef.current.paused || !hasCameraPermission || !codeReaderRef.current || !streamRef.current || isLoading) {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      return;
    }

    const videoElement = videoRef.current;
    const codeReader = codeReaderRef.current;

    const decodeLoop = async () => {
      if (decodingRef.current || !isScanning || !videoElement || videoElement.readyState < videoElement.HAVE_METADATA || videoElement.paused) {
        if (isScanning && !decodingRef.current && videoElement && (videoElement.readyState >= videoElement.HAVE_METADATA) && !videoElement.paused) {
            animationFrameIdRef.current = requestAnimationFrame(decodeLoop);
        }
        return;
      }

      decodingRef.current = true;
      try {
        if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
          const result = await codeReader.decodeOnceFromVideoElement(videoElement); 
          if (result && isScanning) { 
            onScanSuccess(result.getText());
            decodingRef.current = false; 
            return; 
          }
        }
      } catch (error) {
        if (error instanceof NotFoundException) {
        } else if (error instanceof ChecksumException || error instanceof FormatException) {
        } else {
        }
      }
      decodingRef.current = false;
      if (isScanning) { 
        animationFrameIdRef.current = requestAnimationFrame(decodeLoop);
      }
    };
    
    const onCanPlay = () => {
      if (videoElement.videoWidth > 0 && isScanning && !animationFrameIdRef.current && !decodingRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(decodeLoop);
      }
    };

    videoElement.addEventListener('canplay', onCanPlay);
    videoElement.addEventListener('loadedmetadata', onCanPlay); 
    videoElement.addEventListener('playing', onCanPlay); 

    if (videoElement.readyState >= videoElement.HAVE_ENOUGH_DATA && !videoElement.paused && videoElement.videoWidth > 0 && isScanning && !animationFrameIdRef.current && !decodingRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(decodeLoop);
    }

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      if (videoElement) { 
        videoElement.removeEventListener('canplay', onCanPlay);
        videoElement.removeEventListener('loadedmetadata', onCanPlay);
        videoElement.removeEventListener('playing', onCanPlay);
      }
      decodingRef.current = false; 
    };
  }, [isScanning, hasCameraPermission, isLoading, onScanSuccess, onScanError]); 


  if (!isScanning && hasCameraPermission !== false) {
    return null;
  }

  return (
    <div className="relative w-full aspect-[4/3] bg-muted rounded-md overflow-hidden border">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline 
        muted 
        autoPlay 
      />
      
      {isScanning && isLoading && ( 
         <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            {permissionStatusRef.current === 'prompt' || hasCameraPermission === null ? "Solicitando permissão da câmera..." : "Iniciando câmera..."}
        </div>
      )}

      {hasCameraPermission === false && ( 
        <div className="absolute inset-0 flex items-center justify-center p-4 bg-background/90">
            <Alert variant="destructive" className="w-full">
                <AlertTitle>Acesso à Câmera Necessário ou Falha ao Iniciar</AlertTitle>
                <AlertDescription>
                Não foi possível iniciar a câmera. Verifique as permissões no seu navegador e se outra aplicação está utilizando a câmera. Recarregue a página para tentar novamente.
                </AlertDescription>
            </Alert>
        </div>
      )}
    </div>
  );
}

    

    