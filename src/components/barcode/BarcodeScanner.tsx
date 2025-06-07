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
      const hints = new Map();
      const formats = [
        // Add common barcode formats you expect to scan
        // BarcodeFormat.QR_CODE, // Example
        // BarcodeFormat.EAN_13,  // Example
      ];
      // if (formats.length > 0) {
      //   hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
      // }
      codeReaderRef.current = new BrowserMultiFormatReader(hints, 50);
    }
    return () => {
      cleanupStream();
    };
  }, [cleanupStream]);

  useEffect(() => {
    const requestCameraPermissionAndStart = async () => {
      if (!videoRef.current || !codeReaderRef.current) return;
      if (!isScanning) {
        cleanupStream();
        return;
      }

      setIsLoading(true);
      setHasCameraPermission(null);
      decodingRef.current = false;

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
          await videoRef.current.play().catch(err => {
            console.error("Error playing video:", err);
            throw new Error("Não foi possível iniciar a visualização da câmera.");
          });
        }
        setHasCameraPermission(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
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
                    setHasCameraPermission(true); 
                    toast({ title: 'Usando Câmera Reserva', description: 'Não foi possível usar a resolução ideal, usando configurações padrão da câmera.' });
                    setIsLoading(false);
                    return; 
                }
            } catch (fallbackError) {
                console.error('Error accessing camera with fallback constraints:', fallbackError);
            }
          } else if (error.name === "NotAllowedError") {
            // Default message is fine
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
        cleanupStream(); // Ensure cleanup on error
      } finally {
        setIsLoading(false);
      }
    };

    if (isScanning) {
      requestCameraPermissionAndStart();
    } else {
      cleanupStream();
    }
    return () => { // Main cleanup for this effect
      cleanupStream();
    };
  }, [isScanning, onScanError, toast, cleanupStream]); // Added cleanupStream to dependencies


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
        // If still scanning and not decoding, and video is ready, request next frame
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
    
    // Event listener to start decoding loop once video can play
    const onCanPlay = () => {
      if (videoElement.videoWidth > 0 && isScanning && !animationFrameIdRef.current && !decodingRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(decodeLoop);
      }
    };

    videoElement.addEventListener('canplay', onCanPlay);
    videoElement.addEventListener('loadedmetadata', onCanPlay); // Also good for ensuring dimensions are known
    videoElement.addEventListener('playing', onCanPlay); // When video actually starts playing

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
      
      {isScanning && isLoading && (
         <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            Iniciando câmera...
        </div>
      )}

      {/* This state might not be hit if isLoading covers it */}
      {isScanning && !isLoading && hasCameraPermission === null && (
         <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            Solicitando permissão da câmera...
        </div>
      )}

      {hasCameraPermission === false && ( // Show error if permission denied
        <div className="absolute inset-0 flex items-center justify-center p-4 bg-background/90">
            <Alert variant="destructive" className="w-full">
                <AlertTitle>Acesso à Câmera Necessário</AlertTitle>
                <AlertDescription>
                Por favor, permita o acesso à câmera nas configurações do seu navegador e recarregue a página. Se o problema persistir, verifique se outra aplicação está utilizando a câmera.
                </AlertDescription>
            </Alert>
        </div>
      )}
    </div>
  );
}
