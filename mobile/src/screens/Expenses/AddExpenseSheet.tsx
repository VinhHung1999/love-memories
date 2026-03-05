import React, { useEffect, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BottomSheetModal, BottomSheetTextInput, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import type { Expense, ExpenseCategory } from '../../lib/api';
import { useAddExpenseViewModel } from './useAddExpenseViewModel';
import AppBottomSheet from '../../components/AppBottomSheet';
import FieldLabel from '../../components/FieldLabel';
import DatePickerField from '../../components/DatePickerField';
import { EXPENSE_CATEGORIES } from './expensesConstants';

interface AddExpenseSheetProps {
  editingExpense?: Expense | null;
  onClose: () => void;
}

export default function AddExpenseSheet({ editingExpense = null, onClose }: AddExpenseSheetProps) {
  const colors = useAppColors();
  const sheetRef = useRef<BottomSheetModal>(null);
  const vm = useAddExpenseViewModel(editingExpense, onClose);

  useEffect(() => {
    sheetRef.current?.present();
  }, []);

  const EXPENSE_CATS = EXPENSE_CATEGORIES.filter(c => c.key !== 'all') as { key: ExpenseCategory; emoji: string; label: string }[];

  return (
    <AppBottomSheet
      ref={sheetRef}
      title={vm.isEditing ? t.expenses.edit : t.expenses.add}
      scrollable
      snapPoints={['92%']}
      onSave={vm.handleSave}
      saveDisabled={!vm.isValid}
      isSaving={vm.isSaving}
      onDismiss={onClose}
    >
      {/* ── Amount Hero ── */}
      <View className="items-center px-5 py-6 border-b border-border/40">
        <Text className="text-xs font-bold text-textLight tracking-[1px] uppercase mb-3">
          {t.expenses.labels.amount}
        </Text>
        <View className="flex-row items-baseline gap-1">
          <Text className="text-2xl font-bold text-textMid">₫</Text>
          <BottomSheetTextInput
            value={vm.amount}
            onChangeText={vm.handleAmountChange}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.textLight}
            style={{
              fontSize: 48,
              fontWeight: 'bold',
              color: colors.textDark,
              minWidth: 120,
              textAlign: 'center',
            }}
          />
        </View>
      </View>

      <View className="px-5 pt-4 pb-8">
        {/* ── Category Grid ── */}
        <FieldLabel>{t.expenses.labels.category}</FieldLabel>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {EXPENSE_CATS.map(cat => {
            const isSelected = vm.category === cat.key;
            return (
              <Pressable
                key={cat.key}
                onPress={() => vm.setCategory(cat.key)}
                className="items-center gap-1 rounded-2xl px-3 py-2.5 border"
                style={{ minWidth: '22%', backgroundColor: isSelected ? colors.primary + '1A' : '#fff', borderColor: isSelected ? colors.primary + '4D' : colors.border + '99' }}>
                <Text className="text-2xl">{cat.emoji}</Text>
                <Text className="text-[10px] font-semibold" style={{ color: isSelected ? colors.primary : colors.textMid }}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Description ── */}
        <FieldLabel>{t.expenses.labels.description}</FieldLabel>
        <BottomSheetTextInput
          value={vm.description}
          onChangeText={vm.setDescription}
          placeholder={t.expenses.placeholders.description}
          placeholderTextColor={colors.textLight}
          returnKeyType="next"
          style={{
            backgroundColor: colors.inputBg,
            borderRadius: 16,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 14,
            color: colors.textDark,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 16,
          }}
        />

        {/* ── Date ── */}
        <FieldLabel>{t.expenses.labels.date}</FieldLabel>
        <DatePickerField
          value={new Date(vm.date + 'T00:00:00')}
          onChange={(d) => vm.setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)}
        />

        {/* ── Note ── */}
        <FieldLabel>{t.expenses.labels.note}</FieldLabel>
        <BottomSheetTextInput
          value={vm.note}
          onChangeText={vm.setNote}
          placeholder={t.expenses.placeholders.note}
          placeholderTextColor={colors.textLight}
          multiline
          style={{
            backgroundColor: colors.inputBg,
            borderRadius: 16,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 14,
            color: colors.textDark,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 8,
            minHeight: 72,
            textAlignVertical: 'top',
          }}
        />

        {vm.error ? <Text className="text-xs text-error mt-1">{vm.error}</Text> : null}
      </View>
    </AppBottomSheet>
  );
}
