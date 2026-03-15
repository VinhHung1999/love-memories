import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  View,
} from 'react-native';
import { Body, Caption, Label } from '../../../components/Typography';
import { BottomSheetModal, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Bot, Dot, FileText, Globe, Music2, PlusCircle, X } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAppColors } from '../../../navigation/theme';
import { useTranslation } from 'react-i18next';
import { aiApi, recipesApi, type AIRecipeResult } from '../../../lib/api';
import AppBottomSheet from '../../../components/AppBottomSheet';
import FieldLabel from '../../../components/FieldLabel';

type Mode = 'text' | 'youtube' | 'url';
type Phase = 'input' | 'loading' | 'preview';

// ── Mode tab ─────────────────────────────────────────────────────────────────

function ModeTab({ label, icon: IconComponent, active, onPress }: { label: string; icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>; active: boolean; onPress: () => void }) {
  const colors = useAppColors();
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl"
      style={{ backgroundColor: active ? colors.primary : colors.gray100 }}>
      <IconComponent size={14} color={active ? colors.white : colors.textMid} strokeWidth={1.5} />
      <Caption className="font-semibold" style={{ color: active ? colors.white : colors.textMid }}>{label}</Caption>
    </Pressable>
  );
}

// ── Editable ingredient row ───────────────────────────────────────────────────

function EditIngredientRow({ value, onChange, onRemove }: { value: string; onChange: (v: string) => void; onRemove: () => void }) {
  const { t } = useTranslation();
  const colors = useAppColors();
  return (
    <View className="flex-row items-center gap-2 mb-1.5">
      <Dot size={16} color={colors.textLight} strokeWidth={1.5} />
      <BottomSheetTextInput
        value={value}
        onChangeText={onChange}
        className="flex-1 text-sm text-textDark dark:text-darkTextDark py-1.5 border-b border-border dark:border-darkBorder/40"
        placeholderTextColor={colors.textLight}
        placeholder={t('recipes.create.ingredientPlaceholder')}
      />
      <Pressable onPress={onRemove} hitSlop={8}>
        <X size={16} color={colors.textLight} strokeWidth={1.5} />
      </Pressable>
    </View>
  );
}

// ── Editable step row ─────────────────────────────────────────────────────────

function EditStepRow({ index, value, onChange, onRemove }: { index: number; value: string; onChange: (v: string) => void; onRemove: () => void }) {
  const { t } = useTranslation();
  const colors = useAppColors();
  return (
    <View className="flex-row items-start gap-2 mb-1.5">
      <View className="w-5 h-5 rounded-full bg-primary/10 items-center justify-center mt-1.5 flex-shrink-0">
        <Caption className="font-bold text-primary">{index + 1}</Caption>
      </View>
      <BottomSheetTextInput
        value={value}
        onChangeText={onChange}
        multiline
        className="flex-1 text-sm text-textDark dark:text-darkTextDark py-1.5 border-b border-border dark:border-darkBorder/40"
        placeholderTextColor={colors.textLight}
        placeholder={t('recipes.create.stepPlaceholder')}
      />
      <Pressable onPress={onRemove} hitSlop={8}>
        <X size={16} color={colors.textLight} strokeWidth={1.5} />
      </Pressable>
    </View>
  );
}

// ── Main Sheet ────────────────────────────────────────────────────────────────

export default function AIRecipeSheet({ onClose }: { onClose?: () => void }) {
  const { t } = useTranslation();
  const colors = useAppColors();
  const queryClient = useQueryClient();
  const sheetRef = useRef<BottomSheetModal>(null);

  const [mode, setMode] = useState<Mode>('text');
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<Phase>('input');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Preview editable state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [steps, setSteps] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [tutorialUrl, setTutorialUrl] = useState('');

  useEffect(() => {
    sheetRef.current?.present();
  }, []);

  const modeIcons: Record<Mode, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = { text: FileText, youtube: Music2, url: Globe };
  const modeLabels: Record<Mode, string> = {
    text: t('recipes.ai.modeText'),
    youtube: t('recipes.ai.modeYoutube'),
    url: t('recipes.ai.modeUrl'),
  };
  const placeholders: Record<Mode, string> = {
    text: t('recipes.ai.placeholderText'),
    youtube: t('recipes.ai.placeholderYoutube'),
    url: t('recipes.ai.placeholderUrl'),
  };

  const handleGenerate = async () => {
    if (!input.trim()) { setError(t('recipes.ai.errorEmpty')); return; }
    setError('');
    setPhase('loading');
    try {
      const result: AIRecipeResult = await aiApi.generateRecipe(mode, input.trim());
      setTitle(result.title ?? '');
      setDescription(result.description ?? '');
      setIngredients(result.ingredients.filter(Boolean));
      setSteps(result.steps.filter(Boolean));
      setNotes(result.notes ?? '');
      setTutorialUrl(result.tutorialUrl ?? '');
      setPhase('preview');
    } catch {
      setError(t('recipes.ai.errorFailed'));
      setPhase('input');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setIsSaving(true);
    try {
      await recipesApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        ingredients: ingredients.filter(Boolean),
        steps: steps.filter(Boolean),
        tags: [],
        notes: notes.trim() || undefined,
        tutorialUrl: tutorialUrl.trim() || undefined,
        foodSpotId: undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      sheetRef.current?.dismiss();
    } catch {
      setError(t('recipes.errors.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const actionLabel = phase === 'preview' ? t('recipes.ai.save') : phase === 'input' ? t('recipes.ai.generate') : undefined;
  const handleAction = phase === 'preview' ? handleSave : phase === 'input' ? handleGenerate : undefined;
  const actionIsLoading = phase === 'loading' || isSaving;
  const actionIsDisabled = phase === 'input' && !input.trim();

  return (
    <AppBottomSheet
      ref={sheetRef}
      icon={Bot}
      iconBgClass="bg-primary/10"
      title={t('recipes.ai.title')}
      subtitle={t('recipes.ai.subtitle')}
      actionLabel={actionLabel}
      onAction={handleAction}
      actionLoading={actionIsLoading}
      actionDisabled={actionIsDisabled}
      scrollable
      snapPoints={['92%']}
      onDismiss={onClose}
    >
      {phase === 'loading' ? (

        /* ── Loading ── */
        <View className="h-64 items-center justify-center gap-4">
          <ActivityIndicator size="large" color={colors.primary} />
          <Body size="md" className="text-textMid dark:text-darkTextMid">{t('recipes.ai.generating')}</Body>
        </View>

      ) : phase === 'input' ? (

        /* ── Input phase ── */
        <View className="px-5 pt-5 pb-10">
          {/* Mode tabs */}
          <View className="flex-row gap-2 mb-5">
            {(['text', 'youtube', 'url'] as Mode[]).map(m => (
              <ModeTab
                key={m}
                label={modeLabels[m]}
                icon={modeIcons[m]}
                active={mode === m}
                onPress={() => { setMode(m); setInput(''); setError(''); }}
              />
            ))}
          </View>

          {/* Input area */}
          <FieldLabel>{modeLabels[mode]}</FieldLabel>
          <BottomSheetTextInput
            value={input}
            onChangeText={v => { setInput(v); setError(''); }}
            multiline={mode === 'text'}
            numberOfLines={mode === 'text' ? 8 : 1}
            placeholder={placeholders[mode]}
            placeholderTextColor={colors.textLight}
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              backgroundColor: colors.inputBg,
              borderRadius: 16,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 14,
              color: colors.textDark,
              borderWidth: 1,
              borderColor: colors.border,
              minHeight: mode === 'text' ? 160 : undefined,
              textAlignVertical: mode === 'text' ? 'top' : 'center',
            }}
          />

          {error ? <Caption className="text-red-500 mt-2">{error}</Caption> : null}
        </View>

      ) : (

        /* ── Preview / edit phase ── */
        <View className="px-5 pt-4 pb-8">
          {/* Title */}
          <FieldLabel>{t('recipes.labels.title')}</FieldLabel>
          <BottomSheetTextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('recipes.placeholders.title')}
            placeholderTextColor={colors.textLight}
            style={{ backgroundColor: colors.inputBg, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.textDark, borderWidth: 1, borderColor: colors.border, marginBottom: 16 }}
          />

          {/* Description */}
          <FieldLabel>{t('recipes.labels.description')}</FieldLabel>
          <BottomSheetTextInput
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder={t('recipes.placeholders.description')}
            placeholderTextColor={colors.textLight}
            style={{ backgroundColor: colors.inputBg, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.textDark, borderWidth: 1, borderColor: colors.border, marginBottom: 16, minHeight: 70, textAlignVertical: 'top' }}
          />

          {/* Ingredients */}
          <Caption className="tracking-wider uppercase mb-3">
            🛒  {t('recipes.create.ingredientsSection')}
          </Caption>
          {ingredients.map((ing, idx) => (
            <EditIngredientRow
              key={idx}
              value={ing}
              onChange={v => setIngredients(prev => prev.map((x, i) => i === idx ? v : x))}
              onRemove={() => setIngredients(prev => prev.filter((_, i) => i !== idx))}
            />
          ))}
          <Pressable onPress={() => setIngredients(prev => [...prev, ''])} className="flex-row items-center gap-2 py-2 mb-4">
            <PlusCircle size={16} color={colors.primary} strokeWidth={1.5} />
            <Label className="text-primary">{t('recipes.create.addIngredient')}</Label>
          </Pressable>

          {/* Steps */}
          <Caption className="tracking-wider uppercase mb-3">
            📋  {t('recipes.create.stepsSection')}
          </Caption>
          {steps.map((step, idx) => (
            <EditStepRow
              key={idx}
              index={idx}
              value={step}
              onChange={v => setSteps(prev => prev.map((x, i) => i === idx ? v : x))}
              onRemove={() => setSteps(prev => prev.filter((_, i) => i !== idx))}
            />
          ))}
          <Pressable onPress={() => setSteps(prev => [...prev, ''])} className="flex-row items-center gap-2 py-2 mb-4">
            <PlusCircle size={16} color={colors.primary} strokeWidth={1.5} />
            <Label className="text-primary">{t('recipes.create.addStep')}</Label>
          </Pressable>

          {/* Notes */}
          {notes ? (
            <>
              <FieldLabel>{t('recipes.labels.notes')}</FieldLabel>
              <BottomSheetTextInput
                value={notes}
                onChangeText={setNotes}
                multiline
                placeholderTextColor={colors.textLight}
                style={{ backgroundColor: colors.inputBg, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.textDark, borderWidth: 1, borderColor: colors.border, marginBottom: 16, minHeight: 60, textAlignVertical: 'top' }}
              />
            </>
          ) : null}

          {/* Tutorial URL */}
          {tutorialUrl ? (
            <>
              <FieldLabel>{t('recipes.labels.tutorialUrl')}</FieldLabel>
              <BottomSheetTextInput
                value={tutorialUrl}
                onChangeText={setTutorialUrl}
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={colors.textLight}
                style={{ backgroundColor: colors.inputBg, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.textDark, borderWidth: 1, borderColor: colors.border, marginBottom: 16 }}
              />
            </>
          ) : null}

          {error ? <Caption className="text-red-500 mb-3">{error}</Caption> : null}
        </View>

      )}
    </AppBottomSheet>
  );
}
