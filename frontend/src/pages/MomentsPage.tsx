import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Camera, Plus, MapPin, Calendar, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { momentsApi } from '../lib/api';
import { useCheckAchievements } from '../lib/achievements';
import type { Moment } from '../types';
import Modal from '../components/Modal';
import PhotoUpload from '../components/PhotoUpload';
import LocationPicker from '../components/LocationPicker';
import EmptyState from '../components/EmptyState';
import { GridSkeleton } from '../components/LoadingSkeleton';

export default function MomentsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingMoment, setEditingMoment] = useState<Moment | null>(null);
  const [filterTag, setFilterTag] = useState('');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditingMoment(null);
      setShowForm(true);
    }
  }, [searchParams]);

  const { data: moments = [], isLoading } = useQuery({
    queryKey: ['moments'],
    queryFn: momentsApi.list,
  });

  const allTags = [...new Set(moments.flatMap((m) => m.tags))];
  const filtered = filterTag ? moments.filter((m) => m.tags.includes(filterTag)) : moments;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold">Moments</h1>
          <p className="text-text-light text-sm mt-1">Our special memories together</p>
        </div>
        <button
          onClick={() => { setEditingMoment(null); setShowForm(true); }}
          className="bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Moment
        </button>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilterTag('')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              !filterTag ? 'bg-primary text-white' : 'bg-gray-100 text-text-light hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(tag === filterTag ? '' : tag)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterTag === tag ? 'bg-primary text-white' : 'bg-gray-100 text-text-light hover:bg-gray-200'
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
          icon={Camera}
          title="No moments yet"
          description="Start capturing your special memories together"
          action={{ label: 'Add First Moment', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((moment, i) => (
            <MomentCard key={moment.id} moment={moment} index={i} />
          ))}
        </div>
      )}

      <MomentFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditingMoment(null); }}
        moment={editingMoment}
      />
    </div>
  );
}

function MomentCard({ moment, index }: { moment: Moment; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/moments/${moment.id}`}
        className="block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
      >
        <div className="h-48 bg-gray-100 overflow-hidden">
          {moment.photos[0] ? (
            <img
              src={moment.photos[0].url}
              alt={moment.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="w-12 h-12 text-gray-300" />
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-heading font-semibold text-lg truncate">{moment.title}</h3>
          <div className="flex items-center gap-3 mt-2 text-text-light text-xs">
            <span className="flex items-center gap-1 flex-shrink-0">
              <Calendar className="w-3 h-3" />
              {format(new Date(moment.date), 'MMM d, yyyy')}
            </span>
            {moment.location && (
              <span className="flex items-center gap-1 min-w-0 truncate">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{moment.location}</span>
              </span>
            )}
          </div>
          {moment.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {moment.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
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

function MomentFormModal({ open, onClose, moment }: { open: boolean; onClose: () => void; moment: Moment | null }) {
  const queryClient = useQueryClient();
  const checkAchievements = useCheckAchievements();
  const [title, setTitle] = useState(moment?.title || '');
  const [caption, setCaption] = useState(moment?.caption || '');
  const [date, setDate] = useState(moment?.date ? format(new Date(moment.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
  const [location, setLocation] = useState(moment?.location || '');
  const [latitude, setLatitude] = useState<number | null>(moment?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(moment?.longitude ?? null);
  const [tagsInput, setTagsInput] = useState(moment?.tags.join(', ') || '');
  const [spotifyUrl, setSpotifyUrl] = useState(moment?.spotifyUrl || '');
  const [photos, setPhotos] = useState<File[]>([]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const data = {
        title,
        caption: caption || undefined,
        date,
        location: location || undefined,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
        spotifyUrl: spotifyUrl || undefined,
      };
      const created = await momentsApi.create(data);
      if (photos.length > 0) {
        await momentsApi.uploadPhotos(created.id, photos);
      }
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moments'] });
      toast.success('Moment created!');
      onClose();
      checkAchievements();
    },
    onError: () => toast.error('Failed to create moment'),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const data = {
        title,
        caption: caption || undefined,
        date,
        location: location || undefined,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
        spotifyUrl: spotifyUrl || undefined,
      };
      const updated = await momentsApi.update(moment!.id, data);
      if (photos.length > 0) {
        await momentsApi.uploadPhotos(moment!.id, photos);
      }
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moments'] });
      toast.success('Moment updated!');
      onClose();
    },
    onError: () => toast.error('Failed to update moment'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (moment) updateMutation.mutate();
    else createMutation.mutate();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal open={open} onClose={onClose} title={moment ? 'Edit Moment' : 'New Moment'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={2}
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
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
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="travel, date night, anniversary"
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Spotify (tuỳ chọn)</label>
          <input
            value={spotifyUrl}
            onChange={(e) => setSpotifyUrl(e.target.value)}
            placeholder="https://open.spotify.com/track/..."
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Photos</label>
          <PhotoUpload photos={photos} onChange={setPhotos} />
        </div>
        <div className="flex gap-3 pt-3 pb-2 sticky bottom-0 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 border-t border-border mt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending || !title}
            className="flex-1 bg-primary text-white rounded-xl py-2.5 text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {isPending ? 'Saving...' : moment ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
