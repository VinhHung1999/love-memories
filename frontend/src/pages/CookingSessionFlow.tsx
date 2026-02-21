import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChefHat, ArrowLeft, ArrowRight, Check, ShoppingCart, Timer, Camera, ExternalLink, X, Youtube, Facebook, Music2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cookingSessionsApi } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { CookingSession, CookingSessionItem, CookingSessionStep } from '../types';

// Phase components will be implemented in Tasks 3, 4, 5
// This file acts as the phase router — each task fills in its phase

export default function CookingSessionFlow() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: session, isLoading, isError } = useQuery({
    queryKey: ['cooking-session', id],
    queryFn: () => cookingSessionsApi.get(id!),
    // Poll every 3s during active phases to sync between devices
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && status !== 'completed' ? 3000 : false;
    },
    enabled: !!id,
  });

  const invalidateActive = () => {
    queryClient.invalidateQueries({ queryKey: ['cooking-sessions', 'active'] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !session) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <ChefHat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-text-light">Không tìm thấy phiên nấu ăn này.</p>
        <button
          onClick={() => navigate('/what-to-eat')}
          className="mt-4 text-primary text-sm font-medium hover:underline"
        >
          Về trang chọn món
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Phase router — expand each case in Tasks 3, 4, 5 */}
      {session.status === 'selecting' && (
        <SelectingPhase session={session} onAdvance={invalidateActive} />
      )}
      {session.status === 'shopping' && (
        <ShoppingPhase session={session} />
      )}
      {session.status === 'cooking' && (
        <CookingPhase session={session} />
      )}
      {session.status === 'photo' && (
        <PhotoPhase session={session} />
      )}
      {session.status === 'completed' && (
        <CompletedPhase session={session} />
      )}
    </div>
  );
}

// ─── Selecting phase: review selection + "Go Shopping" ───────────────────────

function SelectingPhase({
  session,
  onAdvance,
}: {
  session: CookingSession;
  onAdvance: () => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [advancing, setAdvancing] = useState(false);
  const { cancel, cancelling } = useCancelSession(session.id);

  const handleAdvance = async () => {
    setAdvancing(true);
    try {
      await cookingSessionsApi.updateStatus(session.id, 'shopping');
      queryClient.invalidateQueries({ queryKey: ['cooking-session', session.id] });
      onAdvance();
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/what-to-eat')}
          className="flex items-center gap-1.5 text-sm text-text-light hover:text-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Chọn lại món
        </button>
        <button
          onClick={cancel}
          disabled={cancelling}
          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-500 transition-colors disabled:opacity-50"
        >
          <X className="w-3.5 h-3.5" /> Hủy phiên
        </button>
      </div>

      <h1 className="font-heading text-2xl font-bold mb-1">Danh sách hôm nay</h1>
      <p className="text-text-light text-sm mb-6">
        {session.recipes.length} món • {session.items.length} nguyên liệu cần mua
      </p>

      <div className="space-y-3 mb-6">
        {session.recipes.map(({ recipe, order }) => (
          <div key={recipe.id} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
              {recipe.photos?.[0] ? (
                <img src={recipe.photos[0].url} alt={recipe.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-gray-300" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{recipe.title}</p>
              <p className="text-xs text-text-light">
                {recipe.ingredients.length} nguyên liệu • {recipe.steps.length} bước
              </p>
            </div>
            <span className="text-xs text-text-light flex-shrink-0">#{order + 1}</span>
          </div>
        ))}
      </div>

      <button
        onClick={handleAdvance}
        disabled={advancing}
        className="w-full flex items-center justify-center gap-2 bg-secondary text-white py-3.5 rounded-2xl font-semibold text-base shadow-lg shadow-secondary/25 hover:bg-secondary/90 active:scale-95 transition-all disabled:opacity-60"
      >
        {advancing ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>🛒 Bắt đầu đi chợ!</>
        )}
      </button>
    </div>
  );
}

// ─── Shopping phase ───────────────────────────────────────────────────────────

function ShoppingPhase({ session }: { session: CookingSession }) {
  const queryClient = useQueryClient();
  const [advancing, setAdvancing] = useState(false);
  const { cancel, cancelling } = useCancelSession(session.id);

  const checkedCount = session.items.filter((i) => i.checked).length;
  const total = session.items.length;
  const progress = total > 0 ? Math.round((checkedCount / total) * 100) : 0;

  const toggleItem = async (item: CookingSessionItem) => {
    const nextChecked = !item.checked;
    // Optimistic update
    queryClient.setQueryData(
      ['cooking-session', session.id],
      (old: CookingSession | undefined) =>
        old
          ? {
              ...old,
              items: old.items.map((it) =>
                it.id === item.id
                  ? { ...it, checked: nextChecked, checkedAt: nextChecked ? new Date().toISOString() : null }
                  : it
              ),
            }
          : old
    );
    try {
      await cookingSessionsApi.toggleItem(session.id, item.id, nextChecked);
    } catch {
      // Revert — next 3s poll will also reconcile
      queryClient.invalidateQueries({ queryKey: ['cooking-session', session.id] });
    }
  };

  const handleAdvance = async () => {
    setAdvancing(true);
    try {
      await cookingSessionsApi.updateStatus(session.id, 'cooking');
      queryClient.invalidateQueries({ queryKey: ['cooking-session', session.id] });
      queryClient.invalidateQueries({ queryKey: ['cooking-sessions', 'active'] });
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <ShoppingCart className="w-5 h-5 text-secondary" />
            <h1 className="font-heading text-2xl font-bold">Shopping List</h1>
          </div>
          <p className="text-text-light text-sm pl-7 truncate">
            {session.recipes.map((r) => r.recipe.title).join(', ')}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 ml-3 flex-shrink-0">
          <div className="text-right">
            <p className="font-bold text-xl text-secondary leading-none">
              {checkedCount}<span className="text-text-light font-normal text-base">/{total}</span>
            </p>
            <p className="text-xs text-text-light">items</p>
          </div>
          <button
            onClick={cancel}
            disabled={cancelling}
            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-500 transition-colors disabled:opacity-50"
          >
            <X className="w-3 h-3" /> Hủy phiên
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 mb-6">
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-secondary rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-right text-xs text-text-light mt-1">{progress}% hoàn thành</p>
      </div>

      {/* Ingredient checklist */}
      <div className="space-y-2 mb-8">
        {session.items.map((item) => (
          <button
            key={item.id}
            onClick={() => toggleItem(item)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all active:scale-[0.98] ${
              item.checked
                ? 'bg-secondary/8 border border-secondary/25'
                : 'bg-white border border-transparent shadow-sm hover:shadow-md'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                item.checked ? 'bg-secondary border-secondary' : 'border-gray-300'
              }`}
            >
              {item.checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </div>
            <span
              className={`flex-1 text-sm font-medium transition-colors duration-150 ${
                item.checked ? 'line-through text-text-light' : 'text-text'
              }`}
            >
              {item.ingredient}
            </span>
          </button>
        ))}
      </div>

      {/* Done Shopping button */}
      <button
        onClick={handleAdvance}
        disabled={advancing}
        className="w-full flex items-center justify-center gap-2 bg-secondary text-white py-3.5 rounded-2xl font-semibold text-base shadow-lg shadow-secondary/20 hover:bg-secondary/90 active:scale-95 transition-all disabled:opacity-60"
      >
        {advancing ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            {checkedCount === total && total > 0 ? <Check className="w-5 h-5" /> : '🛒'}
            <span>Done Shopping!</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

type PlatformInfo =
  | { type: 'youtube'; embedUrl: string; url: string }
  | { type: 'tiktok'; url: string }
  | { type: 'facebook'; url: string }
  | { type: 'link'; url: string };

function getPlatformInfo(url: string): PlatformInfo {
  try {
    const u = new URL(url);
    const hostname = u.hostname.replace('www.', '');
    if (hostname === 'youtube.com' || hostname === 'youtu.be') {
      let embedUrl = '';
      if (hostname === 'youtu.be') {
        embedUrl = `https://www.youtube.com/embed${u.pathname}`;
      } else if (u.pathname === '/watch') {
        const v = u.searchParams.get('v');
        if (v) embedUrl = `https://www.youtube.com/embed/${v}`;
      } else if (u.pathname.startsWith('/embed/')) {
        embedUrl = url;
      }
      if (embedUrl) return { type: 'youtube', embedUrl, url };
    }
    if (hostname === 'tiktok.com' || hostname === 'vm.tiktok.com') {
      return { type: 'tiktok', url };
    }
    if (hostname === 'facebook.com' || hostname === 'fb.com' || hostname === 'fb.watch') {
      return { type: 'facebook', url };
    }
  } catch { /* invalid URL */ }
  return { type: 'link', url };
}

function useCancelSession(sessionId: string) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancelling, setCancelling] = useState(false);
  const cancel = async () => {
    if (!window.confirm('Hủy phiên nấu ăn này? Mọi tiến trình sẽ bị xóa.')) return;
    setCancelling(true);
    try {
      await cookingSessionsApi.delete(sessionId);
      queryClient.invalidateQueries({ queryKey: ['cooking-sessions', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['cooking-sessions'] });
      navigate('/what-to-eat');
    } catch {
      toast.error('Không thể hủy phiên');
      setCancelling(false);
    }
  };
  return { cancel, cancelling };
}

function formatMmSs(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Cooking phase ────────────────────────────────────────────────────────────

function formatElapsed(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

type TimerState = { remaining: number; running: boolean; done: boolean };

function CookingPhase({ session }: { session: CookingSession }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [advancing, setAdvancing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const { cancel, cancelling } = useCancelSession(session.id);
  const [timers, setTimers] = useState<Record<string, TimerState>>({});
  const timerIntervals = useRef<Record<string, ReturnType<typeof setInterval>>>({});
  const [videoOpen, setVideoOpen] = useState<Record<string, boolean>>({});

  // Cleanup all intervals on unmount
  useEffect(() => {
    const intervals = timerIntervals.current;
    return () => { Object.values(intervals).forEach(clearInterval); };
  }, []);

  // Elapsed timer — useState feeds JSX, not useRef
  useEffect(() => {
    if (!session.startedAt) return;
    const start = new Date(session.startedAt).getTime();
    const tick = () => setElapsed(Date.now() - start);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session.startedAt]);

  // Group steps by recipe, sorted by stepIndex
  const stepsByRecipe = session.recipes
    .slice()
    .sort((a, b) => a.order - b.order)
    .map(({ recipe }) => ({
      recipe,
      steps: session.steps
        .filter((s) => s.recipeId === recipe.id)
        .sort((a, b) => a.stepIndex - b.stepIndex),
    }));

  const totalSteps = session.steps.length;
  const checkedCount = session.steps.filter((s) => s.checked).length;
  const allDone = totalSteps > 0 && checkedCount === totalSteps;

  // Optimistic toggle
  const doToggleStep = async (step: CookingSessionStep, checked: boolean, checkedBy?: string) => {
    queryClient.setQueryData(
      ['cooking-session', session.id],
      (old: CookingSession | undefined) =>
        old
          ? {
              ...old,
              steps: old.steps.map((s) =>
                s.id === step.id
                  ? {
                      ...s,
                      checked,
                      checkedBy: checked ? (checkedBy ?? null) : null,
                      checkedAt: checked ? new Date().toISOString() : null,
                    }
                  : s
              ),
            }
          : old
    );
    try {
      await cookingSessionsApi.toggleStep(session.id, step.id, checked, checkedBy);
    } catch {
      queryClient.invalidateQueries({ queryKey: ['cooking-session', session.id] });
    }
  };

  const handleStepClick = (step: CookingSessionStep) => {
    if (step.checked) {
      doToggleStep(step, false);
    } else {
      doToggleStep(step, true, user?.name ?? undefined);
    }
  };

  const startTimer = (step: CookingSessionStep) => {
    if (!step.durationSeconds) return;
    if (timerIntervals.current[step.id]) clearInterval(timerIntervals.current[step.id]);
    setTimers((prev) => ({ ...prev, [step.id]: { remaining: step.durationSeconds!, running: true, done: false } }));
    timerIntervals.current[step.id] = setInterval(() => {
      setTimers((prev) => {
        const curr = prev[step.id];
        if (!curr || !curr.running) return prev;
        const next = curr.remaining - 1;
        if (next <= 0) {
          clearInterval(timerIntervals.current[step.id]);
          if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
          return { ...prev, [step.id]: { remaining: 0, running: false, done: true } };
        }
        return { ...prev, [step.id]: { ...curr, remaining: next } };
      });
    }, 1000);
  };

  const resetTimer = (stepId: string) => {
    if (timerIntervals.current[stepId]) clearInterval(timerIntervals.current[stepId]);
    setTimers((prev) => { const n = { ...prev }; delete n[stepId]; return n; });
  };

  const handleAdvance = async () => {
    setAdvancing(true);
    try {
      await cookingSessionsApi.updateStatus(session.id, 'photo');
      queryClient.invalidateQueries({ queryKey: ['cooking-session', session.id] });
      queryClient.invalidateQueries({ queryKey: ['cooking-sessions', 'active'] });
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Header — title + elapsed timer */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xl">🍳</span>
            <h1 className="font-heading text-2xl font-bold">Let's Cook!</h1>
          </div>
          <p className="text-text-light text-sm">
            {checkedCount}/{totalSteps} bước hoàn thành
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <div className="flex items-center gap-1.5 bg-primary/8 text-primary px-3 py-1.5 rounded-xl">
            <Timer className="w-4 h-4" />
            <span className="font-mono font-bold text-base tabular-nums">{formatElapsed(elapsed)}</span>
          </div>
          <button
            onClick={cancel}
            disabled={cancelling}
            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-500 transition-colors disabled:opacity-50"
          >
            <X className="w-3 h-3" /> Hủy phiên
          </button>
        </div>
      </div>

      {/* Per-recipe sections */}
      <div className="space-y-8 mb-8">
        {stepsByRecipe.map(({ recipe, steps }) => {
          const recipeChecked = steps.filter((s) => s.checked).length;
          const recipeDone = steps.length > 0 && recipeChecked === steps.length;

          return (
            <div key={recipe.id}>
              {/* Recipe header */}
              <div
                className={`flex items-center gap-3 p-3 rounded-xl mb-3 transition-colors duration-300 ${
                  recipeDone ? 'bg-green-50 border border-green-200/60' : 'bg-gray-50'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                  {recipe.photos?.[0] ? (
                    <img
                      src={recipe.photos[0].url}
                      alt={recipe.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ChefHat className="w-5 h-5 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold text-sm truncate">{recipe.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-text-light">
                      {recipeChecked}/{steps.length} bước
                    </p>
                    {recipe.tutorialUrl && (() => {
                      const platform = getPlatformInfo(recipe.tutorialUrl);
                      if (platform.type === 'youtube') return (
                        <div onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setVideoOpen((p) => ({ ...p, [recipe.id]: !p[recipe.id] }))}
                            className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors mt-0.5"
                          >
                            <Youtube className="w-3.5 h-3.5" />
                            {videoOpen[recipe.id] ? 'Ẩn video' : 'Xem video hướng dẫn'}
                          </button>
                          {videoOpen[recipe.id] && (
                            <div className="relative w-full rounded-xl overflow-hidden mt-2" style={{ paddingBottom: '56.25%' }}>
                              <iframe
                                src={platform.embedUrl}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="absolute inset-0 w-full h-full border-0"
                                title="Tutorial video"
                              />
                            </div>
                          )}
                        </div>
                      );
                      if (platform.type === 'tiktok') return (
                        <a href={recipe.tutorialUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs text-text-light hover:text-text transition-colors mt-0.5">
                          <Music2 className="w-3 h-3" /> TikTok
                        </a>
                      );
                      if (platform.type === 'facebook') return (
                        <a href={recipe.tutorialUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors mt-0.5">
                          <Facebook className="w-3 h-3" /> Facebook
                        </a>
                      );
                      return (
                        <a href={recipe.tutorialUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline mt-0.5">
                          <ExternalLink className="w-3 h-3" /> Xem hướng dẫn
                        </a>
                      );
                    })()}
                  </div>
                  {recipe.notes && (
                    <p className="text-xs text-text-light italic mt-1">{recipe.notes}</p>
                  )}
                </div>
                <AnimatePresence>
                  {recipeDone && (
                    <motion.div
                      initial={{ scale: 0, rotate: -15 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="flex-shrink-0 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Step list */}
              <div className="space-y-2 pl-1">
                {steps.map((step) => (
                  <button
                    key={step.id}
                    onClick={() => handleStepClick(step)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all active:scale-[0.98] ${
                      step.checked
                        ? 'bg-green-50/70 border border-green-200/50'
                        : 'bg-white border border-transparent shadow-sm hover:shadow-md'
                    }`}
                  >
                    {/* Step number / check indicator */}
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                        step.checked
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {step.checked ? (
                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                      ) : (
                        <span className="font-mono text-xs font-bold text-gray-400">
                          {step.stepIndex + 1}
                        </span>
                      )}
                    </div>

                    {/* Step content + checkedBy badge */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm leading-relaxed transition-colors ${
                          step.checked ? 'line-through text-text-light' : 'text-text'
                        }`}
                      >
                        {step.content}
                      </p>
                      {step.checked && step.checkedBy && (
                        <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          ✓ {step.checkedBy}
                        </span>
                      )}
                    </div>

                    {/* Step countdown timer — right-aligned, prominent */}
                    {step.durationSeconds ? (() => {
                      const t = timers[step.id];
                      if (!t) return (
                        <button
                          onClick={(e) => { e.stopPropagation(); startTimer(step); }}
                          className="flex-shrink-0 flex flex-col items-center gap-0.5 min-w-[60px] px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors text-text-light"
                        >
                          <Timer className="w-4 h-4" />
                          <span className="font-mono text-sm font-bold tabular-nums">{formatMmSs(step.durationSeconds)}</span>
                        </button>
                      );
                      if (t.done) return (
                        <button
                          onClick={(e) => { e.stopPropagation(); resetTimer(step.id); }}
                          className="flex-shrink-0 flex flex-col items-center gap-0.5 min-w-[60px] px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-red-500 animate-pulse"
                        >
                          <span className="text-lg">🔔</span>
                          <span className="text-xs font-medium leading-tight">Hết giờ!</span>
                        </button>
                      );
                      return (
                        <button
                          onClick={(e) => { e.stopPropagation(); resetTimer(step.id); }}
                          className="flex-shrink-0 flex flex-col items-center gap-1 min-w-[60px] px-3 py-2 bg-orange-50 border border-orange-200 rounded-xl text-orange-500"
                        >
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
                          </span>
                          <span className="font-mono text-sm font-bold tabular-nums">{formatMmSs(t.remaining)}</span>
                        </button>
                      );
                    })() : null}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cooking Complete button — appears when all steps done */}
      <AnimatePresence>
        {allDone && (
          <motion.button
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            onClick={handleAdvance}
            disabled={advancing}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-2xl font-semibold text-base shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-95 transition-colors disabled:opacity-60"
          >
            {advancing ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>🎉</span>
                <span>Cooking Complete!</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        )}
      </AnimatePresence>

    </div>
  );
}

// ─── Photo phase ──────────────────────────────────────────────────────────────

function PhotoPhase({ session }: { session: CookingSession }) {
  const queryClient = useQueryClient();
  const { cancel, cancelling } = useCancelSession(session.id);
  const [notes, setNotes] = useState(session.notes ?? '');
  const [uploading, setUploading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | undefined>(undefined);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      await cookingSessionsApi.uploadPhotos(session.id, Array.from(files));
      queryClient.invalidateQueries({ queryKey: ['cooking-session', session.id] });
    } catch {
      toast.error('Không thể tải ảnh lên');
    } finally {
      setUploading(false);
      e.target.value = ''; // allow re-selecting same file
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await cookingSessionsApi.updateStatus(
        session.id,
        'completed',
        notes.trim() || undefined
      );
      queryClient.invalidateQueries({ queryKey: ['cooking-session', session.id] });
      queryClient.invalidateQueries({ queryKey: ['cooking-sessions', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['cooking-sessions'] });
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Hero prompt */}
      <div className="text-center mb-8 relative">
        <button
          onClick={cancel}
          disabled={cancelling}
          className="absolute right-0 top-0 flex items-center gap-1 text-xs text-red-400 hover:text-red-500 transition-colors disabled:opacity-50"
        >
          <X className="w-3.5 h-3.5" /> Hủy phiên
        </button>
        <div className="text-5xl mb-3">📸</div>
        <h1 className="font-heading text-2xl font-bold mb-1">Chụp ảnh món ăn!</h1>
        <p className="text-text-light text-sm">
          Lưu lại khoảnh khắc của buổi nấu ăn hôm nay
        </p>
      </div>

      {/* Already-uploaded photos */}
      {session.photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {session.photos.map((photo) => (
            <div key={photo.id} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
              <img src={photo.url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={(el) => { fileInputRef.current = el ?? undefined; }}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Upload trigger */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-2xl py-4 text-sm font-medium text-text-light hover:border-primary/40 hover:text-primary transition-colors mb-6 disabled:opacity-60"
      >
        {uploading ? (
          <>
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Đang tải ảnh...
          </>
        ) : (
          <>
            <Camera className="w-5 h-5" />
            {session.photos.length > 0 ? 'Thêm ảnh' : 'Thêm ảnh món ăn'}
          </>
        )}
      </button>

      {/* Notes */}
      <div className="mb-8">
        <label className="block text-sm font-medium mb-2">
          Ghi chú <span className="text-text-light font-normal">(không bắt buộc)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Hôm nay nấu ngon không? Có gì muốn cải thiện lần sau?..."
          rows={3}
          className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </div>

      {/* Complete button */}
      <button
        onClick={handleComplete}
        disabled={completing}
        className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-2xl font-semibold text-base shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60"
      >
        {completing ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>🎉 Hoàn thành phiên nấu ăn!</>
        )}
      </button>
    </div>
  );
}

// ─── Completed phase ──────────────────────────────────────────────────────────

function formatDuration(ms: number | null): string {
  if (!ms) return '—';
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h} giờ ${m} phút`;
  if (m > 0) return `${m} phút ${s} giây`;
  return `${s} giây`;
}

function CompletedPhase({ session }: { session: CookingSession }) {
  const navigate = useNavigate();

  const dishNames = session.recipes.map((r) => r.recipe.title).join(', ');

  const completedDate = session.completedAt
    ? new Date(session.completedAt).toLocaleDateString('vi-VN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  // Group checked steps by player name
  const playerContributions: Record<string, number> = {};
  session.steps
    .filter((s) => s.checked && s.checkedBy)
    .forEach((s) => {
      playerContributions[s.checkedBy!] = (playerContributions[s.checkedBy!] ?? 0) + 1;
    });

  return (
    <div className="max-w-lg mx-auto">
      {/* Hero */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16 }}
          className="text-6xl mb-3"
        >
          🎉
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="font-heading text-3xl font-bold mb-1"
        >
          Tuyệt vời!
        </motion.h1>
        <p className="text-text-light text-sm">{completedDate}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-primary/5 rounded-2xl p-4 text-center">
          <p className="font-bold text-2xl text-primary">{session.recipes.length}</p>
          <p className="text-xs text-text-light mt-0.5">Món đã nấu</p>
        </div>
        <div className="bg-secondary/5 rounded-2xl p-4 text-center">
          <p className="font-bold text-xl text-secondary leading-tight">
            {formatDuration(session.totalTimeMs)}
          </p>
          <p className="text-xs text-text-light mt-0.5">Thời gian nấu</p>
        </div>
      </div>

      {/* Dishes */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <p className="text-xs font-medium text-text-light uppercase tracking-wide mb-1.5">
          Món đã nấu
        </p>
        <p className="font-heading font-semibold text-base">{dishNames}</p>
      </div>

      {/* Photos */}
      {session.photos.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-text-light uppercase tracking-wide mb-2">
            Ảnh kỷ niệm
          </p>
          <div className="grid grid-cols-3 gap-2">
            {session.photos.map((photo) => (
              <div key={photo.id} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                <img src={photo.url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Player contributions */}
      {Object.keys(playerContributions).length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <p className="text-xs font-medium text-text-light uppercase tracking-wide mb-3">
            Đóng góp
          </p>
          <div className="space-y-2">
            {Object.entries(playerContributions).map(([name, count]) => (
              <div key={name} className="flex items-center justify-between">
                <span className="text-sm font-medium">{name}</span>
                <span className="text-sm text-text-light">{count} bước</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {session.notes && (
        <div className="bg-gray-50 rounded-2xl p-4 mb-5">
          <p className="text-xs font-medium text-text-light uppercase tracking-wide mb-1.5">
            Ghi chú
          </p>
          <p className="text-sm text-text leading-relaxed">{session.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/what-to-eat/history')}
          className="flex-1 border border-border rounded-2xl py-3 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Lịch sử
        </button>
        <button
          onClick={() => navigate('/')}
          className="flex-1 bg-primary text-white rounded-2xl py-3 text-sm font-medium hover:bg-primary/90 active:scale-95 transition-all"
        >
          Về trang chủ
        </button>
      </div>
    </div>
  );
}

