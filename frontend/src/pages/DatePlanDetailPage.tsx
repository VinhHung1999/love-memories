import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MapPin, CheckCircle2, Circle, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { datePlansApi } from '../lib/api';
import type { DatePlan, DatePlanStop } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function currentTimeStr(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/** Returns the index of the current active stop (ordered by stop.order).
 *  Current = last stop whose time <= now AND next stop's time > now (or it's the last). */
function getCurrentStopIndex(stops: DatePlanStop[]): number {
  const now = currentTimeStr();
  let current = -1;
  for (let i = 0; i < stops.length; i++) {
    if ((stops[i]?.time ?? '') <= now) current = i;
    else break;
  }
  return current;
}

function googleMapsUrl(stop: DatePlanStop): string {
  if (stop.latitude != null && stop.longitude != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}`;
  }
  if (stop.address) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(stop.address)}`;
  }
  return `https://www.google.com/maps/search/${encodeURIComponent(stop.title)}`;
}

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  planned:   { label: 'Sắp tới',     cls: 'bg-gray-100 text-gray-500' },
  active:    { label: 'Đang diễn ra', cls: 'bg-blue-100 text-blue-600' },
  completed: { label: 'Hoàn thành',  cls: 'bg-green-100 text-green-600' },
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DatePlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: plan, isLoading } = useQuery<DatePlan>({
    queryKey: ['date-plans', id],
    queryFn: () => datePlansApi.get(id!),
    refetchInterval: 60_000, // refresh every 60s to update current-stop indicator
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => datePlansApi.updateStatus(id!, status),
    onSuccess: (updated) => {
      queryClient.setQueryData(['date-plans', id], updated);
      queryClient.invalidateQueries({ queryKey: ['date-plans'] });
      if (updated.status === 'completed') {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        toast.success('Chúc mừng! Buổi hẹn hò hoàn thành! 🎉');
      } else {
        toast.success('Đã cập nhật trạng thái!');
      }
    },
    onError: () => toast.error('Không thể cập nhật'),
  });

  const stopDoneMutation = useMutation({
    mutationFn: ({ stopId }: { stopId: string }) => datePlansApi.markStopDone(id!, stopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['date-plans', id] });
      toast.success('Đã check!');
    },
    onError: () => toast.error('Không thể cập nhật'),
  });

  // Fire confetti once when plan loads and is already completed
  useEffect(() => {
    if (plan?.status === 'completed') {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
  }, [plan?.id, plan?.status]); // only when id or status changes

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-20">
        <p className="text-text-light">Không tìm thấy kế hoạch</p>
        <button onClick={() => navigate('/date-planner')} className="mt-4 text-primary text-sm hover:underline">
          ← Quay lại
        </button>
      </div>
    );
  }

  const stops = [...plan.stops].sort((a, b) => a.order - b.order);
  const doneCount = stops.filter((s) => s.done).length;
  const progress = stops.length > 0 ? Math.round((doneCount / stops.length) * 100) : 0;
  const currentIdx = getCurrentStopIndex(stops);
  const s = STATUS_STYLE[plan.status] ?? { label: 'Sắp tới', cls: 'bg-gray-100 text-gray-500' };
  const allDone = stops.length > 0 && doneCount === stops.length;

  return (
    <div className="max-w-lg mx-auto pb-24">
      {/* Back + header */}
      <button
        onClick={() => navigate('/date-planner')}
        className="flex items-center gap-1.5 text-text-light text-sm mb-4 hover:text-text transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Danh sách kế hoạch
      </button>

      <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-heading text-2xl font-bold truncate">{plan.title}</h1>
            <p className="text-text-light text-sm mt-0.5">
              {new Date(plan.date).toLocaleDateString('vi-VN', {
                weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
              })}
            </p>
          </div>
          <span className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${s.cls}`}>
            {s.label}
          </span>
        </div>
        {plan.notes && (
          <p className="text-text-light text-sm mt-3 pt-3 border-t border-border">{plan.notes}</p>
        )}
      </div>

      {/* Progress */}
      {stops.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-text">Tiến độ</p>
            <p className="text-sm font-semibold text-primary">{doneCount}/{stops.length} địa điểm — {progress}%</p>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Timeline */}
      {stops.length > 0 ? (
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <h2 className="font-heading text-base font-semibold mb-4">Lịch trình</h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-gray-200" />

            <div className="space-y-5">
              {stops.map((stop, i) => {
                const isCurrent = !stop.done && i === currentIdx;
                const isDone = stop.done;

                return (
                  <div key={stop.id} className="flex gap-3 relative">
                    {/* Dot */}
                    <div className="flex-shrink-0 z-10">
                      {isDone ? (
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </div>
                      ) : isCurrent ? (
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center relative">
                          <Circle className="w-4 h-4 text-white fill-white" />
                          {/* Pulse ring */}
                          <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-40" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <Circle className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className={`flex-1 pb-1 rounded-xl p-3 -ml-1 transition-colors ${
                      isCurrent
                        ? 'bg-blue-50 border border-blue-200'
                        : isDone
                        ? 'bg-gray-50'
                        : ''
                    }`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-text-light">{stop.time}</span>
                            <p className={`font-semibold text-sm ${isDone ? 'line-through text-text-light' : isCurrent ? 'text-blue-700' : 'text-text'}`}>
                              {stop.title}
                            </p>
                            {isCurrent && (
                              <span className="px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full font-medium">
                                Hiện tại
                              </span>
                            )}
                          </div>
                          {stop.address && (
                            <p className="text-xs text-text-light mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              {stop.address}
                            </p>
                          )}
                          {stop.notes && (
                            <p className="text-xs text-text-light mt-0.5 italic">{stop.notes}</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          {(stop.address || stop.latitude != null) && (
                            <a
                              href={googleMapsUrl(stop)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-lg hover:bg-secondary/20 transition-colors"
                            >
                              <Navigation className="w-3 h-3" /> Chỉ đường
                            </a>
                          )}
                          {!isDone && (
                            <button
                              onClick={() => stopDoneMutation.mutate({ stopId: stop.id })}
                              disabled={stopDoneMutation.isPending}
                              className="flex items-center gap-1 text-xs bg-green-50 text-green-600 px-2 py-1 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Done
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-4 text-center text-text-light text-sm">
          Chưa có địa điểm nào trong kế hoạch này.
        </div>
      )}

      {/* Status buttons */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        {plan.status === 'planned' && (
          <button
            onClick={() => statusMutation.mutate('active')}
            disabled={statusMutation.isPending}
            className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            🎉 Bắt đầu date!
          </button>
        )}
        {plan.status === 'active' && (
          <div className="space-y-2">
            <button
              onClick={() => statusMutation.mutate('completed')}
              disabled={statusMutation.isPending || !allDone}
              className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold text-sm hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              ✅ Hoàn thành date!
            </button>
            {!allDone && (
              <p className="text-center text-xs text-text-light">
                Đánh dấu hết {stops.length - doneCount} điểm còn lại để hoàn thành
              </p>
            )}
          </div>
        )}
        {plan.status === 'completed' && (
          <div className="text-center py-2">
            <p className="text-2xl mb-2">🎊</p>
            <p className="font-semibold text-green-600">Buổi hẹn hò tuyệt vời!</p>
            <p className="text-xs text-text-light mt-1">Đã hoàn thành — {doneCount}/{stops.length} địa điểm</p>
          </div>
        )}
      </div>
    </div>
  );
}
