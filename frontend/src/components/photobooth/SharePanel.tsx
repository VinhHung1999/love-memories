import { useState } from 'react';
import { Download, Share2, Copy, Check } from 'lucide-react';
import { downloadCanvas } from '../../lib/photobooth/canvas-utils';
import { useAppName } from '../../lib/useAppName';

interface Props {
  resultCanvas: HTMLCanvasElement | null;
  disabled?: boolean;
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
}

export default function SharePanel({ resultCanvas, disabled }: Props) {
  const appName = useAppName();
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const isDisabled = disabled || !resultCanvas;
  const filename = `${appName.toLowerCase().replace(/\s+/g, '-')}-photo-booth.png`;

  const handleDownload = () => {
    if (resultCanvas) downloadCanvas(resultCanvas, filename);
  };

  const handleShare = async () => {
    if (!resultCanvas) return;
    setSharing(true);
    try {
      const blob = await canvasToBlob(resultCanvas);
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${appName} Photo Booth ♥` });
      } else {
        handleDownload();
      }
    } catch {
      // User cancelled or share not available
    } finally {
      setSharing(false);
    }
  };

  const handleCopy = async () => {
    if (!resultCanvas) return;
    try {
      const blob = await canvasToBlob(resultCanvas);
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — silently ignore
    }
  };

  const canWebShare = typeof navigator !== 'undefined' && 'share' in navigator;
  const canClipboard = typeof navigator !== 'undefined' && 'clipboard' in navigator;

  return (
    <div className="flex gap-2 flex-wrap">
      {canWebShare && (
        <button
          onClick={handleShare}
          disabled={isDisabled || sharing}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-semibold text-sm hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Share2 className="w-4 h-4" />
          {sharing ? 'Sharing…' : 'Share'}
        </button>
      )}

      {canClipboard && (
        <button
          onClick={handleCopy}
          disabled={isDisabled}
          className="flex items-center gap-2 px-4 py-3 border border-border rounded-2xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      )}

      <button
        onClick={handleDownload}
        disabled={isDisabled}
        className="flex-1 flex items-center justify-center gap-2 border border-border rounded-2xl py-3 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Download className="w-4 h-4" />
        Download PNG
      </button>
    </div>
  );
}
