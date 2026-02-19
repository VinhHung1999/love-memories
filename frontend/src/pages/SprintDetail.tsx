import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { ArrowLeft, Plus, Trash2, GripVertical, Flag } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { sprintsApi, goalsApi } from '../lib/api';
import type { Goal, GoalStatus, GoalPriority } from '../types';
import Modal from '../components/Modal';

const columns: { id: GoalStatus; title: string; color: string }[] = [
  { id: 'TODO', title: 'To Do', color: 'bg-gray-100' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-50' },
  { id: 'DONE', title: 'Done', color: 'bg-green-50' },
];

const priorityColors: Record<GoalPriority, string> = {
  LOW: 'text-gray-400',
  MEDIUM: 'text-secondary',
  HIGH: 'text-red-500',
};

export default function SprintDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showGoalForm, setShowGoalForm] = useState(false);

  const { data: sprint, isLoading } = useQuery({
    queryKey: ['sprints', id],
    queryFn: () => sprintsApi.get(id!),
    enabled: !!id,
  });

  const reorderMutation = useMutation({
    mutationFn: goalsApi.reorder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sprints', id] }),
  });

  const deleteGoalMutation = useMutation({
    mutationFn: goalsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', id] });
      toast.success('Goal deleted');
    },
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !sprint) return;

    const sourceCol = result.source.droppableId as GoalStatus;
    const destCol = result.destination.droppableId as GoalStatus;
    const goals = [...sprint.goals];

    // Find the dragged goal
    const draggedGoal = goals.find((g) => g.id === result.draggableId);
    if (!draggedGoal) return;

    // Get goals in destination column (excluding the dragged goal if it was there)
    const destGoals = goals
      .filter((g) => g.id !== draggedGoal.id && g.status === destCol)
      .sort((a, b) => a.order - b.order);

    // Insert at new position
    destGoals.splice(result.destination.index, 0, { ...draggedGoal, status: destCol });

    // Build reorder payload
    const reorderPayload = destGoals.map((g, i) => ({
      id: g.id,
      order: i,
      status: destCol,
    }));

    // If source column is different, also reorder source column
    if (sourceCol !== destCol) {
      const sourceGoals = goals
        .filter((g) => g.id !== draggedGoal.id && g.status === sourceCol)
        .sort((a, b) => a.order - b.order);
      sourceGoals.forEach((g, i) => {
        reorderPayload.push({ id: g.id, order: i, status: sourceCol });
      });
    }

    reorderMutation.mutate(reorderPayload);
  };

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-1/3" /><div className="h-96 bg-gray-200 rounded-2xl" /></div>;
  if (!sprint) return <div className="text-center py-16 text-text-light">Sprint not found</div>;

  const doneCount = sprint.goals.filter((g) => g.status === 'DONE').length;
  const progress = sprint.goals.length > 0 ? Math.round((doneCount / sprint.goals.length) * 100) : 0;

  return (
    <div>
      <button onClick={() => navigate('/goals')} className="flex items-center gap-2 text-text-light hover:text-accent mb-4 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Goals
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold">{sprint.name}</h1>
          <p className="text-text-light text-sm mt-1">
            {format(new Date(sprint.startDate), 'MMM d')} — {format(new Date(sprint.endDate), 'MMM d, yyyy')}
            <span className="ml-3">{doneCount}/{sprint.goals.length} done ({progress}%)</span>
          </p>
        </div>
        <button
          onClick={() => setShowGoalForm(true)}
          className="bg-accent text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-accent-dark transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Goal
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-8">
        <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((col) => {
            const colGoals = sprint.goals
              .filter((g) => g.status === col.id)
              .sort((a, b) => a.order - b.order);

            return (
              <div key={col.id} className={`rounded-2xl p-4 ${col.color} min-h-[300px]`}>
                <h3 className="font-medium text-sm mb-3 flex items-center justify-between">
                  {col.title}
                  <span className="bg-white/60 px-2 py-0.5 rounded-full text-xs">{colGoals.length}</span>
                </h3>
                <Droppable droppableId={col.id}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2 min-h-[50px]">
                      {colGoals.map((goal, index) => (
                        <Draggable key={goal.id} draggableId={goal.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`bg-white rounded-xl p-3 shadow-sm group ${
                                snapshot.isDragging ? 'shadow-lg ring-2 ring-accent/30' : ''
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <div {...provided.dragHandleProps} className="mt-0.5 text-gray-300 hover:text-gray-500">
                                  <GripVertical className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">{goal.title}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Flag className={`w-3 h-3 ${priorityColors[goal.priority]}`} />
                                    {goal.assignee && (
                                      <span className="text-xs text-text-light">{goal.assignee}</span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => deleteGoalMutation.mutate(goal.id)}
                                  className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <GoalFormModal open={showGoalForm} onClose={() => setShowGoalForm(false)} sprintId={id!} />
    </div>
  );
}

function GoalFormModal({ open, onClose, sprintId }: { open: boolean; onClose: () => void; sprintId: string }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<GoalPriority>('MEDIUM');
  const [assignee, setAssignee] = useState('');

  const mutation = useMutation({
    mutationFn: () => goalsApi.create(sprintId, { title, priority, assignee: assignee || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', sprintId] });
      toast.success('Goal added!');
      onClose();
      setTitle(''); setAssignee('');
    },
    onError: () => toast.error('Failed to add goal'),
  });

  return (
    <Modal open={open} onClose={onClose} title="New Goal">
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Goal Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Plan weekend trip" className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Priority</label>
          <div className="flex gap-2">
            {(['LOW', 'MEDIUM', 'HIGH'] as GoalPriority[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  priority === p ? 'bg-accent text-white' : 'bg-gray-100 text-text-light hover:bg-gray-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Assignee</label>
          <input value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="e.g. Anh / Em" className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
        </div>
        <div className="flex gap-3 pt-3 pb-2 sticky bottom-0 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 border-t border-border mt-4">
          <button type="button" onClick={onClose} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={mutation.isPending || !title} className="flex-1 bg-accent text-white rounded-xl py-2.5 text-sm font-medium hover:bg-accent-dark disabled:opacity-50">
            {mutation.isPending ? 'Adding...' : 'Add Goal'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
