import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Heart, Calendar, MapPin, BookOpen, Mail } from 'lucide-react';

const API = '/api';

interface SharedData {
  type: string;
  data: Record<string, unknown>;
  coupleName: string | null;
  sharedAt: string;
}

export default function ShareViewerPage() {
  const { token } = useParams<{ token: string }>();
  const [shared, setShared] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/share/${token}`)
      .then((res) => {
        if (res.status === 410) throw new Error('Link đã hết hạn');
        if (!res.ok) throw new Error('Không tìm thấy');
        return res.json();
      })
      .then(setShared)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-[#E8788A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !shared) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-gray-700">{error || 'Không tìm thấy'}</h1>
          <p className="text-sm text-gray-500 mt-1">Link chia sẻ không hợp lệ hoặc đã bị thu hồi.</p>
        </div>
      </div>
    );
  }

  const { type, data, coupleName } = shared;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8788A]/5 via-white to-[#F4A261]/5">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 text-xs text-gray-400">
            <Heart className="w-3 h-3" />
            Shared from {coupleName || 'Memoura'}
          </div>
        </div>

        {type === 'moment' && <MomentView data={data} shareToken={token!} />}
        {type === 'letter' && <LetterView data={data} />}
        {type === 'recipe' && <RecipeView data={data} shareToken={token!} />}
      </div>
    </div>
  );
}

function MomentView({ data, shareToken }: { data: Record<string, unknown>; shareToken: string }) {
  const photos = (data.photos as Array<{ url: string }>) || [];
  const title = data.title as string;
  const caption = data.caption as string | null;
  const date = data.date as string;
  const location = data.location as string | null;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {photos.length > 0 && (
        <div className="relative">
          <img
            src={proxyImageUrl(shareToken, photos[0]!.url)}
            alt={title}
            className="w-full aspect-[4/3] object-cover"
          />
          {photos.length > 1 && (
            <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
              +{photos.length - 1} ảnh
            </div>
          )}
        </div>
      )}
      <div className="p-5 space-y-3">
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {caption && <p className="text-sm text-gray-600">{caption}</p>}
        <div className="flex flex-wrap gap-3 text-xs text-gray-400">
          {date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(date).toLocaleDateString('vi-VN')}
            </span>
          )}
          {location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function LetterView({ data }: { data: Record<string, unknown> }) {
  const title = data.title as string;
  const content = data.content as string;
  const sender = data.sender as { name: string } | undefined;
  const mood = data.mood as string | null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
      <div className="flex items-center gap-2 text-[#E8788A]">
        <Mail className="w-5 h-5" />
        <span className="text-sm font-medium">Thư tình {mood ? `· ${mood}` : ''}</span>
      </div>
      <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{content}</div>
      {sender && (
        <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
          Gửi bởi {sender.name}
        </p>
      )}
    </div>
  );
}

function RecipeView({ data, shareToken }: { data: Record<string, unknown>; shareToken: string }) {
  const title = data.title as string;
  const description = data.description as string | null;
  const ingredients = (data.ingredients as string[]) || [];
  const steps = (data.steps as string[]) || [];
  const photos = (data.photos as Array<{ url: string }>) || [];

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {photos.length > 0 && (
        <img
          src={proxyImageUrl(shareToken, photos[0]!.url)}
          alt={title}
          className="w-full aspect-video object-cover"
        />
      )}
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-[#F4A261]">
          <BookOpen className="w-5 h-5" />
          <span className="text-sm font-medium">Công thức</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {description && <p className="text-sm text-gray-600">{description}</p>}
        {ingredients.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Nguyên liệu</h3>
            <ul className="space-y-1">
              {ingredients.map((ing, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-[#E8788A] mt-1">•</span> {ing}
                </li>
              ))}
            </ul>
          </div>
        )}
        {steps.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Cách làm</h3>
            <ol className="space-y-2">
              {steps.map((step, i) => (
                <li key={i} className="text-sm text-gray-600 flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#E8788A]/10 text-[#E8788A] text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

function proxyImageUrl(shareToken: string, cdnUrl: string): string {
  return `/api/share/${shareToken}/image?url=${encodeURIComponent(cdnUrl)}`;
}
