import React, { forwardRef, useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import { useCreateFoodSpotViewModel } from './useCreateFoodSpotViewModel';
import AlertModal from '../../components/AlertModal';
import AppBottomSheet from '../../components/AppBottomSheet';
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
  const colors = useAppColors();
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
            <Text
              className={`text-sm font-semibold ${active ? 'text-white' : 'text-textMid'}`}>
              {'$'.repeat(i)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Sheet ─────────────────────────────────────────────────────────────────────

interface Props {
  foodSpotId?: string | null;
  onSuccess?: () => void;
}

const CreateFoodSpotSheet = forwardRef<BottomSheetModal, Props>(
  ({ foodSpotId, onSuccess }, ref) => {
    const colors = useAppColors();

    const handleClose = useCallback(() => {
      (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss();
    }, [ref]);

    const vm = useCreateFoodSpotViewModel({
      foodSpotId: foodSpotId ?? null,
      onClose: () => {
        handleClose();
        onSuccess?.();
      },
    });

    return (
      <>
        <AppBottomSheet
          ref={ref}
          scrollable
          title={vm.isEdit ? t.foodSpots.create.editTitle : t.foodSpots.create.newTitle}
          onSave={vm.handleSave}
          isSaving={vm.isSaving}
          onDismiss={vm.resetForm}>

          <View className="pb-[60px] pt-2">

            {/* Upload progress banner */}
            {vm.uploadProgress ? (
              <View className="mx-5 mb-3 px-4 py-2.5 rounded-2xl flex-row items-center gap-3 bg-secondary/12">
                <ActivityIndicator size="small" color={colors.secondary} />
                <Text className="text-sm text-secondary font-medium flex-1">
                  Uploading {vm.uploadProgress.done}/{vm.uploadProgress.total} photos...
                </Text>
              </View>
            ) : null}

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
        </AppBottomSheet>

        <AlertModal {...vm.alert} onDismiss={vm.dismissAlert} />
      </>
    );
  },
);

CreateFoodSpotSheet.displayName = 'CreateFoodSpotSheet';
export default CreateFoodSpotSheet;
