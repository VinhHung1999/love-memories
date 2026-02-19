import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, MapPin, Tag, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { momentsApi } from '../lib/api';

export default function MomentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-64 bg-gray-200 rounded-2xl" /><div className="h-8 bg-gray-200 rounded w-1/3" /></div>;
  if (!moment) return <div className="text-center py-16 text-text-light">Moment not found</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate('/moments')} className="flex items-center gap-2 text-text-light hover:text-primary mb-4 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Moments
      </button>

      {/* Photo Gallery */}
      {moment.photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {moment.photos.map((photo, i) => (
            <div key={photo.id} className={`relative rounded-2xl overflow-hidden group ${i === 0 ? 'col-span-2 row-span-2' : ''}`}>
              <img src={photo.url} alt="" className="w-full h-full object-cover min-h-[200px]" />
              <button
                onClick={() => deletePhotoMutation.mutate(photo.id)}
                className="absolute top-2 right-2 bg-red-500/80 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <h1 className="font-heading text-3xl font-bold">{moment.title}</h1>
          <button
            onClick={() => deleteMutation.mutate()}
            className="text-red-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
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
    </div>
  );
}
