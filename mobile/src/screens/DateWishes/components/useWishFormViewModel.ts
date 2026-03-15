import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { dateWishesApi } from '../../../lib/api';
import type { DateWish } from '../../../types';
import { useTranslation } from 'react-i18next';
export function useWishFormViewModel(onClose: () => void, initialWish?: DateWish) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(initialWish?.title ?? '');
  const [description, setDescription] = useState(initialWish?.description ?? '');
  const [category, setCategory] = useState(initialWish?.category ?? 'food');
  const [url, setUrl] = useState(initialWish?.url ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = title.trim().length > 0;

  const save = async () => {
    if (!isValid) return;
    setIsSaving(true);
    setError(null);
    try {
      const data = {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        url: url.trim() || undefined,
      };
      if (initialWish) {
        await dateWishesApi.update(initialWish.id, data);
      } else {
        await dateWishesApi.create(data);
      }
      queryClient.invalidateQueries({ queryKey: ['wishes'] });
      onClose();
    } catch {
      setError(t('datePlanner.errors.saveFailed'));
    }
    setIsSaving(false);
  };

  return {
    title, setTitle,
    description, setDescription,
    category, setCategory,
    url, setUrl,
    isValid,
    isSaving,
    error,
    save,
  };
}
