import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { ChefHat, Plus, X, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { recipesApi, foodSpotsApi } from '../lib/api';
import type { Recipe } from '../types';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { GridSkeleton } from '../components/LoadingSkeleton';

export default function RecipesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filterTag, setFilterTag] = useState('');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('new') === '1') setShowForm(true);
  }, [searchParams]);

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: recipesApi.list,
  });

  const allTags = [...new Set(recipes.flatMap((r) => r.tags))];
  const filtered = filterTag ? recipes.filter((r) => r.tags.includes(filterTag)) : recipes;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold">Recipes</h1>
          <p className="text-text-light text-sm mt-1">Công thức nấu ăn của chúng mình</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-accent text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Add Recipe
        </button>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilterTag('')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              !filterTag ? 'bg-accent text-white' : 'bg-gray-100 text-text-light hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(tag === filterTag ? '' : tag)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterTag === tag ? 'bg-accent text-white' : 'bg-gray-100 text-text-light hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <GridSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title="No recipes yet"
          description="Start adding your favorite recipes"
          action={{ label: 'Add First Recipe', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((recipe, i) => (
            <RecipeCard key={recipe.id} recipe={recipe} index={i} />
          ))}
        </div>
      )}

      <RecipeFormModal open={showForm} onClose={() => setShowForm(false)} queryClient={queryClient} />
    </div>
  );
}

function RecipeCard({ recipe, index }: { recipe: Recipe; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/recipes/${recipe.id}`}
        className="block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
      >
        <div className="h-40 bg-gray-100 overflow-hidden">
          {recipe.photos[0] ? (
            <img
              src={recipe.photos[0].url}
              alt={recipe.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ChefHat className="w-12 h-12 text-gray-300" />
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-heading font-semibold text-lg truncate">{recipe.title}</h3>
            {recipe.cooked && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 border border-green-200 rounded-full text-xs font-medium flex-shrink-0">
                <CheckCircle2 className="w-3 h-3" /> Đã nấu
              </span>
            )}
          </div>
          {recipe.foodSpot && (
            <p className="text-xs text-accent mt-0.5 truncate">📍 {recipe.foodSpot.name}</p>
          )}
          {recipe.description && (
            <p className="text-text-light text-sm mt-1 line-clamp-2">{recipe.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 text-xs text-text-light">
            {recipe.ingredients.length > 0 && <span>{recipe.ingredients.length} nguyên liệu</span>}
            {recipe.ingredients.length > 0 && recipe.steps.length > 0 && <span>·</span>}
            {recipe.steps.length > 0 && <span>{recipe.steps.length} bước</span>}
          </div>
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {recipe.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-accent/10 text-accent rounded-full text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

export function RecipeFormModal({
  open,
  onClose,
  queryClient,
  defaultFoodSpotId,
}: {
  open: boolean;
  onClose: () => void;
  queryClient: ReturnType<typeof useQueryClient>;
  defaultFoodSpotId?: string;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [steps, setSteps] = useState<string[]>(['']);
  const [stepDurations, setStepDurations] = useState<number[]>([0]);
  const [notes, setNotes] = useState('');
  const [tutorialUrl, setTutorialUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [foodSpotId, setFoodSpotId] = useState(defaultFoodSpotId ?? '');

  // Task 5: auto-focus last input when array grows
  const ingredientRefs = useRef<(HTMLInputElement | null)[]>([]);
  const stepRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const prevIngLen = useRef(ingredients.length);
  const prevStepLen = useRef(steps.length);
  useEffect(() => {
    if (ingredients.length > prevIngLen.current) ingredientRefs.current[ingredients.length - 1]?.focus();
    prevIngLen.current = ingredients.length;
  }, [ingredients.length]);
  useEffect(() => {
    if (steps.length > prevStepLen.current) stepRefs.current[steps.length - 1]?.focus();
    prevStepLen.current = steps.length;
  }, [steps.length]);

  const { data: foodSpots = [] } = useQuery({
    queryKey: ['foodspots'],
    queryFn: foodSpotsApi.list,
    enabled: open,
  });

  const reset = () => {
    setTitle(''); setDescription(''); setIngredients(['']); setSteps(['']); setStepDurations([0]);
    setNotes(''); setTutorialUrl(''); setTagsInput(''); setFoodSpotId(defaultFoodSpotId ?? '');
  };

  const mutation = useMutation({
    mutationFn: () =>
      recipesApi.create({
        title,
        description: description || undefined,
        ingredients: ingredients.filter(Boolean),
        ...(() => {
          const pairs = steps.map((s, i) => ({ s, d: stepDurations[i] ?? 0 })).filter(({ s }) => s.trim());
          return { steps: pairs.map((p) => p.s), stepDurations: pairs.map((p) => p.d) };
        })(),
        notes: notes || undefined,
        tutorialUrl: tutorialUrl || undefined,
        tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
        foodSpotId: foodSpotId || undefined,
      } as Partial<Recipe>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.success('Recipe added!');
      onClose();
      reset();
    },
    onError: () => toast.error('Failed to add recipe'),
  });

  const updateItem = (arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, i: number, val: string) =>
    setArr(arr.map((x, idx) => (idx === i ? val : x)));
  const removeItem = (arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, i: number) =>
    setArr(arr.filter((_, idx) => idx !== i));

  return (
    <Modal open={open} onClose={onClose} title="New Recipe">
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
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

        {/* Ingredients */}
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
                {ingredients.length > 1 && (
                  <button type="button" onClick={() => removeItem(ingredients, setIngredients, i)} className="text-red-400 hover:text-red-500 p-2">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setIngredients((p) => [...p, ''])} className="mt-2 text-xs text-accent hover:underline flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add ingredient
          </button>
        </div>

        {/* Steps */}
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
            placeholder="Tips, variations..."
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
            placeholder="vietnamese, spicy, easy"
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
            {mutation.isPending ? 'Saving...' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
