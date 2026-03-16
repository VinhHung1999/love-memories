import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Caption } from '../../../components/Typography';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useAppColors } from '../../../navigation/theme';
import { useTranslation } from 'react-i18next';
import AppBottomSheet from '../../../components/AppBottomSheet';
import Input from '../../../components/Input';
import FieldLabel from '../../../components/FieldLabel';
import ErrorBox from '../../../components/ErrorBox';
import { useWishFormViewModel } from './useWishFormViewModel';
import { useWishCategories } from '../useWishesViewModel';
import type { DateWish } from '../../../types';

export default function WishFormSheet({
  onClose,
  initialWish,
}: {
  onClose: () => void;
  initialWish?: DateWish;
}) {
  const { t } = useTranslation();
  const wishCategories = useWishCategories();
  const sheetRef = useRef<BottomSheetModal>(null);
  const colors = useAppColors();
  const vm = useWishFormViewModel(onClose, initialWish);

  useEffect(() => { sheetRef.current?.present(); }, []);

  return (
    <AppBottomSheet
      ref={sheetRef}
      scrollable
      title={initialWish ? t('datePlanner.editWish') : t('datePlanner.addWish')}
      onSave={vm.save}
      isSaving={vm.isSaving}
      saveDisabled={!vm.isValid || vm.isSaving}
      onDismiss={onClose}>

      <View className="px-5 pt-4 pb-10">
        {vm.error ? <ErrorBox message={vm.error} /> : null}

        {/* Title */}
        <View className="mb-4">
          <FieldLabel>{t('datePlanner.wishTitleLabel')}</FieldLabel>
          <Input
            bottomSheet
            value={vm.title}
            onChangeText={vm.setTitle}
            placeholder={t('datePlanner.wishTitlePlaceholder')}
            returnKeyType="next"
          />
        </View>

        {/* Description */}
        <View className="mb-4">
          <FieldLabel>{t('datePlanner.wishDescriptionLabel')}</FieldLabel>
          <Input
            bottomSheet
            value={vm.description}
            onChangeText={vm.setDescription}
            placeholder={t('datePlanner.wishDescriptionPlaceholder')}
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />
        </View>

        {/* Category */}
        <View className="mb-4">
          <FieldLabel>{t('datePlanner.wishCategoryLabel')}</FieldLabel>
          <View className="flex-row flex-wrap gap-2 mt-1">
            {wishCategories.map(cat => (
              <TouchableOpacity
                key={cat.key}
                onPress={() => vm.setCategory(cat.key)}
                className="flex-row items-center gap-1.5 rounded-xl px-3 py-2"
                style={{
                  backgroundColor: vm.category === cat.key ? colors.primaryMuted : colors.gray100,
                  borderWidth: 1.5,
                  borderColor: vm.category === cat.key ? colors.primary : 'transparent',
                }}>
                <Caption>{cat.emoji}</Caption>
                <Caption
                  className="font-medium"
                  style={{ color: vm.category === cat.key ? colors.primary : colors.textMid }}>
                  {cat.label}
                </Caption>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* URL */}
        <View className="mb-4">
          <FieldLabel>{t('datePlanner.wishUrlLabel')}</FieldLabel>
          <Input
            bottomSheet
            value={vm.url}
            onChangeText={vm.setUrl}
            placeholder={t('datePlanner.wishUrlPlaceholder')}
            keyboardType="url"
            autoCapitalize="none"
          />
        </View>
      </View>
    </AppBottomSheet>
  );
}
