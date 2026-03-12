import React, { useEffect, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Plus, X } from 'lucide-react-native';
import { useAppColors } from '../../../navigation/theme';
import t from '../../../locales/en';
import AppBottomSheet from '../../../components/AppBottomSheet';
import Input from '../../../components/Input';
import FieldLabel from '../../../components/FieldLabel';
import ErrorBox from '../../../components/ErrorBox';
import { usePlanFormViewModel } from './usePlanFormViewModel';
import type { DatePlan } from '../../../types';

export default function PlanFormSheet({
  onClose,
  initialPlan,
}: {
  onClose: () => void;
  initialPlan?: DatePlan;
}) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const colors = useAppColors();
  const vm = usePlanFormViewModel(onClose, initialPlan);

  useEffect(() => { sheetRef.current?.present(); }, []);

  return (
    <AppBottomSheet
      ref={sheetRef}
      scrollable
      title={initialPlan ? t.datePlanner.editPlan : t.datePlanner.createPlan}
      onSave={vm.save}
      isSaving={vm.isSaving}
      saveDisabled={!vm.isValid || vm.isSaving}
      onDismiss={onClose}>

      <View className="px-5 pb-10">
        {vm.error ? <ErrorBox message={vm.error} /> : null}

        {/* Title */}
        <View className="mb-4">
          <FieldLabel>{t.datePlanner.planTitleLabel}</FieldLabel>
          <Input
            value={vm.title}
            onChangeText={vm.setTitle}
            placeholder={t.datePlanner.planTitlePlaceholder}
          />
        </View>

        {/* Date */}
        <View className="mb-4">
          <FieldLabel>{t.datePlanner.planDateLabel}</FieldLabel>
          <Input
            value={vm.date}
            onChangeText={vm.setDate}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
          />
        </View>

        {/* Notes */}
        <View className="mb-4">
          <FieldLabel>{t.datePlanner.planNotesLabel}</FieldLabel>
          <Input
            value={vm.notes}
            onChangeText={vm.setNotes}
            placeholder={t.datePlanner.planNotesPlaceholder}
            multiline
            numberOfLines={2}
            style={{ minHeight: 60, textAlignVertical: 'top' }}
          />
        </View>

        {/* Stops */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <FieldLabel>{t.datePlanner.stopsLabel}</FieldLabel>
            <Pressable
              onPress={vm.addStop}
              className="flex-row items-center gap-1 px-2 py-1 rounded-lg"
              style={{ backgroundColor: colors.primaryMuted }}>
              <Plus size={14} color={colors.primary} strokeWidth={1.5} />
              <Text className="text-[12px] font-semibold" style={{ color: colors.primary }}>
                {t.datePlanner.addStop}
              </Text>
            </Pressable>
          </View>
          <View className="gap-3">
            {vm.stops.map((stop, idx) => (
              <View
                key={idx}
                className="rounded-2xl p-3 gap-2"
                style={{ backgroundColor: colors.gray100 }}>
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Input
                      value={stop.time}
                      onChangeText={v => vm.updateStop(idx, 'time', v)}
                      placeholder={t.datePlanner.stopTimePlaceholder}
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                  <Pressable
                    onPress={() => vm.removeStop(idx)}
                    className="w-10 h-10 rounded-xl items-center justify-center bg-white">
                    <X size={16} color={colors.textLight} strokeWidth={1.5} />
                  </Pressable>
                </View>
                <Input
                  value={stop.title}
                  onChangeText={v => vm.updateStop(idx, 'title', v)}
                  placeholder={t.datePlanner.stopTitlePlaceholder}
                />
                <Input
                  value={stop.notes}
                  onChangeText={v => vm.updateStop(idx, 'notes', v)}
                  placeholder={t.datePlanner.stopNotesPlaceholder}
                  multiline
                  numberOfLines={2}
                  style={{ minHeight: 50, textAlignVertical: 'top' }}
                />
              </View>
            ))}
          </View>
        </View>
      </View>
    </AppBottomSheet>
  );
}
