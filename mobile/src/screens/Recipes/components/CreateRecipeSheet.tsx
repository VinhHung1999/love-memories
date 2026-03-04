import React, { useRef, useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../../navigation/theme';
import t from '../../../locales/en';
import type { Recipe } from '../../../types';
import { useCreateRecipeViewModel } from './useCreateRecipeViewModel';
import AppBottomSheet from '../../../components/AppBottomSheet';
import FieldLabel from '../../../components/FieldLabel';
import Input from '../../../components/Input';
import TagInput from '../../../components/TagInput';
import PhotoPicker from '../../CreateMoment/components/PhotoPicker';

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ icon, label }: { icon: string; label: string }) {
  return (
    <Text className="text-[11px] font-bold text-textLight tracking-[0.8px] uppercase px-5 mb-2">
      {icon}{'  '}{label}
    </Text>
  );
}

function Divider() {
  return <View className="h-[1px] bg-border/40 mx-5 my-4" />;
}

// ── Ingredient row ────────────────────────────────────────────────────────────

function IngredientInputRow({
  ingredient,
  price,
  onChangeIngredient,
  onChangePrice,
  onRemove,
}: {
  ingredient: string;
  price: string;
  onChangeIngredient: (v: string) => void;
  onChangePrice: (v: string) => void;
  onRemove: () => void;
}) {
  const colors = useAppColors();
  return (
    <View className="flex-row items-center gap-2 mb-2">
      <View className="flex-1">
        <TextInput
          value={ingredient}
          onChangeText={onChangeIngredient}
          placeholder={t.recipes.create.ingredientPlaceholder}
          placeholderTextColor={colors.textLight}
          className="bg-inputBg border border-border rounded-xl px-3 h-[42px] text-sm text-textDark"
        />
      </View>
      <View className="w-[80px]">
        <TextInput
          value={price}
          onChangeText={onChangePrice}
          placeholder={t.recipes.create.pricePlaceholder}
          placeholderTextColor={colors.textLight}
          keyboardType="numeric"
          className="bg-inputBg border border-border rounded-xl px-3 h-[42px] text-sm text-textDark"
        />
      </View>
      <Pressable onPress={onRemove} hitSlop={8}>
        <Icon name="close-circle-outline" size={20} color={colors.textLight} />
      </Pressable>
    </View>
  );
}

// ── Step row ──────────────────────────────────────────────────────────────────

function StepInputRow({
  index,
  content,
  duration,
  onChangeContent,
  onChangeDuration,
  onRemove,
}: {
  index: number;
  content: string;
  duration: string; // total seconds as string
  onChangeContent: (v: string) => void;
  onChangeDuration: (v: string) => void;
  onRemove: () => void;
}) {
  const colors = useAppColors();

  // Parse stored seconds into local min/sec display state
  const totalSec = parseInt(duration || '0', 10) || 0;
  const [mins, setMins] = useState(String(Math.floor(totalSec / 60)));
  const [secs, setSecs] = useState(String(totalSec % 60));

  const commit = (m: string, s: string) => {
    const total = (parseInt(m || '0', 10) || 0) * 60 + (parseInt(s || '0', 10) || 0);
    onChangeDuration(total > 0 ? String(total) : '');
  };

  return (
    <View className="mb-2">
      {/* Step content row */}
      <View className="flex-row items-start gap-2">
        <View className="w-6 h-6 rounded-full bg-primary/10 items-center justify-center mt-[10px] flex-shrink-0">
          <Text className="text-[10px] font-bold text-primary">{index + 1}</Text>
        </View>
        <TextInput
          value={content}
          onChangeText={onChangeContent}
          placeholder={t.recipes.create.stepPlaceholder}
          placeholderTextColor={colors.textLight}
          multiline
          textAlignVertical="top"
          className="flex-1 bg-inputBg border border-border rounded-xl px-3 py-2.5 text-sm text-textDark min-h-[42px]"
        />
        <Pressable onPress={onRemove} hitSlop={8} className="mt-[10px]">
          <Icon name="close-circle-outline" size={20} color={colors.textLight} />
        </Pressable>
      </View>
      {/* Duration row — below content, indented to align with text */}
      <View className="flex-row items-center gap-1.5 mt-1.5 ml-8">
        <Icon name="timer-outline" size={13} color={colors.textLight} />
        <TextInput
          value={mins}
          onChangeText={v => { setMins(v); commit(v, secs); }}
          placeholder="0"
          placeholderTextColor={colors.textLight}
          keyboardType="numeric"
          maxLength={2}
          className="w-10 bg-inputBg border border-border rounded-lg px-2 h-7 text-xs text-textDark text-center"
        />
        <Text className="text-xs text-textLight">min</Text>
        <TextInput
          value={secs}
          onChangeText={v => { setSecs(v); commit(mins, v); }}
          placeholder="0"
          placeholderTextColor={colors.textLight}
          keyboardType="numeric"
          maxLength={2}
          className="w-10 bg-inputBg border border-border rounded-lg px-2 h-7 text-xs text-textDark text-center"
        />
        <Text className="text-xs text-textLight">sec</Text>
      </View>
    </View>
  );
}

// ── Sheet ─────────────────────────────────────────────────────────────────────

interface Props {
  recipe?: Recipe;
  onClose: () => void;
}

export default function CreateRecipeSheet({ recipe: initialRecipe, onClose }: Props) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const colors = useAppColors();

  useEffect(() => {
    sheetRef.current?.present();
  }, []);

  const vm = useCreateRecipeViewModel({ recipe: initialRecipe, onClose });

  return (
    <AppBottomSheet
      ref={sheetRef}
      scrollable
      title={vm.isEdit ? t.recipes.create.editTitle : t.recipes.create.newTitle}
      onSave={vm.handleSave}
      isSaving={vm.isSaving}
      onDismiss={onClose}>

      <View className="pb-[60px] pt-2">

        {/* ── Photos ── */}
        <SectionHeader icon="📷" label={t.recipes.create.photos} />
        <View className="px-5 mb-4">
          <PhotoPicker
            photos={vm.photos}
            onAddFromLibrary={vm.handleAddPhotoFromLibrary}
            onAddFromCamera={vm.handleAddPhotoFromCamera}
            onRemove={vm.handleRemovePhoto}
          />
        </View>

        <Divider />

        {/* ── Basic details ── */}
        <SectionHeader icon="✏️" label={t.recipes.create.details} />
        <View className="px-5">
          <FieldLabel>{`${t.recipes.labels.title} *`}</FieldLabel>
          <Input
            placeholder={t.recipes.placeholders.title}
            value={vm.title}
            onChangeText={vm.setTitle}
            maxLength={200}
          />

          <FieldLabel>{t.recipes.labels.description}</FieldLabel>
          <Input
            placeholder={t.recipes.placeholders.description}
            value={vm.description}
            onChangeText={vm.setDescription}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />
        </View>

        <Divider />

        {/* ── Ingredients ── */}
        <SectionHeader icon="🛒" label={t.recipes.create.ingredientsSection} />
        <View className="px-5">
          {vm.ingredients.map((row, idx) => (
            <IngredientInputRow
              key={idx}
              ingredient={row.ingredient}
              price={row.price}
              onChangeIngredient={v => vm.updateIngredient(idx, 'ingredient', v)}
              onChangePrice={v => vm.updateIngredient(idx, 'price', v)}
              onRemove={() => vm.removeIngredient(idx)}
            />
          ))}
          <Pressable
            onPress={vm.addIngredient}
            className="flex-row items-center gap-2 py-2 mt-1">
            <Icon name="plus-circle-outline" size={18} color={colors.primary} />
            <Text className="text-sm text-primary font-semibold">{t.recipes.create.addIngredient}</Text>
          </Pressable>
        </View>

        <Divider />

        {/* ── Steps ── */}
        <SectionHeader icon="👨‍🍳" label={t.recipes.create.stepsSection} />
        <View className="px-5">
          {vm.steps.map((row, idx) => (
            <StepInputRow
              key={idx}
              index={idx}
              content={row.content}
              duration={row.duration}
              onChangeContent={v => vm.updateStep(idx, 'content', v)}
              onChangeDuration={v => vm.updateStep(idx, 'duration', v)}
              onRemove={() => vm.removeStep(idx)}
            />
          ))}
          <Pressable
            onPress={vm.addStep}
            className="flex-row items-center gap-2 py-2 mt-1">
            <Icon name="plus-circle-outline" size={18} color={colors.primary} />
            <Text className="text-sm text-primary font-semibold">{t.recipes.create.addStep}</Text>
          </Pressable>
        </View>

        <Divider />

        {/* ── Tags ── */}
        <SectionHeader icon="🏷️" label={t.recipes.labels.tags} />
        <View className="px-5 mb-4">
          <TagInput
            tags={vm.tags}
            tagInput={vm.tagInput}
            onChangeTagInput={vm.setTagInput}
            onAddTag={vm.addTag}
            onRemoveTag={vm.removeTag}
          />
        </View>

        <Divider />

        {/* ── Notes + Tutorial ── */}
        <SectionHeader icon="📝" label={t.recipes.labels.notes} />
        <View className="px-5">
          <Input
            placeholder={t.recipes.placeholders.notes}
            value={vm.notes}
            onChangeText={vm.setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <FieldLabel>{t.recipes.labels.tutorialUrl}</FieldLabel>
          <Input
            placeholder={t.recipes.placeholders.tutorialUrl}
            value={vm.tutorialUrl}
            onChangeText={vm.setTutorialUrl}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

      </View>
    </AppBottomSheet>
  );
}
