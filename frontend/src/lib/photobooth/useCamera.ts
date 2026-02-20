import { useRef, useState, useCallback, useEffect } from 'react';

export interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  facingMode: 'user' | 'environment';
  error: string | null;
  isReady: boolean;
  startCamera: (facing?: 'user' | 'environment') => Promise<void>;
  stopCamera: () => void;
  toggleFacing: () => Promise<void>;
  captureFrame: (w: number, h: number, filterCss?: string) => string | null;
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
    setIsReady(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async (facing: 'user' | 'environment' = 'user') => {
    setError(null);
    setIsReady(false);

    // Stop existing stream
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera not supported in this browser. Use Gallery Mode instead.');
      return;
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      streamRef.current = newStream;
      setStream(newStream);
      setFacingMode(facing);

      const video = videoRef.current;
      if (video) {
        video.srcObject = newStream;
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => resolve();
        });
        await video.play();
        setIsReady(true);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('NotAllowed') || msg.includes('Permission')) {
        setError('Camera permission denied. Please allow camera access and try again.');
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
        setError('No camera found on this device.');
      } else if (msg.includes('NotReadable') || msg.includes('TrackStart')) {
        setError('Camera is already in use by another app.');
      } else {
        setError('Could not access camera. Try using Gallery Mode.');
      }
    }
  }, []);

  const toggleFacing = useCallback(async () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    await startCamera(next);
  }, [facingMode, startCamera]);

  const captureFrame = useCallback((w: number, h: number, filterCss?: string): string | null => {
    const video = videoRef.current;
    if (!video || !isReady) return null;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    if (filterCss && filterCss !== 'none') ctx.filter = filterCss;
    // Mirror horizontally for front camera (selfie mode)
    if (facingMode === 'user') {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', 0.92);
  }, [isReady, facingMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { videoRef, stream, facingMode, error, isReady, startCamera, stopCamera, toggleFacing, captureFrame };
}
