import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { foodSpotsApi } from '../lib/api';
import type { FoodSpot } from '../types';
import Modal from './Modal';
import LocationPicker from './LocationPicker';
import RatingStars from './RatingStars';

interface FoodSpotEditModalProps {
  spot: FoodSpot;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const PRICE_LABELS: Record<number, string> = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };

export default function FoodSpotEditModal({ spot, open, onClose, onSaved }: FoodSpotEditModalProps) {
  const [name, setName] = useState(spot.name);
  const [description, setDescription] = useState(spot.description || '');
  const [rating, setRating] = useState(spot.rating);
  const [priceRange, setPriceRange] = useState(spot.priceRange);
  const [location, setLocation] = useState(spot.location || '');
  const [latitude, setLatitude] = useState<number | null>(spot.latitude);
  const [longitude, setLongitude] = useState<number | null>(spot.longitude);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(spot.tags);

  const saveMutation = useMutation({
    mutationFn: () =>
      foodSpotsApi.update(spot.id, {
        name,
        description: description || undefined,
        rating,
        priceRange,
        location: location || undefined,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        tags,
      } as Partial<FoodSpot>),
    onSuccess: () => {
      toast.success('Food spot saved');
      onSaved();
      onClose();
    },
    onError: () => toast.error('Failed to save food spot'),
  });

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  return (
    <Modal open={open} onClose={onClose} title="Edit Food Spot">
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 resize-none"
          />
        </div>

        {/* Rating + Price Range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-2">Rating</label>
            <RatingStars rating={rating} onChange={setRating} size={22} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Price Range</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriceRange(p)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    priceRange === p
                      ? 'bg-secondary text-white'
                      : 'bg-gray-100 text-text-light hover:bg-gray-200'
                  }`}
                >
                  {PRICE_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
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
              <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-secondary/10 text-secondary rounded-full text-xs">
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
              className="flex-1 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-3 py-2 bg-secondary/10 text-secondary rounded-xl text-sm hover:bg-secondary/20"
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
            disabled={saveMutation.isPending || !name}
            className="flex-1 bg-secondary text-white rounded-xl py-2.5 text-sm font-medium hover:bg-secondary/90 disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
