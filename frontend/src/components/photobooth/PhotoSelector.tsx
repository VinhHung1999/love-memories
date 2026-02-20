import { useQuery } from '@tanstack/react-query';
import { Camera, CheckCircle } from 'lucide-react';
import { momentsApi } from '../../lib/api';
import type { FrameDef } from '../../lib/photobooth/frames';

interface Props {
  frame: FrameDef;
  selectedUrls: string[];
  onSelect: (urls: string[]) => void;
}

export default function PhotoSelector({ frame, selectedUrls, onSelect }: Props) {
  const { data: moments = [], isLoading } = useQuery({
    queryKey: ['moments'],
    queryFn: momentsApi.list,
  });

  const allPhotos = moments.flatMap((m) =>
    m.photos.map((p) => ({ url: p.url, title: m.title, momentId: m.id, photoId: p.id })),
  );

  const max = frame.photoCount.max;
  const min = frame.photoCount.min;

  const toggle = (url: string) => {
    if (selectedUrls.includes(url)) {
      onSelect(selectedUrls.filter((u) => u !== url));
    } else if (selectedUrls.length < max) {
      onSelect([...selectedUrls, url]);
    }
  };

  return (
    <div>
      <h2 className="font-heading text-xl font-bold mb-1">Select Photos</h2>
      <p className="text-text-light text-sm mb-4">
        {min === max ? `Choose exactly ${min}` : `Choose ${min}–${max}`} photo{max > 1 ? 's' : ''} for{' '}
        <span className="font-medium text-primary">{frame.emoji} {frame.label}</span>
        {' '}· {selectedUrls.length}/{max} selected
      </p>

      {isLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : allPhotos.length === 0 ? (
        <div className="text-center py-12 text-text-light">
          <Camera className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No photos yet</p>
          <p className="text-sm">Add moments with photos first</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {allPhotos.map((photo) => {
            const isSelected = selectedUrls.includes(photo.url);
            const selIdx = selectedUrls.indexOf(photo.url);
            const disabled = !isSelected && selectedUrls.length >= max;
            return (
              <button
                key={photo.photoId}
                onClick={() => toggle(photo.url)}
                disabled={disabled}
                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/40'
                    : disabled
                    ? 'border-transparent opacity-40 cursor-not-allowed'
                    : 'border-transparent hover:border-primary/40'
                }`}
              >
                <img src={photo.url} alt={photo.title} className="w-full h-full object-cover" />
                {isSelected && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold shadow">
                      {max === 1 ? <CheckCircle className="w-4 h-4" /> : selIdx + 1}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
