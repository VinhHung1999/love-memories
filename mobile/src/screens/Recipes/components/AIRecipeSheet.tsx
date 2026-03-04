import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from 'react-native';
import { BottomSheetModal, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQueryClient } from '@tanstack/react-query';
import { useAppColors } from '../../../navigation/theme';
import t from '../../../locales/en';
import { aiApi, recipesApi, type AIRecipeResult } from '../../../lib/api';
import AppBottomSheet from '../../../components/AppBottomSheet';
import FieldLabel from '../../../components/FieldLabel';

type Mode = 'text' | 'youtube' | 'url';
type Phase = 'input' | 'loading' | 'preview';

// ── Mode tab ─────────────────────────────────────────────────────────────────

function ModeTab({ label, icon, active, onPress }: { label: string; icon: string; active: boolean; onPress: () => void }) {
  const colors = useAppColors();
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl ${active ? 'bg-primary' : 'bg-gray-100'}`}>
      <Icon name={icon} size={14} color={active ? '#fff' : colors.textMid} />
      <Text className={`text-[12px] font-semibold ${active ? 'text-white' : 'text-textMid'}`}>{label}</Text>
    </Pressable>
  );
}

// ── Editable ingredient row ───────────────────────────────────────────────────

function EditIngredientRow({ value, onChange, onRemove }: { value: string; onChange: (v: string) => void; onRemove: () => void }) {
  const colors = useAppColors();
  return (
    <View className="flex-row items-center gap-2 mb-1.5">
      <Icon name="circle-small" size={16} color={colors.textLight} />
      <BottomSheetTextInput
        value={value}
        onChangeText={onChange}
        className="flex-1 text-sm text-textDark py-1.5 border-b border-border/40"
        placeholderTextColor={colors.textLight}
        placeholder={t.recipes.create.ingredientPlaceholder}
      />
      <Pressable onPress={onRemove} hitSlop={8}>
        <Icon name="close" size={16} color={colors.textLight} />
      </Pressable>
    </View>
  );
}

// ── Editable step row ─────────────────────────────────────────────────────────

function EditStepRow({ index, value, onChange, onRemove }: { index: number; value: string; onChange: (v: string) => void; onRemove: () => void }) {
  const colors = useAppColors();
  return (
    <View className="flex-row items-start gap-2 mb-1.5">
      <View className="w-5 h-5 rounded-full bg-primary/10 items-center justify-center mt-1.5 flex-shrink-0">
        <Text className="text-[10px] font-bold text-primary">{index + 1}</Text>
      </View>
      <BottomSheetTextInput
        value={value}
        onChangeText={onChange}
        multiline
        className="flex-1 text-sm text-textDark py-1.5 border-b border-border/40"
        placeholderTextColor={colors.textLight}
        placeholder={t.recipes.create.stepPlaceholder}
      />
      <Pressable onPress={onRemove} hitSlop={8}>
        <Icon name="close" size={16} color={colors.textLight} />
      </Pressable>
    </View>
  );
}

// ── Main Sheet ────────────────────────────────────────────────────────────────

export default function AIRecipeSheet({ onClose }: { onClose?: () => void }) {
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

  const modeIcons: Record<Mode, string> = { text: 'text-long', youtube: 'youtube', url: 'web' };
  const modeLabels: Record<Mode, string> = {
    text: t.recipes.ai.modeText,
    youtube: t.recipes.ai.modeYoutube,
    url: t.recipes.ai.modeUrl,
  };
  const placeholders: Record<Mode, string> = {
    text: t.recipes.ai.placeholderText,
    youtube: t.recipes.ai.placeholderYoutube,
    url: t.recipes.ai.placeholderUrl,
  };

  const handleGenerate = async () => {
    if (!input.trim()) { setError(t.recipes.ai.errorEmpty); return; }
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
      setError(t.recipes.ai.errorFailed);
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
      setError(t.recipes.errors.saveFailed);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppBottomSheet
      ref={sheetRef}
      icon="robot-outline"
      iconBgClass="bg-primary/10"
      title={t.recipes.ai.title}
      subtitle={t.recipes.ai.subtitle}
      scrollable
      snapPoints={['92%']}
      onDismiss={onClose}
    >
      {phase === 'loading' ? (

        /* ── Loading ── */
        <View className="h-64 items-center justify-center gap-4">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-sm text-textMid">{t.recipes.ai.generating}</Text>
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

          {error ? <Text className="text-xs text-red-500 mt-2">{error}</Text> : null}

          <Pressable
            onPress={handleGenerate}
            className="mt-5 rounded-2xl bg-primary py-4 flex-row items-center justify-center gap-2">
            <Icon name="auto-fix" size={18} color="#fff" />
            <Text className="text-white font-bold text-base">{t.recipes.ai.generate}</Text>
          </Pressable>
        </View>

      ) : (

        /* ── Preview / edit phase ── */
        <View className="px-5 pt-4 pb-8">
          {/* Title */}
          <FieldLabel>{t.recipes.labels.title}</FieldLabel>
          <BottomSheetTextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t.recipes.placeholders.title}
            placeholderTextColor={colors.textLight}
            style={{ backgroundColor: colors.inputBg, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.textDark, borderWidth: 1, borderColor: colors.border, marginBottom: 16 }}
          />

          {/* Description */}
          <FieldLabel>{t.recipes.labels.description}</FieldLabel>
          <BottomSheetTextInput
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder={t.recipes.placeholders.description}
            placeholderTextColor={colors.textLight}
            style={{ backgroundColor: colors.inputBg, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.textDark, borderWidth: 1, borderColor: colors.border, marginBottom: 16, minHeight: 70, textAlignVertical: 'top' }}
          />

          {/* Ingredients */}
          <Text className="text-[11px] font-bold text-textLight tracking-wider uppercase mb-3">
            🛒  {t.recipes.create.ingredientsSection}
          </Text>
          {ingredients.map((ing, idx) => (
            <EditIngredientRow
              key={idx}
              value={ing}
              onChange={v => setIngredients(prev => prev.map((x, i) => i === idx ? v : x))}
              onRemove={() => setIngredients(prev => prev.filter((_, i) => i !== idx))}
            />
          ))}
          <Pressable onPress={() => setIngredients(prev => [...prev, ''])} className="flex-row items-center gap-2 py-2 mb-4">
            <Icon name="plus-circle-outline" size={16} color={colors.primary} />
            <Text className="text-sm text-primary font-medium">{t.recipes.create.addIngredient}</Text>
          </Pressable>

          {/* Steps */}
          <Text className="text-[11px] font-bold text-textLight tracking-wider uppercase mb-3">
            📋  {t.recipes.create.stepsSection}
          </Text>
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
            <Icon name="plus-circle-outline" size={16} color={colors.primary} />
            <Text className="text-sm text-primary font-medium">{t.recipes.create.addStep}</Text>
          </Pressable>

          {/* Notes */}
          {notes ? (
            <>
              <FieldLabel>{t.recipes.labels.notes}</FieldLabel>
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
              <FieldLabel>{t.recipes.labels.tutorialUrl}</FieldLabel>
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

          {error ? <Text className="text-xs text-red-500 mb-3">{error}</Text> : null}

          {/* Save CTA */}
          <Pressable
            onPress={handleSave}
            disabled={isSaving || !title.trim()}
            className={`mt-2 rounded-2xl py-4 flex-row items-center justify-center gap-2 ${title.trim() ? 'bg-primary' : 'bg-gray-200'}`}>
            {isSaving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Icon name="content-save-outline" size={18} color="#fff" />}
            <Text className="text-white font-bold text-base">{t.recipes.ai.save}</Text>
          </Pressable>
        </View>

      )}
    </AppBottomSheet>
  );
}
