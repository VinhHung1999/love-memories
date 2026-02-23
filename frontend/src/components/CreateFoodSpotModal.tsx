import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from './Modal';
import LocationPicker from './LocationPicker';
import RatingStars from './RatingStars';
import PhotoUpload from './PhotoUpload';
import { foodSpotsApi } from '../lib/api';
import { uploadQueue } from '../lib/uploadQueue';

interface CreateFoodSpotModalProps {
  open: boolean;
  onClose: () => void;
  /** Called with the newly created food spot's id after successful creation */
  onCreated: (foodSpotId: string) => void;
  /** Pre-fill fields from a stop */
  initialName?: string | null;
  initialDescription?: string | null;
  initialLocation?: string | null;
  initialLatitude?: number | null;
  initialLongitude?: number | null;
}

export default function CreateFoodSpotModal({
  open,
  onClose,
  onCreated,
  initialName,
  initialDescription,
  initialLocation,
  initialLatitude,
  initialLongitude,
}: CreateFoodSpotModalProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState(initialName ?? '');
  const [description, setDescription] = useState(initialDescription ?? '');
  const [rating, setRating] = useState(0);
  const [priceRange, setPriceRange] = useState(2);
  const [location, setLocation] = useState(initialLocation ?? '');
  const [latitude, setLatitude] = useState<number | null>(initialLatitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(initialLongitude ?? null);
  const [tagsInput, setTagsInput] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);

  // Render-phase reset when modal opens (captures fresh initialXxx each open)
  const [lastOpen, setLastOpen] = useState(false);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setName(initialName ?? '');
      setDescription(initialDescription ?? '');
      setRating(0);
      setPriceRange(2);
      setLocation(initialLocation ?? '');
      setLatitude(initialLatitude ?? null);
      setLongitude(initialLongitude ?? null);
      setTagsInput('');
      setPhotos([]);
    }
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const created = await foodSpotsApi.create({
        name,
        description: description || undefined,
        rating,
        priceRange,
        location: location || undefined,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        tags: tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });
      if (photos.length > 0) {
        const label =
          photos.length === 1
            ? `Đang tải ${photos[0]?.name ?? 'ảnh'}`
            : `Đang tải ${photos.length} ảnh...`;
        uploadQueue.enqueue(
          `foodspot-photos-${created.id}-${Date.now()}`,
          label,
          (onProgress) => foodSpotsApi.uploadPhotos(created.id, photos, onProgress),
          () => queryClient.invalidateQueries({ queryKey: ['foodspots'] }),
        );
      }
      return created;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['foodspots'] });
      toast.success('Đã tạo quán!');
      onCreated(created.id);
    },
    onError: () => toast.error('Không thể tạo quán'),
  });

  return (
    <Modal open={open} onClose={onClose} title="Thêm quán mới">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium mb-1">Tên quán *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            placeholder="Ví dụ: Quán Phở 24"
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Mô tả</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Nhận xét ngắn..."
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Đánh giá</label>
            <RatingStars rating={rating} onChange={setRating} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Giá</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriceRange(p)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    p === priceRange
                      ? 'bg-secondary text-white'
                      : 'bg-gray-100 text-text-light hover:bg-gray-200'
                  }`}
                >
                  {'$'.repeat(p)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Địa điểm</label>
          <LocationPicker
            latitude={latitude}
            longitude={longitude}
            location={location || null}
            onChange={({ latitude: lat, longitude: lng, location: loc }) => {
              setLatitude(lat);
              setLongitude(lng);
              setLocation(loc);
            }}
            onClear={() => {
              setLatitude(null);
              setLongitude(null);
              setLocation('');
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tags</label>
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="ví dụ: phở, bún bò, bình dân"
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Ảnh</label>
          <PhotoUpload photos={photos} onChange={setPhotos} />
        </div>

        <div className="flex gap-3 pt-3 pb-2 sticky bottom-0 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 border-t border-border mt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={mutation.isPending || !name.trim()}
            className="flex-1 bg-secondary text-white rounded-xl py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {mutation.isPending ? 'Đang tạo...' : 'Tạo quán'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
