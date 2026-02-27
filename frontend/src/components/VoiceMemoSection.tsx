import { useRef, useState, useCallback } from 'react';
import { Mic, Square, Play, Pause, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { proxyAudioUrl } from '../lib/api';

interface AudioItem {
  id: string;
  url: string;
  duration: number | null;
}

interface VoiceMemoSectionProps {
  isRecording: boolean;
  recordSeconds: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  audios: AudioItem[];
  onDeleteAudio?: (audioId: string) => void;
  label?: string;
  emptyText?: string;
  /** Pending (not yet uploaded) audio — for compose flows */
  pendingAudioUrl?: string;
  pendingAudioDuration?: number;
  onDeletePending?: () => void;
  /** Hide record button when max audios reached */
  canRecord?: boolean;
}

function formatTime(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.round(seconds % 60)).padStart(2, '0')}`;
}

export default function VoiceMemoSection({
  isRecording,
  recordSeconds,
  onStartRecording,
  onStopRecording,
  audios,
  onDeleteAudio,
  label = '🎤 Voice Memos',
  emptyText = 'Chưa có voice memo nào.',
  pendingAudioUrl,
  pendingAudioDuration,
  onDeletePending,
  canRecord = true,
}: VoiceMemoSectionProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const togglePlay = useCallback(async (url: string, audioId: string) => {
    // Stop current playback
    try { sourceNodeRef.current?.stop(); } catch {}
    sourceNodeRef.current = null;

    if (playingId === audioId) {
      setPlayingId(null);
      return;
    }

    setPlayingId(audioId);
    try {
      // Create AudioContext in user gesture — unlocks iOS audio
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      // Use backend proxy to bypass CDN CORS and fix video/mp4 → audio/mp4 content-type
      const proxyUrl = url.startsWith('/') ? url : proxyAudioUrl(url);
      const resp = await fetch(proxyUrl);
      const buf = await resp.arrayBuffer();
      const decoded = await ctx.decodeAudioData(buf);

      const source = ctx.createBufferSource();
      source.buffer = decoded;
      source.connect(ctx.destination);
      source.onended = () => setPlayingId(null);
      source.start(0);
      sourceNodeRef.current = source;
    } catch (err: any) {
      console.error('Audio play failed:', err);
      toast.error(`Play lỗi: ${err?.name} — ${err?.message}`, { duration: 8000 });
      setPlayingId(null);
    }
  }, [playingId]);

  const isEmpty = audios.length === 0 && !pendingAudioUrl && !isRecording;

  return (
    <>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <Mic className="w-4 h-4 text-primary" />
          {label}
        </h3>
        {canRecord && (
          !isRecording ? (
            <button
              onClick={onStartRecording}
              className="flex items-center gap-1.5 text-xs text-primary border border-primary/30 px-3 py-1.5 rounded-xl hover:bg-primary/5 transition-colors"
            >
              <Mic className="w-3.5 h-3.5" /> Record
            </button>
          ) : (
            <button
              onClick={onStopRecording}
              className="flex items-center gap-1.5 text-xs text-red-500 border border-red-300 px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors animate-pulse"
            >
              <Square className="w-3.5 h-3.5 fill-red-500" />
              {formatTime(recordSeconds)}
            </button>
          )
        )}
      </div>

      {/* Empty state */}
      {isEmpty && (
        <p className="text-xs text-text-light text-center py-2">{emptyText}</p>
      )}

      <div className="space-y-2">
        {/* Pending (not yet uploaded) audio */}
        {pendingAudioUrl && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <button
              onClick={() => togglePlay(pendingAudioUrl, '__pending__')}
              className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-400 text-white flex items-center justify-center hover:bg-amber-500 transition-colors"
            >
              {playingId === '__pending__' ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5 ml-0.5" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-amber-800">Voice memo</p>
              {pendingAudioDuration != null && (
                <p className="text-xs text-amber-600">{formatTime(pendingAudioDuration)}</p>
              )}
            </div>
            {onDeletePending && (
              <button
                onClick={onDeletePending}
                className="text-red-400 hover:text-red-500 p-1 rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Uploaded audios */}
        {audios.map((audio, i) => (
          <div key={audio.id} className="flex items-center gap-2 bg-primary/5 rounded-xl px-3 py-2">
            <button
              onClick={() => togglePlay(audio.url, audio.id)}
              className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              {playingId === audio.id ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5 ml-0.5" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium">Memo {i + 1}</p>
              {audio.duration != null && (
                <p className="text-xs text-text-light">{formatTime(audio.duration)}</p>
              )}
            </div>
            {onDeleteAudio && (
              <button
                onClick={() => onDeleteAudio(audio.id)}
                className="text-red-400 hover:text-red-500 p-1 rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

    </>
  );
}
