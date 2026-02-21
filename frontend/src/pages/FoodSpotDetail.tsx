import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, AlertCircle, MapPin, Navigation, Tag, Trash2, Pencil, Plus, ChefHat } from 'lucide-react';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { foodSpotsApi, recipesApi } from '../lib/api';
import RatingStars from '../components/RatingStars';
import PhotoGallery from '../components/PhotoGallery';
import FoodSpotEditModal from '../components/FoodSpotEditModal';
import Modal from '../components/Modal';

export default function FoodSpotDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | undefined>(undefined);

  const { data: spot, isLoading } = useQuery({
    queryKey: ['foodspots', id],
    queryFn: () => foodSpotsApi.get(id!),
    enabled: !!id,
  });

  const { data: allRecipes = [] } = useQuery({
    queryKey: ['recipes'],
    queryFn: recipesApi.list,
    enabled: !!id,
  });
  const linkedRecipes = allRecipes.filter((r) => r.foodSpotId === id);

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

  const [heroPhoto, ...thumbPhotos] = spot.photos;

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate('/foodspots')} className="flex items-center gap-2 text-text-light hover:text-secondary mb-4 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Food Spots
      </button>

      {/* Photo Layout: hero + thumbnail strip */}
      {heroPhoto && (
        <div className="mb-6 space-y-2">
          {/* Hero — first photo full width */}
          <div
            className="relative rounded-2xl overflow-hidden group cursor-pointer"
            onClick={() => openGallery(0)}
          >
            <img src={heroPhoto.url} alt="" className="w-full h-64 md:h-80 object-cover" />
            <button
              onClick={(e) => { e.stopPropagation(); if (window.confirm('Xóa ảnh này?')) deletePhotoMutation.mutate(heroPhoto.id); }}
              className="absolute top-2 right-2 bg-red-500/80 text-white p-1.5 rounded-full md:opacity-0 md:group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* Thumbnail strip */}
          {thumbPhotos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {thumbPhotos.map((photo, i) => (
                <div
                  key={photo.id}
                  className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden group cursor-pointer"
                  onClick={() => openGallery(i + 1)}
                >
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={(e) => { e.stopPropagation(); if (window.confirm('Xóa ảnh này?')) deletePhotoMutation.mutate(photo.id); }}
                    className="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-full md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
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
              onClick={() => setConfirmDelete(true)}
              className="text-red-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {spot.description && (
          <p className="text-text-light mt-4 leading-relaxed">{spot.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-3 mt-4">
          {spot.location && (
            <p className="flex items-center gap-1.5 text-sm text-text-light">
              <MapPin className="w-4 h-4" />
              {spot.location}
            </p>
          )}
          {spot.latitude != null && spot.longitude != null && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-medium hover:bg-secondary/20 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              Chỉ đường
            </a>
          )}
        </div>

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

      {/* Linked Recipes */}
      {linkedRecipes.length > 0 && (
        <div className="mt-6">
          <h2 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-accent" />
            Recipes từ quán này
          </h2>
          <div className="space-y-3">
            {linkedRecipes.map((recipe) => (
              <Link
                key={recipe.id}
                to={`/recipes/${recipe.id}`}
                className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                {recipe.photos[0] ? (
                  <img src={recipe.photos[0].url} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <ChefHat className="w-6 h-6 text-accent" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{recipe.title}</p>
                  {recipe.description && (
                    <p className="text-xs text-text-light mt-0.5 truncate">{recipe.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1 text-xs text-text-light">
                    {recipe.ingredients.length > 0 && <span>{recipe.ingredients.length} nguyên liệu</span>}
                    {recipe.steps.length > 0 && <span>· {recipe.steps.length} bước</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {confirmDelete && (
        <Modal open={true} onClose={() => setConfirmDelete(false)} title="Delete Food Spot?">
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-red-50 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">Delete "{spot.name}"?</p>
                <p>All photos will also be deleted. This cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-red-600 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Food Spot'}
              </button>
            </div>
          </div>
        </Modal>
      )}

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
