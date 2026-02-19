import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { momentsApi } from '../lib/api';
import type { Moment } from '../types';
import Modal from './Modal';
import LocationPicker from './LocationPicker';

interface MomentEditModalProps {
  moment: Moment;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function MomentEditModal({ moment, open, onClose, onSaved }: MomentEditModalProps) {
  const [title, setTitle] = useState(moment.title);
  const [caption, setCaption] = useState(moment.caption || '');
  const [date, setDate] = useState(format(new Date(moment.date), 'yyyy-MM-dd'));
  const [location, setLocation] = useState(moment.location || '');
  const [latitude, setLatitude] = useState<number | null>(moment.latitude);
  const [longitude, setLongitude] = useState<number | null>(moment.longitude);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(moment.tags);

  const saveMutation = useMutation({
    mutationFn: () =>
      momentsApi.update(moment.id, {
        title,
        caption: caption || undefined,
        date,
        location: location || undefined,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        tags,
      } as Partial<Moment>),
    onSuccess: () => {
      toast.success('Moment saved');
      onSaved();
      onClose();
    },
    onError: () => toast.error('Failed to save moment'),
  });

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  return (
    <Modal open={open} onClose={onClose} title="Edit Moment">
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Caption */}
        <div>
          <label className="block text-sm font-medium mb-1">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <LocationPicker
            latitude={latitude}
            longitude={longitude}
            location={location}
            onChange={(data) => {
              setLatitude(data.latitude);
              setLongitude(data.longitude);
              setLocation(data.location);
            }}
            onClear={() => {
              setLatitude(null);
              setLongitude(null);
              setLocation('');
            }}
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium mb-1">Tags</label>
          <div className="flex gap-2 mb-2 flex-wrap">
            {tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              placeholder="Add a tag..."
              className="flex-1 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-3 py-2 bg-primary/10 text-primary rounded-xl text-sm hover:bg-primary/20"
            >
              Add
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-3 pb-2 sticky bottom-0 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 border-t border-border mt-4">
          <button type="button" onClick={onClose} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !title}
            className="flex-1 bg-primary text-white rounded-xl py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
