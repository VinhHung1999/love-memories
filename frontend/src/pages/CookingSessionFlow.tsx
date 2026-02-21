import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChefHat, ArrowLeft, ArrowRight, Check, ShoppingCart, Timer, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cookingSessionsApi } from '../lib/api';
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
      <button
        onClick={() => navigate('/what-to-eat')}
        className="flex items-center gap-1.5 text-sm text-text-light hover:text-text mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Chọn lại món
      </button>

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
        <div className="flex-shrink-0 text-right ml-3">
          <p className="font-bold text-xl text-secondary leading-none">
            {checkedCount}<span className="text-text-light font-normal text-base">/{total}</span>
          </p>
          <p className="text-xs text-text-light">items</p>
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

// ─── Cooking phase ────────────────────────────────────────────────────────────

const PLAYER_NAME_KEY = 'cooking-player-name';

function formatElapsed(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function CookingPhase({ session }: { session: CookingSession }) {
  const queryClient = useQueryClient();
  const [advancing, setAdvancing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [pendingStep, setPendingStep] = useState<CookingSessionStep | null>(null);
  const nameInputRef = useRef<HTMLInputElement | undefined>(undefined);

  // Elapsed timer — useState feeds JSX, not useRef
  useEffect(() => {
    if (!session.startedAt) return;
    const start = new Date(session.startedAt).getTime();
    const tick = () => setElapsed(Date.now() - start);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session.startedAt]);

  // Focus name input when modal opens
  useEffect(() => {
    if (showNameModal) nameInputRef.current?.focus();
  }, [showNameModal]);

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
      return;
    }
    const saved = localStorage.getItem(PLAYER_NAME_KEY);
    if (saved) {
      doToggleStep(step, true, saved);
    } else {
      setPendingStep(step);
      setNameInput('');
      setShowNameModal(true);
    }
  };

  const handleNameConfirm = () => {
    const name = nameInput.trim();
    if (!name || !pendingStep) return;
    localStorage.setItem(PLAYER_NAME_KEY, name);
    doToggleStep(pendingStep, true, name);
    setPendingStep(null);
    setShowNameModal(false);
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
        <div className="flex-shrink-0 flex items-center gap-1.5 bg-primary/8 text-primary px-3 py-1.5 rounded-xl">
          <Timer className="w-4 h-4" />
          <span className="font-mono font-bold text-base tabular-nums">{formatElapsed(elapsed)}</span>
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
                  <p className="text-xs text-text-light">
                    {recipeChecked}/{steps.length} bước
                  </p>
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
                    className={`w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-all active:scale-[0.98] ${
                      step.checked
                        ? 'bg-green-50/70 border border-green-200/50'
                        : 'bg-white border border-transparent shadow-sm hover:shadow-md'
                    }`}
                  >
                    {/* Step number / check indicator */}
                    <div
                      className={`mt-0.5 w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
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

      {/* Player name modal — shown on first step check */}
      <AnimatePresence>
        {showNameModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4 bg-black/30"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowNameModal(false);
                setPendingStep(null);
              }
            }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl"
            >
              <h3 className="font-heading font-semibold text-lg mb-1">Bạn là ai? 👤</h3>
              <p className="text-text-light text-sm mb-4">
                Nhập tên để ghi nhận bước này — chỉ hỏi một lần!
              </p>
              <input
                ref={(el) => { nameInputRef.current = el ?? undefined; }}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="VD: Mèo, Cún, ..."
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary/30"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameConfirm();
                  if (e.key === 'Escape') {
                    setShowNameModal(false);
                    setPendingStep(null);
                  }
                }}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowNameModal(false); setPendingStep(null); }}
                  className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleNameConfirm}
                  disabled={!nameInput.trim()}
                  className="flex-1 bg-primary text-white rounded-xl py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-40 transition-colors"
                >
                  Bắt đầu nấu!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Photo phase ──────────────────────────────────────────────────────────────

function PhotoPhase({ session }: { session: CookingSession }) {
  const queryClient = useQueryClient();
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
      <div className="text-center mb-8">
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

