import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, AlertCircle, Calendar, MapPin, Navigation, Tag, Trash2, Pencil, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { momentsApi } from '../lib/api';
import PhotoGallery from '../components/PhotoGallery';
import MomentEditModal from '../components/MomentEditModal';
import Modal from '../components/Modal';

export default function MomentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | undefined>(undefined);

  const { data: moment, isLoading } = useQuery({
    queryKey: ['moments', id],
    queryFn: () => momentsApi.get(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => momentsApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moments'] });
      toast.success('Moment deleted');
      navigate('/moments');
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: (photoId: string) => momentsApi.deletePhoto(id!, photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moments', id] });
      toast.success('Photo deleted');
    },
  });

  const uploadPhotosMutation = useMutation({
    mutationFn: (files: File[]) => momentsApi.uploadPhotos(id!, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moments', id] });
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
  if (!moment) return <div className="text-center py-16 text-text-light">Moment not found</div>;

  const [heroPhoto, ...thumbPhotos] = moment.photos;

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate('/moments')} className="flex items-center gap-2 text-text-light hover:text-primary mb-4 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Moments
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
              onClick={(e) => { e.stopPropagation(); deletePhotoMutation.mutate(heroPhoto.id); }}
              className="absolute top-2 right-2 bg-red-500/80 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
                    onClick={(e) => { e.stopPropagation(); deletePhotoMutation.mutate(photo.id); }}
                    className="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
          className="flex items-center gap-2 text-sm text-primary border border-primary/30 px-4 py-2 rounded-xl hover:bg-primary/5 transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {uploadPhotosMutation.isPending ? 'Uploading...' : 'Add Photos'}
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <h1 className="font-heading text-3xl font-bold">{moment.title}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditOpen(true)}
              className="text-text-light hover:text-primary p-2 rounded-lg hover:bg-primary/5 transition-colors"
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

        {moment.caption && (
          <p className="text-text-light mt-3 leading-relaxed">{moment.caption}</p>
        )}

        <div className="flex flex-wrap gap-4 mt-4 text-sm text-text-light">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {format(new Date(moment.date), 'MMMM d, yyyy')}
          </span>
          {moment.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {moment.location}
            </span>
          )}
          {moment.latitude != null && moment.longitude != null && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${moment.latitude},${moment.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium hover:bg-primary/20 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              Chỉ đường
            </a>
          )}
        </div>

        {moment.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {moment.tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs">
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

      </div>

      {confirmDelete && (
        <Modal open={true} onClose={() => setConfirmDelete(false)} title="Delete Moment?">
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-red-50 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">Delete "{moment.title}"?</p>
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
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Moment'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      <PhotoGallery
        photos={moment.photos}
        initialIndex={galleryIndex}
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />

      <MomentEditModal
        moment={moment}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['moments', id] })}
      />
    </div>
  );
}
