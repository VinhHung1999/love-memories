import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Utensils, Plus, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { foodSpotsApi } from '../lib/api';
import { uploadQueue } from '../lib/uploadQueue';
import { useCheckAchievements } from '../lib/achievements';
import { useModuleTour } from '../lib/useModuleTour';
import type { FoodSpot } from '../types';
import Modal from '../components/Modal';
import PhotoUpload from '../components/PhotoUpload';
import LocationPicker from '../components/LocationPicker';
import RatingStars from '../components/RatingStars';
import EmptyState from '../components/EmptyState';
import { GridSkeleton } from '../components/LoadingSkeleton';
import RandomFoodPicker from '../components/RandomFoodPicker';

export default function FoodSpotsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filterTag, setFilterTag] = useState('');
  const [searchParams] = useSearchParams();

  useModuleTour('foodspots', [
    { element: '[data-tour="add-foodspot"]', popover: { title: '➕ Thêm quán', description: 'Lưu quán ăn yêu thích — thêm ảnh, địa chỉ, tag và ghi chú.', side: 'left' } },
    { element: '[data-tour="foodspot-card"]', popover: { title: '🍜 Xem chi tiết', description: 'Bấm vào quán để xem ảnh, vị trí trên bản đồ và ghi chú.', side: 'bottom' } },
  ]);

  useEffect(() => {
    if (searchParams.get('new') === '1') setShowForm(true);
  }, [searchParams]);

  const { data: foodSpots = [], isLoading } = useQuery({
    queryKey: ['foodspots'],
    queryFn: foodSpotsApi.list,
  });

  const allTags = [...new Set(foodSpots.flatMap((f) => f.tags))];
  const filtered = filterTag ? foodSpots.filter((f) => f.tags.includes(filterTag)) : foodSpots;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold">Food Spots</h1>
          <p className="text-text-light text-sm mt-1">Our favorite places to eat</p>
        </div>
        <button
          data-tour="add-foodspot"
          onClick={() => setShowForm(true)}
          className="bg-secondary text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Add Spot
        </button>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilterTag('')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              !filterTag ? 'bg-secondary text-white' : 'bg-gray-100 text-text-light hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(tag === filterTag ? '' : tag)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterTag === tag ? 'bg-secondary text-white' : 'bg-gray-100 text-text-light hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <GridSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Utensils}
          title="No food spots yet"
          description="Start adding your favorite places to eat"
          action={{ label: 'Add First Spot', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((spot, i) =>
            i === 0 ? (
              <div key={spot.id} data-tour="foodspot-card">
                <FoodSpotCard spot={spot} index={i} />
              </div>
            ) : (
              <FoodSpotCard key={spot.id} spot={spot} index={i} />
            )
          )}
        </div>
      )}

      <FoodSpotFormModal open={showForm} onClose={() => setShowForm(false)} />
      <RandomFoodPicker />
    </div>
  );
}

function FoodSpotCard({ spot, index }: { spot: FoodSpot; index: number }) {
  const priceLabel = '$'.repeat(spot.priceRange);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/foodspots/${spot.id}`}
        className="block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
      >
        <div className="h-48 bg-gray-100 overflow-hidden">
          {spot.photos[0] ? (
            <img
              src={spot.photos[0].url}
              alt={spot.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Utensils className="w-12 h-12 text-gray-300" />
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between">
            <h3 className="font-heading font-semibold text-lg truncate">{spot.name}</h3>
            <span className="text-secondary font-medium text-sm">{priceLabel}</span>
          </div>
          <div className="mt-1">
            <RatingStars rating={spot.rating} size={14} />
          </div>
          {spot.location && (
            <p className="flex items-center gap-1 mt-2 text-text-light text-xs truncate">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              {spot.location}
            </p>
          )}
          {spot.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {spot.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-secondary/10 text-secondary rounded-full text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

function FoodSpotFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const checkAchievements = useCheckAchievements();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState(0);
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState(2);
  const [tagsInput, setTagsInput] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);

  const mutation = useMutation({
    mutationFn: async () => {
      const data = {
        name,
        description: description || undefined,
        rating,
        location: location || undefined,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        priceRange,
        tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      };
      const created = await foodSpotsApi.create(data);
      if (photos.length > 0) {
        const label = photos.length === 1 ? `Đang tải ${photos[0]?.name ?? 'ảnh'}` : `Đang tải ${photos.length} ảnh...`;
        uploadQueue.enqueue(
          `foodspot-photos-${created.id}-${Date.now()}`,
          label,
          (onProgress) => foodSpotsApi.uploadPhotos(created.id, photos, onProgress),
          () => queryClient.invalidateQueries({ queryKey: ['foodspots'] }),
        );
      }
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodspots'] });
      toast.success('Food spot added!');
      onClose();
      setName(''); setDescription(''); setRating(0); setLocation('');
      setLatitude(null); setLongitude(null); setPriceRange(2); setTagsInput(''); setPhotos([]);
      checkAchievements();
    },
    onError: () => toast.error('Failed to add food spot'),
  });

  return (
    <Modal open={open} onClose={onClose} title="New Food Spot">
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Rating</label>
            <RatingStars rating={rating} onChange={setRating} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Price Range</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriceRange(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    p === priceRange ? 'bg-secondary text-white' : 'bg-gray-100 text-text-light hover:bg-gray-200'
                  }`}
                >
                  {'$'.repeat(p)}
                </button>
              ))}
            </div>
          </div>
        </div>
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
        <div>
          <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
          <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="vietnamese, sushi, cafe" className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Photos</label>
          <PhotoUpload photos={photos} onChange={setPhotos} />
        </div>
        <div className="flex gap-3 pt-3 pb-2 sticky bottom-0 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 border-t border-border mt-4">
          <button type="button" onClick={onClose} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={mutation.isPending || !name} className="flex-1 bg-secondary text-white rounded-xl py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {mutation.isPending ? 'Saving...' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
