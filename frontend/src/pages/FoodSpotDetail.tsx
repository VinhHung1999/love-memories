import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Tag, Trash2, Pencil, Plus } from 'lucide-react';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { foodSpotsApi } from '../lib/api';
import RatingStars from '../components/RatingStars';
import PhotoGallery from '../components/PhotoGallery';
import FoodSpotEditModal from '../components/FoodSpotEditModal';

export default function FoodSpotDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | undefined>(undefined);

  const { data: spot, isLoading } = useQuery({
    queryKey: ['foodspots', id],
    queryFn: () => foodSpotsApi.get(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => foodSpotsApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodspots'] });
      toast.success('Food spot deleted');
      navigate('/foodspots');
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: (photoId: string) => foodSpotsApi.deletePhoto(id!, photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodspots', id] });
      toast.success('Photo deleted');
    },
  });

  const uploadPhotosMutation = useMutation({
    mutationFn: (files: File[]) => foodSpotsApi.uploadPhotos(id!, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodspots', id] });
      toast.success('Photos added');
    },
    onError: () => toast.error('Upload failed'),
  });

  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) uploadPhotosMutation.mutate(files);
    e.target.value = '';
  };

  const openGallery = (index: number) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-64 bg-gray-200 rounded-2xl" /><div className="h-8 bg-gray-200 rounded w-1/3" /></div>;
  if (!spot) return <div className="text-center py-16 text-text-light">Food spot not found</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate('/foodspots')} className="flex items-center gap-2 text-text-light hover:text-secondary mb-4 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Food Spots
      </button>

      {/* Photo Grid */}
      {spot.photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {spot.photos.map((photo, i) => (
            <div
              key={photo.id}
              className={`relative rounded-2xl overflow-hidden group cursor-pointer ${i === 0 ? 'col-span-2 row-span-2' : ''}`}
              onClick={() => openGallery(i)}
            >
              <img src={photo.url} alt="" className="w-full h-full object-cover min-h-[200px]" />
              <button
                onClick={(e) => { e.stopPropagation(); deletePhotoMutation.mutate(photo.id); }}
                className="absolute top-2 right-2 bg-red-500/80 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Photos button */}
      <div className="mb-4">
        <input
          ref={(el) => { fileInputRef.current = el ?? undefined; }}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleAddPhotos}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadPhotosMutation.isPending}
          className="flex items-center gap-2 text-sm text-secondary border border-secondary/30 px-4 py-2 rounded-xl hover:bg-secondary/5 transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {uploadPhotosMutation.isPending ? 'Uploading...' : 'Add Photos'}
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold">{spot.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <RatingStars rating={spot.rating} size={18} />
              <span className="text-secondary font-medium">{'$'.repeat(spot.priceRange)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditOpen(true)}
              className="text-text-light hover:text-secondary p-2 rounded-lg hover:bg-secondary/5 transition-colors"
            >
              <Pencil className="w-5 h-5" />
            </button>
            <button
              onClick={() => deleteMutation.mutate()}
              className="text-red-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {spot.description && (
          <p className="text-text-light mt-4 leading-relaxed">{spot.description}</p>
        )}

        {spot.location && (
          <p className="flex items-center gap-1.5 mt-4 text-sm text-text-light">
            <MapPin className="w-4 h-4" />
            {spot.location}
          </p>
        )}

        {spot.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {spot.tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-secondary/10 text-secondary rounded-full text-xs">
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <PhotoGallery
        photos={spot.photos}
        initialIndex={galleryIndex}
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />

      <FoodSpotEditModal
        spot={spot}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['foodspots', id] })}
      />
    </div>
  );
}
