import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, AlertCircle, Tag, Trash2, Pencil, Plus, X, ChefHat, ExternalLink } from 'lucide-react';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { recipesApi, foodSpotsApi } from '../lib/api';
import type { Recipe } from '../types';
import Modal from '../components/Modal';
import PhotoGallery from '../components/PhotoGallery';

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | undefined>(undefined);

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
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-accent/10 text-accent text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  {ing}
                </li>
              ))}
            </ul>
          </div>
        )}

        {recipe.steps.length > 0 && (
          <div>
            <h2 className="font-heading font-semibold text-lg mb-3">Cách làm</h2>
            <ol className="space-y-4">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-sm text-text leading-relaxed flex-1">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {recipe.notes && (
          <div className="bg-accent/5 rounded-xl p-4">
            <h2 className="font-heading font-semibold text-sm mb-1 text-accent">Ghi chú</h2>
            <p className="text-sm text-text-light leading-relaxed">{recipe.notes}</p>
          </div>
        )}

        {recipe.tutorialUrl && (
          <a
            href={recipe.tutorialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <ExternalLink className="w-4 h-4 flex-shrink-0" />
            Xem hướng dẫn
          </a>
        )}
      </div>

      {/* Delete confirm modal */}
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
  const [steps, setSteps] = useState<string[]>(recipe.steps.length > 0 ? recipe.steps : ['']);
  const [notes, setNotes] = useState(recipe.notes ?? '');
  const [tutorialUrl, setTutorialUrl] = useState(recipe.tutorialUrl ?? '');
  const [tagsInput, setTagsInput] = useState(recipe.tags.join(', '));
  const [foodSpotId, setFoodSpotId] = useState(recipe.foodSpotId ?? '');

  const { data: foodSpots = [] } = useQuery({
    queryKey: ['foodspots'],
    queryFn: foodSpotsApi.list,
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: () =>
      recipesApi.update(recipe.id, {
        title,
        description: description || undefined,
        ingredients: ingredients.filter(Boolean),
        steps: steps.filter(Boolean),
        notes: notes || undefined,
        tutorialUrl: tutorialUrl || null,
        tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
        foodSpotId: foodSpotId || null,
      } as Partial<Recipe>),
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

        <div>
          <label className="block text-sm font-medium mb-1">Steps</label>
          <div className="space-y-2">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="text-xs text-text-light font-medium mt-2.5 w-4 flex-shrink-0">{i + 1}.</span>
                <textarea
                  value={step}
                  onChange={(e) => updateItem(steps, setSteps, i, e.target.value)}
                  placeholder={`Step ${i + 1}`}
                  rows={2}
                  className="flex-1 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
                {steps.length > 1 && (
                  <button type="button" onClick={() => removeItem(steps, setSteps, i)} className="text-red-400 hover:text-red-500 p-2 mt-0.5">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setSteps((p) => [...p, ''])} className="mt-2 text-xs text-accent hover:underline flex items-center gap-1">
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
