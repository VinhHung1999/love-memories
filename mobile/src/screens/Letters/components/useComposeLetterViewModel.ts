import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { loveLettersApi } from '../../../lib/api';
import type { LoveLetter } from '../../../types';
import t from '../../../locales/en';

export const MOODS = ['love', 'happy', 'miss', 'grateful', 'playful', 'romantic'] as const;
export type Mood = typeof MOODS[number];

export function useComposeLetterViewModel(onClose: () => void, initialLetter?: LoveLetter) {
  const queryClient = useQueryClient();
  const [draftId, setDraftId] = useState<string | undefined>(initialLetter?.id);
  const [title, setTitle] = useState(initialLetter?.title ?? '');
  const [content, setContent] = useState(initialLetter?.content ?? '');
  const [mood, setMood] = useState<string>(initialLetter?.mood ?? 'love');
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = title.trim().length > 0 && content.trim().length > 0;

  const saveDraft = useCallback(async () => {
    if (!isValid) return;
    setIsSaving(true);
    setError(null);
    try {
      if (draftId) {
        await loveLettersApi.update(draftId, { title: title.trim(), content: content.trim(), mood });
      } else {
        const letter = await loveLettersApi.create({ title: title.trim(), content: content.trim(), mood });
        setDraftId(letter.id);
      }
      queryClient.invalidateQueries({ queryKey: ['letters'] });
      onClose();
    } catch {
      setError(t.loveLetters.errors.saveFailed);
    }
    setIsSaving(false);
  }, [draftId, title, content, mood, isValid, queryClient, onClose]);

  const sendNow = useCallback(async () => {
    if (!isValid) return;
    setIsSending(true);
    setError(null);
    try {
      let id = draftId;
      if (!id) {
        const letter = await loveLettersApi.create({ title: title.trim(), content: content.trim(), mood });
        id = letter.id;
        setDraftId(id);
      } else {
        await loveLettersApi.update(id, { title: title.trim(), content: content.trim(), mood });
      }
      await loveLettersApi.send(id);
      queryClient.invalidateQueries({ queryKey: ['letters'] });
      onClose();
    } catch {
      setError(t.loveLetters.errors.sendFailed);
    }
    setIsSending(false);
  }, [draftId, title, content, mood, isValid, queryClient, onClose]);

  return {
    title, setTitle,
    content, setContent,
    mood, setMood,
    draftId,
    isValid,
    isSaving,
    isSending,
    error,
    saveDraft,
    sendNow,
  };
}
