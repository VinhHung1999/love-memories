export interface UploadEntry {
  id: string;
  label: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  retryFn?: () => void;
}

type Listener = (uploads: Map<string, UploadEntry>) => void;

class UploadQueue {
  private uploads = new Map<string, UploadEntry>();
  private listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(new Map(this.uploads));
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const snapshot = new Map(this.uploads);
    this.listeners.forEach((l) => l(snapshot));
  }

  enqueue(
    id: string,
    label: string,
    uploadFn: (onProgress: (percent: number) => void) => Promise<unknown>,
    onSuccess?: (result: unknown) => void,
  ): void {
    const retryFn = () => this.enqueue(id, label, uploadFn, onSuccess);

    this.uploads.set(id, { id, label, progress: 0, status: 'uploading', retryFn });
    this.notify();

    uploadFn((progress) => {
      const entry = this.uploads.get(id);
      if (entry?.status === 'uploading') {
        this.uploads.set(id, { ...entry, progress });
        this.notify();
      }
    })
      .then((result) => {
        this.uploads.set(id, { id, label, progress: 100, status: 'success' });
        this.notify();
        onSuccess?.(result);
        setTimeout(() => this.dismiss(id), 3_000);
      })
      .catch((err: Error) => {
        this.uploads.set(id, {
          id,
          label,
          progress: 0,
          status: 'error',
          error: err?.message || 'Upload failed',
          retryFn,
        });
        this.notify();
      });
  }

  retry(id: string): void {
    this.uploads.get(id)?.retryFn?.();
  }

  dismiss(id: string): void {
    this.uploads.delete(id);
    this.notify();
  }

  getAll(): Map<string, UploadEntry> {
    return new Map(this.uploads);
  }
}

export const uploadQueue = new UploadQueue();
