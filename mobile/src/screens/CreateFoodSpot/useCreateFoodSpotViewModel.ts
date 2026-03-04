import { useState, useCallback, useEffect, useReducer } from 'react';
import { useUploadProgress } from '../../contexts/UploadProgressContext';
import type { AlertConfig } from '../../components/AlertModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { foodSpotsApi } from '../../lib/api';
import type { FoodSpot } from '../../types';
import t from '../../locales/en';
import type { LocalPhoto, UploadProgress } from '../CreateMoment/useCreateMomentViewModel';

// ── Reducer ──────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  description: string;
  rating: number;
  priceRange: number;
  location: string;
  latitude: number | undefined;
  longitude: number | undefined;
  tagInput: string;
  tags: string[];
  photos: LocalPhoto[];
}

type FormAction =
  | { type: 'SET_FIELD'; field: keyof FormState; value: any }
  | { type: 'ADD_PHOTOS'; photos: LocalPhoto[] }
  | { type: 'REMOVE_PHOTO'; index: number }
  | { type: 'ADD_TAG'; tag: string }
  | { type: 'REMOVE_TAG'; tag: string }
  | { type: 'LOAD_EXISTING'; spot: FoodSpot }
  | { type: 'INCREMENT_UPLOAD' }
  | { type: 'RESET' };

function makeInitialState(): FormState {
  return {
    name: '',
    description: '',
    rating: 4,
    priceRange: 2,
    location: '',
    latitude: undefined,
    longitude: undefined,
    tagInput: '',
    tags: [],
    photos: [],
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
    case 'ADD_TAG':
      return { ...state, tags: [...state.tags, action.tag], tagInput: '' };
    case 'REMOVE_TAG':
      return { ...state, tags: state.tags.filter(existing => existing !== action.tag) };
    case 'LOAD_EXISTING':
      return {
        ...state,
        name: action.spot.name,
        description: action.spot.description ?? '',
        rating: action.spot.rating,
        priceRange: action.spot.priceRange,
        location: action.spot.location ?? '',
        latitude: action.spot.latitude ?? undefined,
        longitude: action.spot.longitude ?? undefined,
        tags: action.spot.tags,
        photos: action.spot.photos.map(p => ({
          uri: p.url,
          mimeType: 'image/jpeg',
          uploaded: true,
          remotePhotoId: p.id,
        })),
      };
    case 'INCREMENT_UPLOAD':
      return state;
    case 'RESET':
      return makeInitialState();
    default:
      return state;
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

interface Props {
  foodSpotId?: string | null;
  initialFoodSpot?: FoodSpot;
  onClose: () => void;
}

export function useCreateFoodSpotViewModel({ foodSpotId, initialFoodSpot, onClose }: Props) {
  const isEdit = !!foodSpotId;
  const queryClient = useQueryClient();

  const [s, dispatch] = useReducer(formReducer, undefined, makeInitialState);
  const { startUpload, incrementUpload } = useUploadProgress();

  const [alert, setAlert] = useState<AlertConfig>({ visible: false, title: '' });
  const showAlert = (config: Omit<AlertConfig, 'visible'>) =>
    setAlert({ ...config, visible: true });
  const dismissAlert = () => setAlert(prev => ({ ...prev, visible: false }));

  // ── Load existing data if editing ───────────────────────────────────────────
  const { data: existingSpot } = useQuery({
    queryKey: ['foodspot', foodSpotId],
    queryFn: () => foodSpotsApi.get(foodSpotId!),
    enabled: isEdit,
    staleTime: 0,
    initialData: initialFoodSpot, // form fills instantly from nav params
  });

  useEffect(() => {
    if (existingSpot) {
      dispatch({ type: 'LOAD_EXISTING', spot: existingSpot });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingSpot?.id]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = useCallback((): string | null => {
    if (!s.name.trim()) return t.foodSpots.errors.nameRequired;
    return null;
  }, [s.name]);

  // ── Save mutation ───────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: s.name.trim(),
        description: s.description.trim() || undefined,
        rating: s.rating,
        priceRange: s.priceRange,
        location: s.location.trim() || undefined,
        latitude: s.latitude,
        longitude: s.longitude,
        tags: s.tags,
      };

      const savedSpot = isEdit
        ? await foodSpotsApi.update(foodSpotId!, payload)
        : await foodSpotsApi.create(payload);

      // Upload photos with global progress tracking (non-blocking)
      const pendingPhotos = s.photos.filter(p => !p.uploaded);
      if (pendingPhotos.length > 0) {
        startUpload(pendingPhotos.length);
        Promise.all(
          pendingPhotos.map(p =>
            foodSpotsApi.uploadPhoto(savedSpot.id, p.uri, p.mimeType)
              .then(() => incrementUpload())
              .catch(() => incrementUpload()),
          ),
        ).then(() => {
          queryClient.invalidateQueries({ queryKey: ['foodspot', savedSpot.id] });
          queryClient.invalidateQueries({ queryKey: ['foodspots'] });
        });
      }

      return savedSpot;
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['foodspots'] });
      queryClient.invalidateQueries({ queryKey: ['foodspot', saved.id] });
      onClose();
    },
    onError: (err: Error) =>
      showAlert({ type: 'error', title: t.common.error, message: err.message || t.foodSpots.errors.saveFailed }),
  });

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSave = () => {
    const error = validate();
    if (error) { showAlert({ type: 'error', title: t.common.error, message: error }); return; }
    if (saveMutation.isPending) return;
    saveMutation.mutate();
  };

  const handleAddPhotoFromLibrary = async () => {
    if (s.photos.length >= 10) {
      showAlert({ type: 'error', title: t.common.error, message: t.moments.errors.maxPhotos });
      return;
    }
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
    dispatch({ type: 'ADD_PHOTOS', photos: [{ uri: asset.uri!, mimeType: asset.type ?? 'image/jpeg', uploaded: false }] });
  };

  const handleRemovePhoto = (index: number) => {
    const photo = s.photos[index];
    if (photo.uploaded && photo.remotePhotoId && foodSpotId) {
      foodSpotsApi.deletePhoto(foodSpotId, photo.remotePhotoId).catch(() => null);
    }
    dispatch({ type: 'REMOVE_PHOTO', index });
  };

  const handleAddTag = () => {
    const tag = s.tagInput.trim();
    if (!tag || s.tags.includes(tag) || s.tags.length >= 10) return;
    dispatch({ type: 'ADD_TAG', tag });
  };

  const handleRemoveTag = (tag: string) => dispatch({ type: 'REMOVE_TAG', tag });

  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    isEdit,
    name: s.name,
    description: s.description,
    rating: s.rating,
    priceRange: s.priceRange,
    location: s.location,
    latitude: s.latitude,
    longitude: s.longitude,
    tagInput: s.tagInput,
    tags: s.tags,
    photos: s.photos,
    isSaving: saveMutation.isPending,

    alert,
    dismissAlert,

    setName: (v: string) => dispatch({ type: 'SET_FIELD', field: 'name', value: v }),
    setDescription: (v: string) => dispatch({ type: 'SET_FIELD', field: 'description', value: v }),
    setRating: (v: number) => dispatch({ type: 'SET_FIELD', field: 'rating', value: v }),
    setPriceRange: (v: number) => dispatch({ type: 'SET_FIELD', field: 'priceRange', value: v }),
    setTagInput: (v: string) => dispatch({ type: 'SET_FIELD', field: 'tagInput', value: v }),
    handleLocationChange: (loc: string, lat?: number, lng?: number) => {
      dispatch({ type: 'SET_FIELD', field: 'location', value: loc });
      dispatch({ type: 'SET_FIELD', field: 'latitude', value: lat });
      dispatch({ type: 'SET_FIELD', field: 'longitude', value: lng });
    },

    resetForm,
    handleSave,
    handleAddPhotoFromLibrary,
    handleAddPhotoFromCamera,
    handleRemovePhoto,
    handleAddTag,
    handleRemoveTag,
  };
}
