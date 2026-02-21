import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { UtensilsCrossed, ChefHat, Clock, ArrowLeft } from 'lucide-react';
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

export default function CookingSessionHistory() {
  const navigate = useNavigate();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['cooking-sessions'],
    queryFn: cookingSessionsApi.list,
  });

  const completed = sessions.filter((s) => s.status === 'completed');

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

      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold">Lịch sử nấu ăn</h1>
        <p className="text-text-light text-sm mt-1">
          {completed.length} phiên đã hoàn thành
        </p>
      </div>

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
          <div className="flex items-center gap-3 mt-1.5 text-xs text-text-light">
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
