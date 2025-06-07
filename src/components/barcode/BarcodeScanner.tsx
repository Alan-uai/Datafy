
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
    if (codeReaderRef.current && typeof codeReaderRef.current.reset === 'function') {
      codeReaderRef.current.reset();
    } else if (codeReaderRef.current) {
      console.warn("Cleanup: codeReaderRef.current exists but .reset is not a function. Object:", codeReaderRef.current);
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
      // Set to null initially, will be updated by permission query or getUserMedia
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
        // 1. Query permission status
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
            permissionStatusRef.current = cameraPermission.state;
            
            cameraPermission.onchange = () => {
              permissionStatusRef.current = cameraPermission.state;
              // If permission changes to denied while active, reflect this
              if (cameraPermission.state === 'denied' && isScanning) {
                setHasCameraPermission(false);
                onScanError('A permissão da câmera foi revogada.');
                toast({ variant: 'destructive', title: 'Permissão Revogada', description: 'O acesso à câmera foi revogado nas configurações.'});
                cleanupStream();
                setIsScanning(false); // Stop scanning if permission is revoked
              } else if (cameraPermission.state === 'granted' && isScanning && hasCameraPermission === false) {
                 // If permission was denied and now granted, try to restart
                 setHasCameraPermission(null); // Will re-trigger the effect or parts of it
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
            // If 'granted' or 'prompt', we will proceed to getUserMedia
            // If 'granted', hasCameraPermission will effectively be true soon.
            // If 'prompt', getUserMedia will trigger it.
            setHasCameraPermission(cameraPermission.state === 'granted'); // Tentatively set based on query

          } catch (e) {
            console.warn("Permissions API query failed:", e);
            // Fallback to just trying getUserMedia if query fails
            // hasCameraPermission remains null or its current state
          }
        }

        // Proceed with getUserMedia. It will prompt only if permissionStatus is 'prompt'.
        // If permissionStatus was 'granted', this will succeed without a prompt.
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
            setHasCameraPermission(true); // Final confirmation: permission granted AND video is playing
          } catch (playError) {
            console.error("Error playing video:", playError);
            setHasCameraPermission(false); // Crucial if play fails
            const errorTitle = 'Erro ao Iniciar Câmera';
            const errorMessage = playError instanceof Error ? playError.message : 'Não foi possível reproduzir o feed da câmera.';
            onScanError(`Falha ao iniciar a visualização da câmera: ${errorMessage}`);
            toast({ variant: 'destructive', title: errorTitle, description: errorMessage });
            cleanupStream(); 
            // Error will be re-thrown by the outer catch, or handled if we don't re-throw from here
            // For now, let the finally block handle isLoading
            return; // Exit as video playback failed
          }
        } else {
           throw new Error("Video element reference became null unexpectedly.");
        }

      } catch (error) { // This catches getUserMedia errors or re-thrown playError
        console.error('Error accessing or preparing camera:', error);
        setHasCameraPermission(false); // Ensure permission state reflects failure
        let title = 'Acesso à Câmera Negado';
        let description = 'Permissão da câmera negada. Por favor, habilite o acesso à câmera nas configurações do seu navegador e recarregue a página.';
        
        if (error instanceof Error) {
          if (error.name === "OverconstrainedError" || error.name === "ConstraintNotSatisfiedError") {
            title = 'Problema com a Resolução';
            description = "Não foi possível usar a resolução ideal da câmera. Verifique se outra aplicação está usando a câmera ou tente uma resolução menor.";
            // Attempt fallback (simplified here, original logic can be kept if preferred)
            try {
                const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                streamRef.current = fallbackStream;
                if (videoRef.current) {
                    videoRef.current.srcObject = fallbackStream;
                    await videoRef.current.play();
                    setHasCameraPermission(true); 
                    toast({ title: 'Usando Câmera Reserva', description: 'Não foi possível usar a resolução ideal, usando configurações padrão da câmera.' });
                    setIsLoading(false); // Crucial: Reset loading state after fallback attempt
                    return; 
                }
            } catch (fallbackError) {
                console.error('Error accessing camera with fallback constraints:', fallbackError);
            }
          } else if (error.name === "NotAllowedError") {
            // Default message is fine for permission denied by user prompt
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
      // Clean up permission onchange listener if any was attached
      // This requires storing the PermissionStatus object itself, not just its state.
      // For simplicity, this example doesn't store the object to remove 'onchange'.
      // In a more complex app, you might want to manage this.
    };
  }, [isScanning, onScanError, toast, cleanupStream, setIsScanning]); // hasCameraPermission removed as it's managed internally


  useEffect(() => {
    if (!isScanning || !hasCameraPermission || !videoRef.current || !codeReaderRef.current || !streamRef.current || isLoading) {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      return;
    }

    const videoElement = videoRef.current;
    const codeReader = codeReaderRef.current;

    const decodeLoop = async () => {
      if (!isScanning || decodingRef.current || !videoElement || videoElement.readyState < videoElement.HAVE_METADATA || videoElement.paused) {
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
            // setIsScanning(false); // Let parent decide if scanning stops
            decodingRef.current = false;
            return; 
          }
        }
      } catch (error) {
        if (error instanceof NotFoundException) {
          // Normal, no code found
        } else if (error instanceof ChecksumException || error instanceof FormatException) {
          // console.warn('Minor barcode decoding error:', error.message);
        } else {
          // console.error('Major barcode detection error:', error);
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
  }, [isScanning, hasCameraPermission, isLoading, onScanSuccess, onScanError]); // Removed setIsScanning from here


  // Render logic
  if (!isScanning && hasCameraPermission !== false) {
    return null; // Don't render if not scanning, unless permission was explicitly denied (to show alert)
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

    