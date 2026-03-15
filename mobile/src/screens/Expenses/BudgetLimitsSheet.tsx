import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Text, View } from 'react-native';
import { Caption } from '../../components/Typography';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useQueryClient } from '@tanstack/react-query';
import { expensesApi } from '../../lib/api';
import { useAppColors } from '../../navigation/theme';
import AppBottomSheet from '../../components/AppBottomSheet';
import FieldLabel from '../../components/FieldLabel';
import { useTranslation } from 'react-i18next';
import { EXPENSE_CATEGORIES, formatVND } from './expensesConstants';
import type { ExpenseCategory } from '../../lib/api';
import Input from '@/components/Input';

interface BudgetLimitsSheetProps {
  onClose: () => void;
}

const CATS = EXPENSE_CATEGORIES.filter(c => c.key !== 'all') as {
  key: ExpenseCategory; emoji: string; label: string;
}[];

export default function BudgetLimitsSheet({ onClose }: BudgetLimitsSheetProps) {
  const { t } = useTranslation();
  const sheetRef = useRef<BottomSheetModal>(null);
  const queryClient = useQueryClient();
  const colors = useAppColors();

  // Local draft: category → string amount (empty = no limit)
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Pre-fill draft from cached limits + snapshot for "current" display
  const [cachedLimits, setCachedLimits] = useState<Record<string, number | null>>({});
  useEffect(() => {
    sheetRef.current?.present();
    const cached = queryClient.getQueryData<Record<string, number | null>>(['expenses-limits']);
    if (cached) {
      setCachedLimits(cached);
      const initial: Record<string, string> = {};
      for (const cat of CATS) {
        const v = cached[cat.key];
        initial[cat.key] = v != null ? String(v) : '';
      }
      setDraft(initial);
    }
  }, [queryClient]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const payload: Record<string, number | null> = {};
      for (const cat of CATS) {
        const raw = draft[cat.key] ?? '';
        const parsed = parseFloat(raw.replace(/[^\d.]/g, ''));
        payload[cat.key] = isNaN(parsed) || parsed <= 0 ? null : parsed;
      }
      await expensesApi.setLimits(payload);
      queryClient.invalidateQueries({ queryKey: ['expenses-limits'] });
      sheetRef.current?.dismiss();
    } catch {
      // silent — sheet stays open on error
    } finally {
      setIsSaving(false);
    }
  }, [draft, queryClient]);

  // Every field must be valid: empty (no limit) or a positive number
  const isValid = Object.values(draft).every(v => {
    if (v === '') return true;
    const n = parseFloat(v.replace(/[^\d.]/g, ''));
    return !isNaN(n) && n > 0;
  });

  return (
    <AppBottomSheet
      ref={sheetRef}
      title={t('expenses.budget.title')}
      scrollable
      snapPoints={['75%']}
      onSave={handleSave}
      saveDisabled={isSaving || !isValid}
      isSaving={isSaving}
      onDismiss={onClose}
    >
      <View className="px-5 pt-4 pb-8">
        <Caption className="text-textMid dark:text-darkTextMid mb-5">{t('expenses.budget.hint')}</Caption>

        {CATS.map((cat, idx) => {
          const currentLimit = cachedLimits[cat.key] ?? null;

          return (
            <View key={cat.key} className={`pb-4 ${idx < CATS.length - 1 ? 'border-b border-border dark:border-darkBorder/40 mb-4' : ''}`}>
              <View className="flex-row items-center gap-2 mb-2">
                <Text className="text-lg">{cat.emoji}</Text>
                <FieldLabel>{cat.label}</FieldLabel>
                {currentLimit != null && (
                  <Caption className="ml-auto text-textMid dark:text-darkTextMid">
                    now: {formatVND(currentLimit)}
                  </Caption>
                )}
              </View>
              <Input
                className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-textDark dark:text-darkTextDark border border-border dark:border-darkBorder/60"
                value={draft[cat.key] ?? ''}
                onChangeText={v => setDraft(prev => ({ ...prev, [cat.key]: v }))}
                placeholder={t('expenses.budget.noLimit')}
                placeholderTextColor={colors.textLight}
                keyboardType="numeric"
              />
            </View>
          );
        })}
      </View>
    </AppBottomSheet>
  );
}
