import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import type { FoodSpot } from '../../types';
import { useCreateFoodSpotViewModel } from './useCreateFoodSpotViewModel';
import AlertModal from '../../components/AlertModal';
import FieldLabel from '../../components/FieldLabel';
import Input from '../../components/Input';
import LocationPicker from '../../components/LocationPicker';
import TagInput from '../../components/TagInput';
import PhotoPicker from '../CreateMoment/components/PhotoPicker';

// ── Star Rating Picker ────────────────────────────────────────────────────────

function StarRatingPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View className="flex-row gap-2 py-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Pressable key={i} onPress={() => onChange(i)} hitSlop={4}>
          <Icon
            name={i <= value ? 'star' : 'star-outline'}
            size={28}
            color="#F59E0B"
          />
        </Pressable>
      ))}
      <Text className="text-sm text-textMid self-center ml-1">{value}/5</Text>
    </View>
  );
}

// ── Price Range Picker ────────────────────────────────────────────────────────

function PriceRangePicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View className="flex-row gap-2 py-1">
      {[1, 2, 3, 4].map(i => {
        const active = i === value;
        return (
          <Pressable
            key={i}
            onPress={() => onChange(i)}
            className={`px-3 py-1.5 rounded-xl border ${
              active ? 'bg-secondary border-secondary' : 'bg-transparent border-border'
            }`}>
            <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-textMid'}`}>
              {'$'.repeat(i)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Form ──────────────────────────────────────────────────────────────────────

interface Props {
  foodSpot?: FoodSpot;
}

export default function CreateFoodSpotForm({ foodSpot: initialFoodSpot }: Props) {
  const navigation = useNavigation();
  const colors = useAppColors();
  const insets = useSafeAreaInsets();

  const vm = useCreateFoodSpotViewModel({
    foodSpotId: initialFoodSpot?.id ?? null,
    initialFoodSpot,
    onClose: () => navigation.goBack(),
  });

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* ── Header ── */}
      {/* eslint-disable-next-line react-native/no-inline-styles */}
      <View
        className="flex-row items-center px-4 border-b border-border bg-white"
        style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-9 h-9 items-center justify-center rounded-xl"
          hitSlop={8}>
          <Icon name="close" size={22} color={colors.textDark} />
        </TouchableOpacity>

        <Text className="flex-1 text-center text-base font-semibold text-textDark">
          {vm.isEdit ? t.foodSpots.create.editTitle : t.foodSpots.create.newTitle}
        </Text>

        <TouchableOpacity
          onPress={vm.handleSave}
          disabled={vm.isSaving}
          className={`px-4 py-2 rounded-xl ${vm.isSaving ? 'opacity-50' : ''}`}
          style={{ backgroundColor: colors.secondary }}
          hitSlop={4}>
          <Text className="text-sm font-semibold text-white">
            {vm.isSaving ? t.common.loading : t.common.save}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>

        <View className="pt-4">

          {/* ── Photos ── */}
          <Text className="text-[11px] font-bold text-textLight tracking-[0.8px] uppercase px-5 mb-2">
            {`📷  ${t.foodSpots.create.photos}`}
          </Text>
          <View className="px-5 mb-4">
            <PhotoPicker
              photos={vm.photos}
              onAddFromLibrary={vm.handleAddPhotoFromLibrary}
              onAddFromCamera={vm.handleAddPhotoFromCamera}
              onRemove={vm.handleRemovePhoto}
            />
          </View>

          <View className="h-[1px] bg-border/40 mx-5 mb-4" />

          {/* ── Details ── */}
          <Text className="text-[11px] font-bold text-textLight tracking-[0.8px] uppercase px-5 mb-2">
            {`✏️  ${t.foodSpots.create.details}`}
          </Text>
          <View className="px-5">
            <FieldLabel>{`${t.foodSpots.labels.name} *`}</FieldLabel>
            <Input
              placeholder={t.foodSpots.placeholders.name}
              value={vm.name}
              onChangeText={vm.setName}
              maxLength={200}
            />

            <FieldLabel>{t.foodSpots.labels.description}</FieldLabel>
            <Input
              placeholder={t.foodSpots.placeholders.description}
              value={vm.description}
              onChangeText={vm.setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <FieldLabel>{t.foodSpots.labels.rating}</FieldLabel>
            <StarRatingPicker value={vm.rating} onChange={vm.setRating} />

            <FieldLabel>{t.foodSpots.labels.priceRange}</FieldLabel>
            <PriceRangePicker value={vm.priceRange} onChange={vm.setPriceRange} />

            <LocationPicker
              label={t.foodSpots.labels.location}
              location={vm.location}
              latitude={vm.latitude}
              longitude={vm.longitude}
              onLocationChange={vm.handleLocationChange}
            />
          </View>

          <View className="h-[1px] bg-border/40 mx-5 mb-4" />

          {/* ── Tags ── */}
          <Text className="text-[11px] font-bold text-textLight tracking-[0.8px] uppercase px-5 mb-2">
            {`🏷️  ${t.foodSpots.labels.tags}`}
          </Text>
          <View className="px-5 mb-4">
            <TagInput
              tags={vm.tags}
              tagInput={vm.tagInput}
              onChangeTagInput={vm.setTagInput}
              onAddTag={vm.handleAddTag}
              onRemoveTag={vm.handleRemoveTag}
            />
          </View>

        </View>
      </ScrollView>

      <AlertModal {...vm.alert} onDismiss={vm.dismissAlert} />
    </KeyboardAvoidingView>
  );
}
