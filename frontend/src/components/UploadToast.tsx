import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, X, RefreshCw } from 'lucide-react';
import { uploadQueue, type UploadEntry } from '../lib/uploadQueue';
import UploadProgressBar from './UploadProgressBar';

export default function UploadToast() {
  const [uploads, setUploads] = useState<Map<string, UploadEntry>>(new Map());

  useEffect(() => {
    return uploadQueue.subscribe(setUploads);
  }, []);

  const entries = Array.from(uploads.values());
  if (entries.length === 0) return null;

  return (
    <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-6 right-4 md:right-6 z-[55] flex flex-col gap-2 w-72">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="bg-white rounded-2xl shadow-lg border border-border px-3 py-2.5 text-sm"
        >
          {entry.status === 'uploading' && (
            <>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <span className="flex-1 text-text text-xs truncate">{entry.label}</span>
              </div>
              <UploadProgressBar progress={entry.progress} />
            </>
          )}

          {entry.status === 'success' && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="flex-1 text-text text-xs truncate">Tải lên thành công!</span>
              <button
                onClick={() => uploadQueue.dismiss(entry.id)}
                className="text-text-light hover:text-text transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {entry.status === 'error' && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="flex-1 text-red-700 text-xs line-clamp-2">
                  {entry.error || 'Upload failed'}
                </span>
                <button
                  onClick={() => uploadQueue.dismiss(entry.id)}
                  className="text-text-light hover:text-text transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                onClick={() => uploadQueue.retry(entry.id)}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <RefreshCw className="w-3 h-3" /> Thử lại
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
