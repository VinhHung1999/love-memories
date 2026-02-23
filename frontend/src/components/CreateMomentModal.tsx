import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from './Modal';
import LocationPicker from './LocationPicker';
import { momentsApi } from '../lib/api';

interface CreateMomentModalProps {
  open: boolean;
  onClose: () => void;
  /** Called with the newly created moment's id after successful creation */
  onCreated: (momentId: string) => void;
  /** Pre-fill fields from a stop */
  initialTitle?: string | null;
  initialCaption?: string | null;
  initialLocation?: string | null;
  initialLatitude?: number | null;
  initialLongitude?: number | null;
}

export default function CreateMomentModal({
  open,
  onClose,
  onCreated,
  initialTitle,
  initialCaption,
  initialLocation,
  initialLatitude,
  initialLongitude,
}: CreateMomentModalProps) {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(initialTitle ?? '');
  const [caption, setCaption] = useState(initialCaption ?? '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [location, setLocation] = useState(initialLocation ?? '');
  const [latitude, setLatitude] = useState<number | null>(initialLatitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(initialLongitude ?? null);
  const [tagsInput, setTagsInput] = useState('');
  const [spotifyUrl, setSpotifyUrl] = useState('');

  // Render-phase reset when modal opens (captures fresh initialXxx each open)
  const [lastOpen, setLastOpen] = useState(false);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setTitle(initialTitle ?? '');
      setCaption(initialCaption ?? '');
      setDate(new Date().toISOString().slice(0, 10));
      setLocation(initialLocation ?? '');
      setLatitude(initialLatitude ?? null);
      setLongitude(initialLongitude ?? null);
      setTagsInput('');
      setSpotifyUrl('');
    }
  }

  const mutation = useMutation({
    mutationFn: () =>
      momentsApi.create({
        title,
        caption: caption || undefined,
        date,
        location: location || undefined,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        tags: tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        spotifyUrl: spotifyUrl || undefined,
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['moments'] });
      toast.success('Đã tạo Moment!');
      onCreated(created.id);
    },
    onError: () => toast.error('Không thể tạo Moment'),
  });

  return (
    <Modal open={open} onClose={onClose} title="Tạo Moment mới">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium mb-1">Tiêu đề *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
            placeholder="Tên kỷ niệm..."
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={2}
            placeholder="Mô tả ngắn..."
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Ngày *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
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
            placeholder="ví dụ: cà phê, lần đầu, cuối tuần"
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Spotify URL</label>
          <input
            type="url"
            value={spotifyUrl}
            onChange={(e) => setSpotifyUrl(e.target.value)}
            placeholder="https://open.spotify.com/..."
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
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
            disabled={mutation.isPending || !title.trim()}
            className="flex-1 bg-primary text-white rounded-xl py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {mutation.isPending ? 'Đang tạo...' : 'Tạo Moment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
