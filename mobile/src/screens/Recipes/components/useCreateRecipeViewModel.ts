import { useCallback, useEffect, useReducer } from 'react';
import { useUploadProgress } from '../../../contexts/UploadProgressContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppNavigation } from '../../../navigation/useAppNavigation';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { recipesApi } from '../../../lib/api';
import type { Recipe } from '../../../types';
import { useTranslation } from 'react-i18next';
import type { LocalPhoto } from '../../CreateMoment/useCreateMomentViewModel';

// ── State ─────────────────────────────────────────────────────────────────────

interface IngredientRow {
  ingredient: string;
  price: string;
}

interface StepRow {
  content: string;
  duration: string; // seconds as string
}

interface FormState {
  title: string;
  description: string;
  notes: string;
  tutorialUrl: string;
  tagInput: string;
  tags: string[];
  photos: LocalPhoto[];
  ingredients: IngredientRow[];
  steps: StepRow[];
}

type FormAction =
  | { type: 'SET_FIELD'; field: keyof Pick<FormState, 'title' | 'description' | 'notes' | 'tutorialUrl' | 'tagInput'>; value: string }
  | { type: 'ADD_PHOTOS'; photos: LocalPhoto[] }
  | { type: 'REMOVE_PHOTO'; index: number }
  | { type: 'ADD_TAG' }
  | { type: 'REMOVE_TAG'; tag: string }
  | { type: 'ADD_INGREDIENT' }
  | { type: 'UPDATE_INGREDIENT'; index: number; field: 'ingredient' | 'price'; value: string }
  | { type: 'REMOVE_INGREDIENT'; index: number }
  | { type: 'ADD_STEP' }
  | { type: 'UPDATE_STEP'; index: number; field: 'content' | 'duration'; value: string }
  | { type: 'REMOVE_STEP'; index: number }
  | { type: 'LOAD_EXISTING'; recipe: Recipe }
  | { type: 'RESET' };

function makeInitialState(): FormState {
  return {
    title: '',
    description: '',
    notes: '',
    tutorialUrl: '',
    tagInput: '',
    tags: [],
    photos: [],
    ingredients: [],
    steps: [],
  };
}

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'ADD_PHOTOS':
      return { ...state, photos: [...state.photos, ...action.photos] };
    case 'REMOVE_PHOTO':
      return { ...state, photos: state.photos.filter((_, i) => i !== action.index) };
    case 'ADD_TAG': {
      const tag = state.tagInput.trim();
      if (!tag || state.tags.includes(tag) || state.tags.length >= 10) return state;
      return { ...state, tags: [...state.tags, tag], tagInput: '' };
    }
    case 'REMOVE_TAG':
      return { ...state, tags: state.tags.filter(t => t !== action.tag) };
    case 'ADD_INGREDIENT':
      return { ...state, ingredients: [...state.ingredients, { ingredient: '', price: '' }] };
    case 'UPDATE_INGREDIENT':
      return {
        ...state,
        ingredients: state.ingredients.map((row, i) =>
          i === action.index ? { ...row, [action.field]: action.value } : row,
        ),
      };
    case 'REMOVE_INGREDIENT':
      return { ...state, ingredients: state.ingredients.filter((_, i) => i !== action.index) };
    case 'ADD_STEP':
      return { ...state, steps: [...state.steps, { content: '', duration: '' }] };
    case 'UPDATE_STEP':
      return {
        ...state,
        steps: state.steps.map((row, i) =>
          i === action.index ? { ...row, [action.field]: action.value } : row,
        ),
      };
    case 'REMOVE_STEP':
      return { ...state, steps: state.steps.filter((_, i) => i !== action.index) };
    case 'LOAD_EXISTING':
      return {
        ...makeInitialState(),
        title: action.recipe.title,
        description: action.recipe.description ?? '',
        notes: action.recipe.notes ?? '',
        tutorialUrl: action.recipe.tutorialUrl ?? '',
        tags: action.recipe.tags,
        photos: action.recipe.photos.map(p => ({
          uri: p.url,
          mimeType: 'image/jpeg',
          uploaded: true,
          remotePhotoId: p.id,
        })),
        ingredients: action.recipe.ingredients.map((ing, i) => ({
          ingredient: ing,
          price: action.recipe.ingredientPrices[i] ? String(action.recipe.ingredientPrices[i]) : '',
        })),
        steps: action.recipe.steps.map((content, i) => ({
          content,
          duration: action.recipe.stepDurations[i] ? String(action.recipe.stepDurations[i]) : '',
        })),
      };
    case 'RESET':
      return makeInitialState();
    default:
      return state;
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

interface Props {
  recipe?: Recipe;
  onClose: () => void;
}

export function useCreateRecipeViewModel({ recipe: initialRecipe, onClose }: Props) {
  const { t } = useTranslation();
  const isEdit = !!initialRecipe;
  const queryClient = useQueryClient();
  const navigation = useAppNavigation();
  const { startUpload, incrementUpload } = useUploadProgress();

  const [s, dispatch] = useReducer(formReducer, undefined, makeInitialState);

  // Load existing data on mount
  useEffect(() => {
    if (initialRecipe) {
      dispatch({ type: 'LOAD_EXISTING', recipe: initialRecipe });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRecipe?.id]);

  const validate = useCallback((): string | null => {
    if (!s.title.trim()) return t('recipes.errors.titleRequired');
    return null;
  }, [s.title]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: s.title.trim(),
        description: s.description.trim() || undefined,
        notes: s.notes.trim() || undefined,
        tutorialUrl: s.tutorialUrl.trim() || undefined,
        tags: s.tags,
        ingredients: s.ingredients.filter(r => r.ingredient.trim()).map(r => r.ingredient.trim()),
        ingredientPrices: s.ingredients.filter(r => r.ingredient.trim()).map(r => parseFloat(r.price) || 0),
        steps: s.steps.filter(r => r.content.trim()).map(r => r.content.trim()),
        stepDurations: s.steps.filter(r => r.content.trim()).map(r => parseInt(r.duration) || 0),
      };

      const saved = isEdit
        ? await recipesApi.update(initialRecipe!.id, payload)
        : await recipesApi.create(payload);

      // Upload photos background
      const pending = s.photos.filter(p => !p.uploaded);
      if (pending.length > 0) {
        startUpload(pending.length);
        Promise.all(
          pending.map(p =>
            recipesApi.uploadPhoto(saved.id, p.uri, p.mimeType)
              .then(() => incrementUpload())
              .catch(() => incrementUpload()),
          ),
        ).then(() => {
          queryClient.invalidateQueries({ queryKey: ['recipe', saved.id] });
          queryClient.invalidateQueries({ queryKey: ['recipes'] });
        });
      }

      return saved;
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      if (isEdit) queryClient.invalidateQueries({ queryKey: ['recipe', saved.id] });
      onClose();
    },
    onError: (err: Error) =>
      navigation.showAlert({ type: 'error', title: t('common.error'), message: err.message || t('recipes.errors.saveFailed') }),
  });

  const handleSave = () => {
    const error = validate();
    if (error) {
      navigation.showAlert({ type: 'error', title: t('common.error'), message: error });
      return;
    }
    if (saveMutation.isPending) return;
    saveMutation.mutate();
  };

  const handleAddPhotoFromLibrary = async () => {
    if (s.photos.length >= 10) return;
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 1,
      selectionLimit: Math.min(10 - s.photos.length, 5),
    });
    if (result.didCancel || !result.assets) return;
    const newPhotos: LocalPhoto[] = result.assets
      .filter(a => a.uri)
      .map(a => ({ uri: a.uri!, mimeType: a.type ?? 'image/jpeg', uploaded: false }));
    dispatch({ type: 'ADD_PHOTOS', photos: newPhotos });
  };

  const handleAddPhotoFromCamera = async () => {
    if (s.photos.length >= 10) return;
    const result = await launchCamera({ mediaType: 'photo', quality: 1 });
    if (result.didCancel || !result.assets?.[0]?.uri) return;
    const asset = result.assets[0];
    dispatch({
      type: 'ADD_PHOTOS',
      photos: [{ uri: asset.uri!, mimeType: asset.type ?? 'image/jpeg', uploaded: false }],
    });
  };

  const handleRemovePhoto = (index: number) => {
    const photo = s.photos[index];
    if (photo.uploaded && photo.remotePhotoId && initialRecipe) {
      recipesApi.deletePhoto(initialRecipe.id, photo.remotePhotoId).catch(() => null);
    }
    dispatch({ type: 'REMOVE_PHOTO', index });
  };

  return {
    isEdit,
    title: s.title,
    description: s.description,
    notes: s.notes,
    tutorialUrl: s.tutorialUrl,
    tagInput: s.tagInput,
    tags: s.tags,
    photos: s.photos,
    ingredients: s.ingredients,
    steps: s.steps,
    isSaving: saveMutation.isPending,

    setTitle: (v: string) => dispatch({ type: 'SET_FIELD', field: 'title', value: v }),
    setDescription: (v: string) => dispatch({ type: 'SET_FIELD', field: 'description', value: v }),
    setNotes: (v: string) => dispatch({ type: 'SET_FIELD', field: 'notes', value: v }),
    setTutorialUrl: (v: string) => dispatch({ type: 'SET_FIELD', field: 'tutorialUrl', value: v }),
    setTagInput: (v: string) => dispatch({ type: 'SET_FIELD', field: 'tagInput', value: v }),
    addTag: () => dispatch({ type: 'ADD_TAG' }),
    removeTag: (tag: string) => dispatch({ type: 'REMOVE_TAG', tag }),

    addIngredient: () => dispatch({ type: 'ADD_INGREDIENT' }),
    updateIngredient: (index: number, field: 'ingredient' | 'price', value: string) =>
      dispatch({ type: 'UPDATE_INGREDIENT', index, field, value }),
    removeIngredient: (index: number) => dispatch({ type: 'REMOVE_INGREDIENT', index }),

    addStep: () => dispatch({ type: 'ADD_STEP' }),
    updateStep: (index: number, field: 'content' | 'duration', value: string) =>
      dispatch({ type: 'UPDATE_STEP', index, field, value }),
    removeStep: (index: number) => dispatch({ type: 'REMOVE_STEP', index }),

    handleSave,
    handleAddPhotoFromLibrary,
    handleAddPhotoFromCamera,
    handleRemovePhoto,
  };
}
