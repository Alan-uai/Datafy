
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
      // Initialize with a 50ms delay between scans and specify hints for better performance.
      // const hints = new Map();
      // const formats = [
      // BarcodeFormat.QR_CODE, 
      // BarcodeFormat.EAN_13,
      // ];
      // if (formats.length > 0) {
      //   hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
      // }
      // Consider adding hints if performance is an issue or specific formats are targeted
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
      setHasCameraPermission(null); // Reset while attempting
      decodingRef.current = false;

      if (!videoRef.current) {
          console.error("Video element ref not available during permission request.");
          onScanError("Elemento de vídeo não está pronto.");
          setHasCameraPermission(false); // Indicate failure
          setIsLoading(false); // Ensure loading state is reset
          return;
      }
      if (!codeReaderRef.current) {
          console.error("CodeReader ref not available during permission request.");
          onScanError("Leitor de código não está pronto.");
          setHasCameraPermission(false); // Indicate failure
          setIsLoading(false); // Ensure loading state is reset
          return;
      }

      try {
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
            setHasCameraPermission(true); // Permission granted AND video is playing
          } catch (playError) {
            console.error("Error playing video:", playError);
            setHasCameraPermission(false); // Camera access might be ok, but playback failed
            const errorTitle = 'Erro ao Iniciar Câmera';
            const errorMessage = playError instanceof Error ? playError.message : 'Não foi possível reproduzir o feed da câmera.';
            onScanError(`Falha ao iniciar a visualização da câmera: ${errorMessage}`);
            toast({ variant: 'destructive', title: errorTitle, description: errorMessage });
            cleanupStream(); // Important to release resources
            // setIsLoading(false) will be handled by the finally block of the outer try-catch
            return; // Exit as video playback failed
          }
        } else {
           // Should not happen if initial check passes, but as a safeguard
           throw new Error("Video element reference became null unexpectedly.");
        }

      } catch (error) { // This catches getUserMedia errors or the safeguard error above
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
                    await videoRef.current.play(); // Try playing fallback
                    setHasCameraPermission(true); 
                    toast({ title: 'Usando Câmera Reserva', description: 'Não foi possível usar a resolução ideal, usando configurações padrão da câmera.' });
                    setIsLoading(false); // Crucial: Reset loading state after fallback attempt
                    return; 
                }
            } catch (fallbackError) {
                console.error('Error accessing camera with fallback constraints:', fallbackError);
                // If fallback fails, original error message is more relevant.
            }
          } else if (error.name === "NotAllowedError") {
            // Default message is fine
          } else if (error.name === "NotFoundError") {
            title = 'Câmera Não Encontrada';
            description = 'Nenhuma câmera compatível foi encontrada no seu dispositivo.';
          } else { // Handles generic errors or the one re-thrown from play() if it was structured that way
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
    
    // This cleanup runs when isScanning changes or component unmounts
    return () => { 
      cleanupStream();
    };
  }, [isScanning, onScanError, toast, cleanupStream, setIsScanning]); // Added setIsScanning


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
        // Check if video element has valid dimensions before attempting to decode
        if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
          const result = await codeReader.decodeOnceFromVideoElement(videoElement); // decodeOnce is less resource-intensive for a loop
          if (result && isScanning) { // Double check isScanning in case it changed during async operation
            onScanSuccess(result.getText());
            // setIsScanning(false); // Let the parent component decide to stop scanning
            decodingRef.current = false; // Allow loop to stop or parent to decide next step
            return; // Exit loop on success
          }
        }
      } catch (error) {
        if (error instanceof NotFoundException) {
          // Normal, no code found in this frame
        } else if (error instanceof ChecksumException || error instanceof FormatException) {
          // console.warn('Minor barcode decoding error:', error.message);
        } else {
          // console.error('Major barcode detection error:', error);
          // onScanError('Erro na detecção do código de barras.'); // Optionally report more critical errors
        }
      }
      decodingRef.current = false;
      // Continue loop only if still scanning
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

    // If video is already ready, start decoding
    if (videoElement.readyState >= videoElement.HAVE_ENOUGH_DATA && !videoElement.paused && videoElement.videoWidth > 0 && isScanning && !animationFrameIdRef.current && !decodingRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(decodeLoop);
    }

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      if (videoElement) { // Ensure videoElement exists before removing listeners
        videoElement.removeEventListener('canplay', onCanPlay);
        videoElement.removeEventListener('loadedmetadata', onCanPlay);
        videoElement.removeEventListener('playing', onCanPlay);
      }
      decodingRef.current = false; // Reset decoding flag
    };
  }, [isScanning, hasCameraPermission, isLoading, onScanSuccess, setIsScanning, onScanError]);


  // Do not render anything if not scanning and permission is not explicitly denied
  if (!isScanning && hasCameraPermission !== false) {
    return null;
  }

  return (
    <div className="relative w-full aspect-[4/3] bg-muted rounded-md overflow-hidden border">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline // Important for iOS
        muted // Often required for autoplay
        autoPlay // Try to autoplay
      />
      
      {isScanning && isLoading && ( // Covers both permission request and video starting
         <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            {hasCameraPermission === null ? "Solicitando permissão da câmera..." : "Iniciando câmera..."}
        </div>
      )}

      {/* This state is covered by isLoading or hasCameraPermission === false. 
          If !isLoading and hasCameraPermission === null, it implies an issue in requestCameraPermissionAndStart logic.
      {isScanning && !isLoading && hasCameraPermission === null && ( 
         <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            Verificando permissão da câmera...
        </div>
      )}
      */}

      {hasCameraPermission === false && ( // Show error if permission denied or playback failed
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

