import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trophy, Check, Plus, Trash2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { achievementsApi } from '../lib/api';
import type { Achievement } from '../types';
import Modal from '../components/Modal';

const CATEGORY_ORDER = ['moments', 'cooking', 'recipes', 'foodspots', 'goals', 'time', 'custom'] as const;

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  moments:   { label: 'Kỷ niệm',     icon: '📸' },
  cooking:   { label: 'Nấu ăn',      icon: '🍳' },
  recipes:   { label: 'Công thức',   icon: '📝' },
  foodspots: { label: 'Food Spots',  icon: '🍜' },
  goals:     { label: 'Goals',       icon: '🎯' },
  time:      { label: 'Thời gian',   icon: '⏰' },
  custom:    { label: 'Tự tạo',      icon: '✨' },
};

const ICON_PRESETS = ['🏅', '⭐', '💫', '🎖️', '🔥', '💪', '🌈', '🎉', '❤️', '🌸'];

// ── Custom achievement card with toggle + delete ───────────────────────────────

function CustomAchievementCard({
  achievement,
  index,
  onToggle,
  onDelete,
}: {
  achievement: Achievement;
  index: number;
  onToggle: (id: string, unlocked: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
        achievement.unlocked
          ? 'bg-white border-accent/20 shadow-sm'
          : 'bg-gray-50 border-transparent'
      }`}
    >
      {/* Icon — tap to toggle */}
      <button
        onClick={() => achievement.customId && onToggle(achievement.customId, !achievement.unlocked)}
        className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-xl transition-all active:scale-90 ${
          achievement.unlocked ? 'bg-accent/10' : 'bg-gray-100 grayscale opacity-40 hover:opacity-60'
        }`}
        title={achievement.unlocked ? 'Tap to lock' : 'Tap to unlock'}
      >
        {achievement.icon}
      </button>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm ${achievement.unlocked ? 'text-text' : 'text-text-light'}`}>
          {achievement.title}
        </p>
        {achievement.description && (
          <p className="text-xs text-text-light truncate">{achievement.description}</p>
        )}
        {achievement.unlocked && achievement.unlockedAt && (
          <p className="text-xs text-accent mt-0.5">
            {new Date(achievement.unlockedAt).toLocaleDateString('vi-VN', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        )}
      </div>

      {/* Check badge */}
      {achievement.unlocked && (
        <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        </div>
      )}

      {/* Delete */}
      <button
        onClick={() => achievement.customId && onDelete(achievement.customId)}
        className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
        title="Xóa"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

// ── Standard achievement card ──────────────────────────────────────────────────

function AchievementCard({ achievement, index }: { achievement: Achievement; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
        achievement.unlocked
          ? 'bg-white border-accent/20 shadow-sm'
          : 'bg-gray-50 border-transparent'
      }`}
    >
      <div
        className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-xl ${
          achievement.unlocked ? 'bg-accent/10' : 'bg-gray-100 grayscale opacity-40'
        }`}
      >
        {achievement.icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm ${achievement.unlocked ? 'text-text' : 'text-text-light'}`}>
          {achievement.title}
        </p>
        <p className="text-xs text-text-light truncate">
          {achievement.unlocked ? achievement.description : 'Chưa mở khóa'}
        </p>
        {achievement.unlocked && achievement.unlockedAt && (
          <p className="text-xs text-accent mt-0.5">
            {new Date(achievement.unlockedAt).toLocaleDateString('vi-VN', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        )}
      </div>

      {achievement.unlocked && (
        <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        </div>
      )}
    </motion.div>
  );
}

// ── Create custom achievement modal ───────────────────────────────────────────

function CreateCustomModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🏅');

  const mutation = useMutation({
    mutationFn: () => achievementsApi.createCustom({ title: title.trim(), description: description.trim() || undefined, icon }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      toast.success('Achievement đã tạo!');
      onClose();
      setTitle(''); setDescription(''); setIcon('🏅');
    },
    onError: () => toast.error('Không thể tạo achievement'),
  });

  return (
    <Modal open={open} onClose={onClose} title="Tạo Achievement">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Icon</label>
          <div className="flex gap-2 flex-wrap">
            {ICON_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => setIcon(preset)}
                className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all ${
                  icon === preset ? 'bg-accent/20 ring-2 ring-accent' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Tên *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Ngày đặc biệt"
            autoFocus
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            onKeyDown={(e) => { if (e.key === 'Enter' && title.trim()) mutation.mutate(); }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Mô tả</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tùy chọn..."
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 flex items-center justify-center gap-1.5 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors">
            <X className="w-4 h-4" /> Hủy
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !title.trim()}
            className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-white rounded-xl py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {mutation.isPending
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><Plus className="w-4 h-4" /> Tạo</>
            }
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AchievementsPage() {
  const queryClient = useQueryClient();
  const { data: achievements = [], isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: achievementsApi.list,
  });

  const [showCreate, setShowCreate] = useState(false);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const total = achievements.length;
  const progress = total > 0 ? Math.round((unlockedCount / total) * 100) : 0;

  // Fire confetti for achievements not yet celebrated
  const hasTriggered = useRef(false);
  useEffect(() => {
    if (hasTriggered.current || achievements.length === 0) return;
    hasTriggered.current = true;
    try {
      const seen: string[] = JSON.parse(localStorage.getItem('achievements_seen') ?? '[]');
      const newlyUnlocked = achievements.filter((a) => a.unlocked && !seen.includes(a.key));
      if (newlyUnlocked.length > 0) {
        confetti({ particleCount: 80, spread: 65, origin: { y: 0.6 } });
        localStorage.setItem(
          'achievements_seen',
          JSON.stringify([...seen, ...newlyUnlocked.map((a) => a.key)])
        );
      }
    } catch { /* localStorage unavailable */ }
  }, [achievements]);

  const toggleMutation = useMutation({
    mutationFn: ({ id, unlocked }: { id: string; unlocked: boolean }) =>
      achievementsApi.updateCustom(id, { unlocked }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['achievements'] }),
    onError: () => toast.error('Không thể cập nhật'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => achievementsApi.deleteCustom(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      toast.success('Đã xóa');
    },
    onError: () => toast.error('Không thể xóa'),
  });

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="w-6 h-6 text-secondary" />
          <h1 className="font-heading text-3xl font-bold">Achievements</h1>
        </div>
        <p className="text-text-light text-sm">
          {unlockedCount}/{total} đã mở khóa
        </p>
      </div>

      {/* Overall progress bar */}
      <div className="mb-6">
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-secondary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <p className="text-right text-xs text-text-light mt-1">{progress}% hoàn thành</p>
      </div>

      {/* Category groups */}
      <div className="space-y-6">
        {CATEGORY_ORDER.map((cat) => {
          const group = achievements.filter((a) => a.category === cat);
          const meta = CATEGORY_META[cat];
          if (!meta) return null;

          // Custom category: always show (even if empty) — has add button
          if (cat === 'custom') {
            const catUnlocked = group.filter((a) => a.unlocked).length;
            return (
              <div key={cat}>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-base">{meta.icon}</span>
                  <h2 className="text-sm font-semibold text-text-light uppercase tracking-wide flex-1">
                    {meta.label}
                  </h2>
                  <span className="text-xs text-text-light mr-2">{catUnlocked}/{group.length}</span>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-1 text-xs text-primary border border-primary/30 px-2 py-1 rounded-lg hover:bg-primary/5 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Thêm
                  </button>
                </div>
                <div className="space-y-2">
                  {group.map((achievement, i) => (
                    <CustomAchievementCard
                      key={achievement.key}
                      achievement={achievement}
                      index={i}
                      onToggle={(id, unlocked) => toggleMutation.mutate({ id, unlocked })}
                      onDelete={(id) => deleteMutation.mutate(id)}
                    />
                  ))}
                  {group.length === 0 && (
                    <div className="text-center py-6 text-text-light text-sm">
                      <p>Chưa có achievement tự tạo</p>
                      <button onClick={() => setShowCreate(true)} className="mt-2 text-primary text-xs underline">
                        Tạo ngay
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          if (group.length === 0) return null;
          const catUnlocked = group.filter((a) => a.unlocked).length;

          return (
            <div key={cat}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-base">{meta.icon}</span>
                <h2 className="text-sm font-semibold text-text-light uppercase tracking-wide flex-1">
                  {meta.label}
                </h2>
                <span className="text-xs text-text-light">{catUnlocked}/{group.length}</span>
              </div>
              <div className="space-y-2">
                {group.map((achievement, i) => (
                  <AchievementCard key={achievement.key} achievement={achievement} index={i} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <CreateCustomModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
