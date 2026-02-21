import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, AlertCircle, Tag, Trash2, Pencil, Plus, X, ChefHat, ExternalLink, CheckCircle2, Clock, Timer, Youtube, Facebook, Music2 } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { recipesApi, foodSpotsApi } from '../lib/api';
import type { Recipe } from '../types';
import Modal from '../components/Modal';
import PhotoGallery from '../components/PhotoGallery';

type TimerState = { remaining: number; running: boolean; done: boolean };

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

function formatVnd(price: number): string {
  return price > 0 ? price.toLocaleString('vi-VN') + '₫' : '';
}

function formatMmSs(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | undefined>(undefined);
  const [timers, setTimers] = useState<Record<string, TimerState>>({});
  const timerIntervals = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  useEffect(() => {
    const intervals = timerIntervals.current;
    return () => { Object.values(intervals).forEach(clearInterval); };
  }, []);

  const startTimer = (stepIndex: number, duration: number) => {
    const key = String(stepIndex);
    if (timerIntervals.current[key]) clearInterval(timerIntervals.current[key]);
    setTimers((prev) => ({ ...prev, [key]: { remaining: duration, running: true, done: false } }));
    timerIntervals.current[key] = setInterval(() => {
      setTimers((prev) => {
        const curr = prev[key];
        if (!curr || !curr.running) return prev;
        const next = curr.remaining - 1;
        if (next <= 0) {
          clearInterval(timerIntervals.current[key]);
          if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
          return { ...prev, [key]: { remaining: 0, running: false, done: true } };
        }
        return { ...prev, [key]: { ...curr, remaining: next } };
      });
    }, 1000);
  };

  const resetTimer = (stepIndex: number) => {
    const key = String(stepIndex);
    if (timerIntervals.current[key]) clearInterval(timerIntervals.current[key]);
    setTimers((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  const { data: recipe, isLoading } = useQuery({
    queryKey: ['recipes', id],
    queryFn: () => recipesApi.get(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => recipesApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.success('Recipe deleted');
      navigate('/recipes');
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: (photoId: string) => recipesApi.deletePhoto(id!, photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes', id] });
      toast.success('Photo deleted');
    },
  });

  const uploadPhotosMutation = useMutation({
    mutationFn: (files: File[]) => recipesApi.uploadPhotos(id!, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes', id] });
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

  // Task 6: cooked toggle with optimistic update
  const toggleCooked = () => {
    if (!recipe) return;
    const next = !recipe.cooked;
    if (next) confetti({ particleCount: 70, spread: 60, origin: { y: 0.65 } });
    queryClient.setQueryData(['recipes', id], (old: Recipe | undefined) =>
      old ? { ...old, cooked: next } : old
    );
    // Also update in the list cache
    queryClient.setQueryData(['recipes'], (old: Recipe[] | undefined) =>
      old?.map((r) => (r.id === id ? { ...r, cooked: next } : r))
    );
    recipesApi.update(id!, { cooked: next } as Partial<Recipe>).catch(() => {
      queryClient.invalidateQueries({ queryKey: ['recipes', id] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.error('Failed to save');
    });
  };

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-64 bg-gray-200 rounded-2xl" /><div className="h-8 bg-gray-200 rounded w-1/3" /></div>;
  if (!recipe) return <div className="text-center py-16 text-text-light">Recipe not found</div>;

  const [heroPhoto, ...thumbPhotos] = recipe.photos;

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate('/recipes')} className="flex items-center gap-2 text-text-light hover:text-accent mb-4 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Recipes
      </button>

      {/* Photos */}
      {heroPhoto && (
        <div className="mb-6 space-y-2">
          <div className="relative rounded-2xl overflow-hidden group cursor-pointer" onClick={() => openGallery(0)}>
            <img src={heroPhoto.url} alt="" className="w-full h-64 md:h-80 object-cover" />
            <button
              onClick={(e) => { e.stopPropagation(); if (window.confirm('Xóa ảnh này?')) deletePhotoMutation.mutate(heroPhoto.id); }}
              className="absolute top-2 right-2 bg-red-500/80 text-white p-1.5 rounded-full md:opacity-0 md:group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
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

      {/* Add Photos */}
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
          className="flex items-center gap-2 text-sm text-accent border border-accent/30 px-4 py-2 rounded-xl hover:bg-accent/5 transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {uploadPhotosMutation.isPending ? 'Uploading...' : 'Add Photos'}
        </button>
      </div>

      {/* Main content */}
      <div className="bg-white rounded-2xl p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-3xl font-bold">{recipe.title}</h1>
            {recipe.foodSpot && (
              <Link to={`/foodspots/${recipe.foodSpot.id}`} className="flex items-center gap-1 mt-1 text-sm text-accent hover:underline">
                📍 {recipe.foodSpot.name}
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            {/* Task 6: cooked toggle */}
            <button
              onClick={toggleCooked}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                recipe.cooked
                  ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                  : 'bg-gray-50 text-text-light border-border hover:bg-gray-100'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${recipe.cooked ? 'fill-green-500 text-green-500' : ''}`} />
              {recipe.cooked ? 'Đã nấu' : 'Chưa nấu'}
            </button>
            <button onClick={() => setEditOpen(true)} className="text-text-light hover:text-accent p-2 rounded-lg hover:bg-accent/5 transition-colors">
              <Pencil className="w-5 h-5" />
            </button>
            <button onClick={() => setConfirmDelete(true)} className="text-red-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {recipe.description && (
          <p className="text-text-light leading-relaxed">{recipe.description}</p>
        )}

        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {recipe.tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent rounded-full text-xs">
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {recipe.ingredients.length > 0 && (
          <div>
            <h2 className="font-heading font-semibold text-lg mb-3">Nguyên liệu</h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((ing, i) => {
                const price = recipe.ingredientPrices?.[i] ?? 0;
                return (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="w-5 h-5 rounded-full bg-accent/10 text-accent text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span className="flex-1">{ing}</span>
                    {price > 0 && <span className="text-xs text-text-light flex-shrink-0">{formatVnd(price)}</span>}
                  </li>
                );
              })}
            </ul>
            {recipe.ingredientPrices?.some((p) => p > 0) && (
              <div className="mt-3 flex items-center justify-between bg-accent/5 rounded-xl px-4 py-2.5">
                <span className="text-sm text-text-light">Tổng chi phí</span>
                <span className="font-semibold text-accent">{formatVnd(recipe.ingredientPrices.reduce((a, b) => a + b, 0))}</span>
              </div>
            )}
          </div>
        )}

        {recipe.steps.length > 0 && (
          <div>
            <h2 className="font-heading font-semibold text-lg mb-3">Cách làm</h2>
            <ol className="space-y-4">
              {recipe.steps.map((step, i) => {
                const duration = recipe.stepDurations?.[i] ?? 0;
                const t = timers[String(i)];
                return (
                  <li key={i} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <p className="text-sm text-text leading-relaxed flex-1">{step}</p>
                    {duration > 0 && (
                      !t ? (
                        <button
                          onClick={() => startTimer(i, duration)}
                          className="flex-shrink-0 flex flex-col items-center gap-0.5 min-w-[60px] px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl hover:border-accent/40 hover:bg-accent/5 hover:text-accent transition-colors text-text-light"
                        >
                          <Timer className="w-4 h-4" />
                          <span className="font-mono text-sm font-bold tabular-nums">{formatMmSs(duration)}</span>
                        </button>
                      ) : t.done ? (
                        <button
                          onClick={() => resetTimer(i)}
                          className="flex-shrink-0 flex flex-col items-center gap-0.5 min-w-[60px] px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-red-500 animate-pulse"
                        >
                          <span className="text-lg">🔔</span>
                          <span className="text-xs font-medium leading-tight">Hết giờ!</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => resetTimer(i)}
                          className="flex-shrink-0 flex flex-col items-center gap-1 min-w-[60px] px-3 py-2 bg-orange-50 border border-orange-200 rounded-xl text-orange-500"
                        >
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
                          </span>
                          <span className="font-mono text-sm font-bold tabular-nums">{formatMmSs(t.remaining)}</span>
                        </button>
                      )
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {recipe.notes && (
          <div className="bg-accent/5 rounded-xl p-4">
            <h2 className="font-heading font-semibold text-sm mb-1 text-accent">Ghi chú</h2>
            <p className="text-sm text-text-light leading-relaxed">{recipe.notes}</p>
          </div>
        )}

        {recipe.tutorialUrl && (() => {
          const platform = getPlatformInfo(recipe.tutorialUrl);
          if (platform.type === 'youtube') return (
            <div className="space-y-2">
              <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={platform.embedUrl}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full border-0"
                  title="Tutorial video"
                />
              </div>
              <a href={recipe.tutorialUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:underline">
                <Youtube className="w-3.5 h-3.5" /> Mở trên YouTube
              </a>
            </div>
          );
          if (platform.type === 'tiktok') return (
            <a href={recipe.tutorialUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-text-light hover:text-text border border-border rounded-xl px-4 py-2.5 hover:bg-gray-50 transition-colors">
              <Music2 className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">Xem hướng dẫn trên TikTok</span>
              <ExternalLink className="w-3.5 h-3.5 text-text-light" />
            </a>
          );
          if (platform.type === 'facebook') return (
            <a href={recipe.tutorialUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-xl px-4 py-2.5 hover:bg-blue-50 transition-colors">
              <Facebook className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">Xem hướng dẫn trên Facebook</span>
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
            </a>
          );
          return (
            <a href={recipe.tutorialUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-accent hover:underline">
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
              Xem hướng dẫn
            </a>
          );
        })()}
      </div>

      {confirmDelete && (
        <Modal open={true} onClose={() => setConfirmDelete(false)} title="Delete Recipe?">
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-red-50 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">Delete "{recipe.title}"?</p>
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
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Recipe'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      <PhotoGallery
        photos={recipe.photos}
        initialIndex={galleryIndex}
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />

      <RecipeEditModal
        recipe={recipe}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['recipes', id] })}
      />
    </div>
  );
}

// Task 5: auto-focus hook for dynamic arrays
function useAutoFocusLast<T extends HTMLElement>(
  arr: string[],
  refs: React.MutableRefObject<(T | null)[]>
) {
  const prevLen = useRef(arr.length);
  useEffect(() => {
    if (arr.length > prevLen.current) {
      refs.current[arr.length - 1]?.focus();
    }
    prevLen.current = arr.length;
  }, [arr.length, refs]);
}

function RecipeEditModal({
  recipe,
  open,
  onClose,
  onSaved,
}: {
  recipe: Recipe;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(recipe.title);
  const [description, setDescription] = useState(recipe.description ?? '');
  const [ingredients, setIngredients] = useState<string[]>(recipe.ingredients.length > 0 ? recipe.ingredients : ['']);
  const [ingredientPrices, setIngredientPrices] = useState<number[]>(() =>
    recipe.ingredients.map((_, i) => recipe.ingredientPrices?.[i] ?? 0)
  );
  const [steps, setSteps] = useState<string[]>(recipe.steps.length > 0 ? recipe.steps : ['']);
  const [stepDurations, setStepDurations] = useState<number[]>(() =>
    recipe.steps.map((_, i) => recipe.stepDurations?.[i] ?? 0)
  );
  const [notes, setNotes] = useState(recipe.notes ?? '');
  const [tutorialUrl, setTutorialUrl] = useState(recipe.tutorialUrl ?? '');
  const [tagsInput, setTagsInput] = useState(recipe.tags.join(', '));
  const [foodSpotId, setFoodSpotId] = useState(recipe.foodSpotId ?? '');

  // Task 5: auto-focus refs
  const ingredientRefs = useRef<(HTMLInputElement | null)[]>([]);
  const stepRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  useAutoFocusLast(ingredients, ingredientRefs);
  useAutoFocusLast(steps, stepRefs);

  const { data: foodSpots = [] } = useQuery({
    queryKey: ['foodspots'],
    queryFn: foodSpotsApi.list,
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: () => {
      const ingPairs = ingredients.map((ing, i) => ({ ing, price: ingredientPrices[i] ?? 0 })).filter(({ ing }) => ing.trim());
      const stepPairs = steps.map((s, i) => ({ s, d: stepDurations[i] ?? 0 })).filter(({ s }) => s.trim());
      return recipesApi.update(recipe.id, {
        title,
        description: description || undefined,
        ingredients: ingPairs.map((p) => p.ing),
        ingredientPrices: ingPairs.map((p) => p.price),
        steps: stepPairs.map((p) => p.s),
        stepDurations: stepPairs.map((p) => p.d),
        notes: notes || undefined,
        tutorialUrl: tutorialUrl || null,
        tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
        foodSpotId: foodSpotId || null,
      } as Partial<Recipe>);
    },
    onSuccess: () => {
      onSaved();
      toast.success('Recipe updated');
      onClose();
    },
    onError: () => toast.error('Failed to update recipe'),
  });

  const updateItem = (arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, i: number, val: string) =>
    setArr(arr.map((x, idx) => (idx === i ? val : x)));
  const removeItem = (arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, i: number) =>
    setArr(arr.filter((_, idx) => idx !== i));

  return (
    <Modal open={open} onClose={onClose} title="Edit Recipe">
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Ingredients</label>
          <div className="space-y-2">
            {ingredients.map((ing, i) => (
              <div key={i} className="flex gap-2">
                <input
                  ref={(el) => { ingredientRefs.current[i] = el; }}
                  value={ing}
                  onChange={(e) => updateItem(ingredients, setIngredients, i, e.target.value)}
                  placeholder={`Ingredient ${i + 1}`}
                  className="flex-1 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
                <input
                  type="number" min="0" step="1000"
                  value={ingredientPrices[i] ?? 0}
                  onChange={(e) => setIngredientPrices((p) => p.map((x, idx) => idx === i ? parseInt(e.target.value || '0') : x))}
                  placeholder="Giá ₫"
                  className="w-24 border border-border rounded-xl px-2 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
                {ingredients.length > 1 && (
                  <button type="button" onClick={() => { removeItem(ingredients, setIngredients, i); setIngredientPrices((p) => p.filter((_, idx) => idx !== i)); }} className="text-red-400 hover:text-red-500 p-2">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {ingredientPrices.some((p) => p > 0) && (
            <p className="mt-1.5 text-xs text-right text-text-light">
              Tổng: <span className="font-semibold text-accent">{formatVnd(ingredientPrices.reduce((a, b) => a + b, 0))}</span>
            </p>
          )}
          <button type="button" onClick={() => { setIngredients((p) => [...p, '']); setIngredientPrices((p) => [...p, 0]); }} className="mt-2 text-xs text-accent hover:underline flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add ingredient
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Steps</label>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="text-xs text-text-light font-medium mt-2.5 w-4 flex-shrink-0">{i + 1}.</span>
                <div className="flex-1">
                  <textarea
                    ref={(el) => { stepRefs.current[i] = el; }}
                    value={step}
                    onChange={(e) => updateItem(steps, setSteps, i, e.target.value)}
                    placeholder={`Step ${i + 1}`}
                    rows={2}
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                  <div className="flex items-center gap-1 mt-1 ml-1">
                    <Clock className="w-3 h-3 text-text-light flex-shrink-0" />
                    <input
                      type="number" min="0"
                      value={Math.floor((stepDurations[i] ?? 0) / 60)}
                      onChange={(e) => setStepDurations((p) => p.map((d, idx) => idx === i ? parseInt(e.target.value || '0') * 60 + (d % 60) : d))}
                      className="w-10 border border-border rounded px-1 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-accent/30"
                      placeholder="0"
                    />
                    <span className="text-xs text-text-light">min</span>
                    <input
                      type="number" min="0" max="59"
                      value={(stepDurations[i] ?? 0) % 60}
                      onChange={(e) => setStepDurations((p) => p.map((d, idx) => idx === i ? Math.floor(d / 60) * 60 + parseInt(e.target.value || '0') : d))}
                      className="w-10 border border-border rounded px-1 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-accent/30"
                      placeholder="0"
                    />
                    <span className="text-xs text-text-light">sec</span>
                    {(stepDurations[i] ?? 0) > 0 && <Clock className="w-3 h-3 text-accent" />}
                  </div>
                </div>
                {steps.length > 1 && (
                  <button type="button" onClick={() => { removeItem(steps, setSteps, i); setStepDurations((p) => p.filter((_, idx) => idx !== i)); }} className="text-red-400 hover:text-red-500 p-2 mt-0.5">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={() => { setSteps((p) => [...p, '']); setStepDurations((p) => [...p, 0]); }} className="mt-2 text-xs text-accent hover:underline flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add step
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tutorial URL</label>
          <input
            value={tutorialUrl}
            onChange={(e) => setTutorialUrl(e.target.value)}
            type="url"
            placeholder="https://youtube.com/..."
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        {foodSpots.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1">Linked Food Spot</label>
            <select
              value={foodSpotId}
              onChange={(e) => setFoodSpotId(e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              <option value="">None</option>
              {foodSpots.map((spot) => (
                <option key={spot.id} value={spot.id}>{spot.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-3 pt-3 pb-2 sticky bottom-0 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 border-t border-border mt-4">
          <button type="button" onClick={onClose} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={mutation.isPending || !title} className="flex-1 bg-accent text-white rounded-xl py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {mutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export { ChefHat };
