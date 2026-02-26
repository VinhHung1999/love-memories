import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { UtensilsCrossed, ChefHat, Clock, ArrowLeft, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { cookingSessionsApi } from '../lib/api';
import type { CookingSession } from '../types';
import { GridSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

function formatDuration(ms: number | null): string {
  if (!ms) return '—';
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}g ${m}p`;
  if (m > 0) return `${m}p ${s}s`;
  return `${s}s`;
}

function StarDisplay({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3 h-3 ${s <= rating ? 'text-amber-400' : 'text-gray-200'}`}
          fill={s <= rating ? 'currentColor' : 'none'}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

export default function CookingSessionHistory() {
  const navigate = useNavigate();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['cooking-sessions'],
    queryFn: cookingSessionsApi.list,
  });

  const completed = sessions.filter((s) => s.status === 'completed');

  // Summary stats
  const totalSessions = completed.length;
  const rated = completed.filter((s) => s.rating != null);
  const avgRating = rated.length > 0
    ? rated.reduce((sum, s) => sum + (s.rating ?? 0), 0) / rated.length
    : null;
  const timed = completed.filter((s) => s.totalTimeMs != null);
  const avgTimeMs = timed.length > 0
    ? timed.reduce((sum, s) => sum + (s.totalTimeMs ?? 0), 0) / timed.length
    : null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/what-to-eat')}
          className="flex items-center gap-1.5 text-sm text-text-light hover:text-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      <div className="mb-4">
        <h1 className="font-heading text-3xl font-bold">Lịch sử nấu ăn</h1>
      </div>

      {/* Stats summary */}
      {totalSessions > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
            <p className="font-bold text-xl text-primary">{totalSessions}</p>
            <p className="text-xs text-text-light mt-0.5">Phiên nấu</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
            <div className="flex items-center justify-center gap-0.5 mb-0.5">
              <span className="font-bold text-xl text-amber-500">
                {avgRating != null ? avgRating.toFixed(1) : '—'}
              </span>
              {avgRating != null && <Star className="w-4 h-4 text-amber-400" fill="currentColor" strokeWidth={1.5} />}
            </div>
            <p className="text-xs text-text-light">Đánh giá TB</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
            <p className="font-bold text-xl text-secondary leading-tight">
              {formatDuration(avgTimeMs)}
            </p>
            <p className="text-xs text-text-light mt-0.5">Thời gian TB</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <GridSkeleton count={3} />
      ) : completed.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="Chưa có phiên nào"
          description="Hoàn thành phiên nấu ăn đầu tiên để xem lịch sử"
          action={{ label: 'Bắt đầu nấu ăn', onClick: () => navigate('/what-to-eat') }}
        />
      ) : (
        <div className="space-y-3">
          {completed.map((session, i) => (
            <HistoryCard key={session.id} session={session} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryCard({ session, index }: { session: CookingSession; index: number }) {
  const dishNames = session.recipes.map((r) => r.recipe.title).join(', ') || 'Phiên nấu ăn';

  const date = session.completedAt
    ? new Date(session.completedAt).toLocaleDateString('vi-VN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  const thumbnail = session.photos[0]?.url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/what-to-eat/${session.id}`}
        className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow group"
      >
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ChefHat className="w-7 h-7 text-gray-300" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-base truncate">{dishNames}</p>
          <p className="text-text-light text-xs mt-0.5">{date}</p>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-text-light flex-wrap">
            <span>{session.recipes.length} món</span>
            {session.totalTimeMs != null && (
              <>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />
                  {formatDuration(session.totalTimeMs)}
                </span>
              </>
            )}
            {session.photos.length > 0 && (
              <>
                <span>·</span>
                <span>📸 {session.photos.length}</span>
              </>
            )}
            {session.rating != null && (
              <>
                <span>·</span>
                <StarDisplay rating={session.rating} />
              </>
            )}
          </div>
        </div>

        {/* Arrow hint */}
        <div className="text-gray-300 group-hover:text-gray-400 transition-colors flex-shrink-0">
          ›
        </div>
      </Link>
    </motion.div>
  );
}
