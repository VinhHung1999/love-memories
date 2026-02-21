import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { goalsApi, sprintsApi } from '../lib/api';
import type { Goal, GoalPriority } from '../types';
import Modal from './Modal';

const priorityColors: Record<GoalPriority, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-secondary/10 text-secondary',
  HIGH: 'bg-red-100 text-red-600',
};

interface GoalDetailModalProps {
  goal: Goal | null;
  open: boolean;
  onClose: () => void;
  /** Query keys to invalidate on save/delete */
  invalidateKeys?: string[][];
}

export default function GoalDetailModal({ goal, open, onClose, invalidateKeys = [] }: GoalDetailModalProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(goal?.title || '');
  const [description, setDescription] = useState(goal?.description || '');
  const [priority, setPriority] = useState<GoalPriority>(goal?.priority || 'MEDIUM');
  const [assignee, setAssignee] = useState(goal?.assignee || '');
  const [dueDate, setDueDate] = useState(goal?.dueDate ? format(new Date(goal.dueDate), 'yyyy-MM-dd') : '');
  const [sprintId, setSprintId] = useState<string | null>(goal?.sprintId ?? null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync form state when goal prop changes (useState only initialises once on mount)
  useEffect(() => {
    if (goal) {
      setTitle(goal.title || '');
      setDescription(goal.description || '');
      setPriority(goal.priority || 'MEDIUM');
      setAssignee(goal.assignee || '');
      setDueDate(goal.dueDate ? format(new Date(goal.dueDate), 'yyyy-MM-dd') : '');
      setSprintId(goal.sprintId ?? null);
      setConfirmDelete(false);
    }
  }, [goal]);

  const { data: sprints = [] } = useQuery({ queryKey: ['sprints'], queryFn: sprintsApi.list });

  const invalidate = () => {
    invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
    queryClient.invalidateQueries({ queryKey: ['goals', 'backlog'] });
    queryClient.invalidateQueries({ queryKey: ['sprints'] });
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      goalsApi.update(goal!.id, {
        title,
        description: description || undefined,
        priority,
        assignee: assignee || undefined,
        dueDate: dueDate || undefined,
        sprintId,
      } as any),
    onSuccess: () => {
      // If sprint assignment changed, call assign endpoint separately
      if (sprintId !== goal?.sprintId) {
        return goalsApi.assign(goal!.id, sprintId).then(() => {
          invalidate();
          toast.success('Goal saved');
          onClose();
        });
      }
      invalidate();
      toast.success('Goal saved');
      onClose();
    },
    onError: () => toast.error('Failed to save goal'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => goalsApi.delete(goal!.id),
    onSuccess: () => {
      invalidate();
      toast.success('Goal deleted');
      onClose();
    },
    onError: () => toast.error('Failed to delete goal'),
  });

  if (!goal) return null;

  const isOverdue = goal.dueDate && new Date(goal.dueDate) < new Date() && goal.status !== 'DONE';

  return (
    <Modal open={open} onClose={onClose} title="Goal Details">
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Add notes or details..."
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
          />
        </div>

        {/* Priority + Assignee */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <div className="flex flex-col gap-1">
              {(['LOW', 'MEDIUM', 'HIGH'] as GoalPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${
                    priority === p ? priorityColors[p] + ' ring-1 ring-current' : 'bg-gray-100 text-text-light hover:bg-gray-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Assignee</label>
              <input
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="Anh / Em"
                className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 ${
                  isOverdue ? 'border-red-300 text-red-600' : 'border-border'
                }`}
              />
              {isOverdue && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Overdue
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sprint assignment */}
        <div>
          <label className="block text-sm font-medium mb-1">Sprint</label>
          <select
            value={sprintId || ''}
            onChange={(e) => setSprintId(e.target.value || null)}
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            <option value="">Backlog (no sprint)</option>
            {sprints.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
            ))}
          </select>
        </div>

        {/* Status (read-only — changed via kanban) */}
        <div className="flex items-center gap-2 text-xs text-text-light bg-gray-50 px-3 py-2 rounded-lg">
          <span>Status: <span className="font-medium text-gray-700">{goal.status.replace('_', ' ')}</span></span>
          <span className="text-gray-300">·</span>
          <span>Change status by dragging in the kanban board</span>
        </div>

        {/* Delete confirm */}
        {confirmDelete && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm">
            <p className="text-red-700 font-medium mb-2">Delete this goal?</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 border border-border rounded-lg py-1.5 text-xs hover:bg-gray-50">Cancel</button>
              <button onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending} className="flex-1 bg-red-500 text-white rounded-lg py-1.5 text-xs hover:bg-red-600 disabled:opacity-50">
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-3 pb-2 sticky bottom-0 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 border-t border-border mt-4">
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="p-2.5 border border-border rounded-xl hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button type="button" onClick={onClose} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !title}
            className="flex-1 bg-accent text-white rounded-xl py-2.5 text-sm font-medium hover:bg-accent-dark disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
