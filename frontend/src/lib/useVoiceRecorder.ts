import { useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

interface UseVoiceRecorderOptions {
  maxDuration?: number; // seconds; undefined = unlimited
  onRecordingComplete: (file: File, duration: number) => void;
}

interface UseVoiceRecorderReturn {
  isRecording: boolean;
  recordSeconds: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

export function useVoiceRecorder({
  maxDuration,
  onRecordingComplete,
}: UseVoiceRecorderOptions): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | undefined>(undefined);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const durationRef = useRef(0); // accurate duration, avoids stale closure bug

  // Keep onRecordingComplete stable while always calling the latest version
  const onCompleteRef = useRef(onRecordingComplete);
  onCompleteRef.current = onRecordingComplete;

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      durationRef.current = 0;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(timerRef.current);

        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
        const ext = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : 'webm';
        const file = new File([blob], `memo-${Date.now()}.${ext}`, { type: blob.type });

        onCompleteRef.current(file, durationRef.current);
        setRecordSeconds(0);
        durationRef.current = 0;
      };

      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
      setRecordSeconds(0);

      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setRecordSeconds(durationRef.current);

        if (maxDuration && durationRef.current >= maxDuration) {
          mr.stop();
          setIsRecording(false);
          clearInterval(timerRef.current);
        }
      }, 1000);
    } catch {
      toast.error('Microphone access denied');
    }
  }, [maxDuration]);

  return { isRecording, recordSeconds, startRecording, stopRecording };
}
