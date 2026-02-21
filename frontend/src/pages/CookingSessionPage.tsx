import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { UtensilsCrossed, ChefHat, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { recipesApi, cookingSessionsApi } from '../lib/api';
import type { Recipe } from '../types';
import { GridSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

const STATUS_LABELS: Record<string, string> = {
  selecting: 'Chọn món',
  shopping: 'Đi chợ',
  cooking: 'Đang nấu',
  photo: 'Chụp ảnh',
  completed: 'Hoàn thành',
};

export default function CookingSessionPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: recipes = [], isLoading: recipesLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: recipesApi.list,
  });

  const { data: activeSession, isLoading: sessionLoading } = useQuery({
    queryKey: ['cooking-sessions', 'active'],
    queryFn: cookingSessionsApi.getActive,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cookingSessionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cooking-sessions', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['cooking-sessions'] });
    },
    onError: () => toast.error('Không thể hủy phiên'),
  });

  const createMutation = useMutation({
    mutationFn: (recipeIds: string[]) => cookingSessionsApi.create({ recipeIds }),
    onSuccess: (session) => {
      navigate(`/what-to-eat/${session.id}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể bắt đầu phiên nấu ăn');
    },
  });

  const toggleRecipe = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStart = () => {
    if (selected.size === 0) return;
    createMutation.mutate([...selected]);
  };

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If there's an active session, show resume card
  if (activeSession) {
    const dishNames = activeSession.recipes.map((r) => r.recipe.title).join(', ');
    const statusLabel = STATUS_LABELS[activeSession.status] ?? activeSession.status;
    return (
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold">What to Eat Today</h1>
            <p className="text-text-light text-sm">Nấu ăn cùng nhau nhé!</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-primary/20 rounded-2xl p-5 mb-4"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">Đang nấu</p>
              <h2 className="font-heading font-semibold text-lg leading-tight">{dishNames || 'Phiên nấu ăn'}</h2>
            </div>
            <span className="flex-shrink-0 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
              {statusLabel}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-light mb-4">
            <Clock className="w-3.5 h-3.5" />
            <span>Bắt đầu {new Date(activeSession.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <Link
            to={`/what-to-eat/${activeSession.id}`}
            className="flex items-center justify-center gap-2 w-full bg-primary text-white py-3 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors active:scale-95"
          >
            Tiếp tục nấu ăn <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={() => {
              if (!window.confirm('Hủy phiên nấu ăn này? Mọi tiến trình sẽ bị xóa.')) return;
              cancelMutation.mutate(activeSession.id);
            }}
            disabled={cancelMutation.isPending}
            className="mt-2 w-full text-center text-sm text-red-500 hover:text-red-600 py-1.5 transition-colors disabled:opacity-50"
          >
            {cancelMutation.isPending ? 'Đang hủy...' : 'Hủy phiên nấu ăn'}
          </button>
        </motion.div>

        <p className="text-center text-xs text-text-light">
          Hoàn thành phiên hiện tại để bắt đầu phiên mới.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold">What to Eat Today?</h1>
            <p className="text-text-light text-sm">Chọn món muốn nấu hôm nay</p>
          </div>
        </div>

        {selected.size > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center shadow"
          >
            {selected.size}
          </motion.div>
        )}
      </div>

      <p className="text-text-light text-sm mb-6">
        Chọn ít nhất 1 món để bắt đầu phiên nấu ăn cùng nhau.
      </p>

      {recipesLoading ? (
        <GridSkeleton />
      ) : recipes.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title="Chưa có công thức nào"
          description="Thêm công thức trước rồi bắt đầu nấu ăn nhé"
          action={{ label: 'Thêm Công Thức', onClick: () => navigate('/recipes') }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((recipe, i) => (
            <SelectableRecipeCard
              key={recipe.id}
              recipe={recipe}
              index={i}
              isSelected={selected.has(recipe.id)}
              onToggle={() => toggleRecipe(recipe.id)}
            />
          ))}
        </div>
      )}

      {/* History link */}
      {recipes.length > 0 && (
        <div className="flex justify-center mt-4 mb-2">
          <Link
            to="/what-to-eat/history"
            className="text-sm text-text-light hover:text-primary transition-colors"
          >
            Xem lịch sử nấu ăn →
          </Link>
        </div>
      )}

      {/* Sticky start button */}
      {recipes.length > 0 && (
        <div
          className="sticky bottom-0 pt-4 pb-2 bg-gradient-to-t from-white via-white/95 to-transparent"
          style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={handleStart}
            disabled={selected.size === 0 || createMutation.isPending}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-2xl font-semibold text-base shadow-lg shadow-primary/25 hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed active:scale-98 transition-all"
          >
            {createMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UtensilsCrossed className="w-5 h-5" />
                {selected.size === 0
                  ? 'Chọn món để bắt đầu'
                  : `Bắt đầu nấu ${selected.size} món!`}
                {selected.size > 0 && <ArrowRight className="w-4 h-4" />}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function SelectableRecipeCard({
  recipe,
  index,
  isSelected,
  onToggle,
}: {
  recipe: Recipe;
  index: number;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onToggle}
      className={`relative cursor-pointer rounded-2xl overflow-hidden bg-white shadow-sm transition-all active:scale-95 ${
        isSelected
          ? 'ring-2 ring-primary shadow-md shadow-primary/15'
          : 'hover:shadow-md'
      }`}
    >
      {/* Photo */}
      <div className="h-36 bg-gray-100 overflow-hidden">
        {recipe.photos[0] ? (
          <img
            src={recipe.photos[0].url}
            alt={recipe.title}
            className={`w-full h-full object-cover transition-transform duration-300 ${isSelected ? 'scale-105' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ChefHat className="w-10 h-10 text-gray-300" />
          </div>
        )}
        {/* Selected overlay */}
        {isSelected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-primary/20 flex items-start justify-end p-2"
          >
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-heading font-semibold text-sm truncate">{recipe.title}</h3>
        <div className="flex items-center gap-2 mt-1 text-xs text-text-light">
          {recipe.ingredients.length > 0 && (
            <span>{recipe.ingredients.length} nguyên liệu</span>
          )}
          {recipe.ingredients.length > 0 && recipe.steps.length > 0 && <span>·</span>}
          {recipe.steps.length > 0 && <span>{recipe.steps.length} bước</span>}
        </div>
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {recipe.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 bg-accent/10 text-accent rounded-full text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
