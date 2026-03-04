import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi, type Expense, type ExpenseCategory } from '../../lib/api';

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useAddExpenseViewModel(
  editingExpense: Expense | null,
  onClose: () => void,
) {
  const queryClient = useQueryClient();
  const isEditing = editingExpense !== null;

  const [amount, setAmountRaw] = useState(editingExpense ? String(editingExpense.amount) : '');
  const [description, setDescription] = useState(editingExpense?.description ?? '');
  const [category, setCategory] = useState<ExpenseCategory>(editingExpense?.category ?? 'food');
  const [date, setDate] = useState(editingExpense?.date.slice(0, 10) ?? todayString());
  const [note, setNote] = useState(editingExpense?.note ?? '');
  const [error, setError] = useState('');

  const amountNumber = parseInt(amount.replace(/\D/g, ''), 10) || 0;
  const isValid = amountNumber > 0 && description.trim().length > 0;

  const handleAmountChange = useCallback((v: string) => {
    setAmountRaw(v.replace(/\D/g, ''));
  }, []);

  const createMutation = useMutation({
    mutationFn: expensesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-stats'] });
      onClose();
    },
    onError: () => setError('Failed to save expense'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof expensesApi.update>[1] }) =>
      expensesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-stats'] });
      onClose();
    },
    onError: () => setError('Failed to save expense'),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = useCallback(() => {
    if (!isValid) return;
    const data = {
      amount: amountNumber,
      description: description.trim(),
      category,
      date,
      ...(note.trim() ? { note: note.trim() } : {}),
    };
    if (isEditing && editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, data });
    } else {
      createMutation.mutate(data);
    }
  }, [isValid, amountNumber, description, category, date, note, isEditing, editingExpense, createMutation, updateMutation]);

  return {
    isEditing,
    amount,
    handleAmountChange,
    description,
    setDescription,
    category,
    setCategory,
    date,
    setDate,
    note,
    setNote,
    isValid,
    isSaving,
    error,
    handleSave,
  };
}
