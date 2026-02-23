import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { ArrowLeft, Plus, GripVertical, Flag, Calendar, Edit2, Play, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { format, isPast } from 'date-fns';
import toast from 'react-hot-toast';
import { sprintsApi, goalsApi } from '../lib/api';
import { useCheckAchievements } from '../lib/achievements';
import type { Goal, GoalStatus, GoalPriority, SprintStatus } from '../types';
import Modal from '../components/Modal';
import GoalDetailModal from '../components/GoalDetailModal';

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
  const checkAchievements = useCheckAchievements();
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showSprintEdit, setShowSprintEdit] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<SprintStatus | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: sprint, isLoading } = useQuery({
    queryKey: ['sprints', id],
    queryFn: () => sprintsApi.get(id!),
    enabled: !!id,
  });

  const reorderMutation = useMutation({
    mutationFn: goalsApi.reorder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', id] });
      checkAchievements();
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: SprintStatus) => sprintsApi.updateStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', id] });
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      toast.success('Sprint status updated');
      setConfirmStatus(null);
      checkAchievements();
    },
    onError: () => toast.error('Failed to update sprint status'),
  });

  const deleteSprintMutation = useMutation({
    mutationFn: () => sprintsApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      toast.success('Sprint deleted');
      navigate('/goals');
    },
    onError: () => toast.error('Failed to delete sprint'),
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !sprint) return;
    const sourceCol = result.source.droppableId as GoalStatus;
    const destCol = result.destination.droppableId as GoalStatus;
    const goals = [...sprint.goals];
    const draggedGoal = goals.find((g) => g.id === result.draggableId);
    if (!draggedGoal) return;
    const destGoals = goals.filter((g) => g.id !== draggedGoal.id && g.status === destCol).sort((a, b) => a.order - b.order);
    destGoals.splice(result.destination.index, 0, { ...draggedGoal, status: destCol });
    const reorderPayload = destGoals.map((g, i) => ({ id: g.id, order: i, status: destCol }));
    if (sourceCol !== destCol) {
      goals.filter((g) => g.id !== draggedGoal.id && g.status === sourceCol).sort((a, b) => a.order - b.order)
        .forEach((g, i) => reorderPayload.push({ id: g.id, order: i, status: sourceCol }));
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

      {/* Sprint Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-2xl font-bold truncate">{sprint.name}</h1>
            {sprint.description && (
              <p className="text-text-light text-sm mt-1">{sprint.description}</p>
            )}
            <p className="text-text-light text-xs mt-1.5 flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              {format(new Date(sprint.startDate), 'MMM d')} — {format(new Date(sprint.endDate), 'MMM d, yyyy')}
              <span className="text-gray-300">·</span>
              {doneCount}/{sprint.goals.length} done ({progress}%)
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowSprintEdit(true)}
              className="p-2 rounded-xl border border-border hover:bg-gray-50 transition-colors"
              title="Edit sprint"
            >
              <Edit2 className="w-4 h-4 text-text-light" />
            </button>
            <button
              onClick={() => setShowGoalForm(true)}
              className="bg-accent text-white px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 hover:bg-accent-dark transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Goal
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-4">
          <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        {/* Status action buttons */}
        <div className="flex items-center gap-2 mt-4">
          {sprint.status === 'PLANNING' && (
            <button
              onClick={() => setConfirmStatus('ACTIVE')}
              className="flex items-center gap-1.5 text-sm text-green-600 border border-green-200 bg-green-50 px-3 py-1.5 rounded-xl hover:bg-green-100 transition-colors"
            >
              <Play className="w-3.5 h-3.5" /> Start Sprint
            </button>
          )}
          {sprint.status === 'ACTIVE' && (
            <button
              onClick={() => setConfirmStatus('COMPLETED')}
              className="flex items-center gap-1.5 text-sm text-blue-600 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Complete Sprint
            </button>
          )}
          {sprint.status === 'COMPLETED' && (
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-xl">Sprint completed ✓</span>
          )}
          <button
            onClick={() => setConfirmDelete(true)}
            className="ml-auto flex items-center gap-1.5 text-sm text-red-500 border border-red-200 bg-red-50 px-3 py-1.5 rounded-xl hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((col) => {
            const colGoals = sprint.goals.filter((g) => g.status === col.id).sort((a, b) => a.order - b.order);
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
                              className={`bg-white rounded-xl p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
                                snapshot.isDragging ? 'shadow-lg ring-2 ring-accent/30' : ''
                              }`}
                              onClick={() => setSelectedGoal(goal)}
                            >
                              <div className="flex items-start gap-2">
                                <div
                                  {...provided.dragHandleProps}
                                  className="mt-0.5 text-gray-300 hover:text-gray-500"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">{goal.title}</p>
                                  {goal.description && (
                                    <p className="text-xs text-text-light mt-0.5 line-clamp-1">{goal.description}</p>
                                  )}
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <Flag className={`w-3 h-3 ${priorityColors[goal.priority]}`} />
                                    {goal.assignee && <span className="text-xs text-text-light">{goal.assignee}</span>}
                                    {goal.dueDate && (
                                      <span className={`text-xs flex items-center gap-0.5 ${isPast(new Date(goal.dueDate)) && goal.status !== 'DONE' ? 'text-red-500' : 'text-text-light'}`}>
                                        <Calendar className="w-3 h-3" />
                                        {format(new Date(goal.dueDate), 'MMM d')}
                                      </span>
                                    )}
                                  </div>
                                </div>
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

      {/* Goal form modal */}
      <GoalFormModal open={showGoalForm} onClose={() => setShowGoalForm(false)} sprintId={id!} />

      {/* Goal detail modal */}
      <GoalDetailModal
        goal={selectedGoal}
        open={!!selectedGoal}
        onClose={() => setSelectedGoal(null)}
        invalidateKeys={[['sprints', id!], ['sprints']]}
      />

      {/* Sprint edit modal */}
      {showSprintEdit && (
        <SprintEditModal sprint={sprint} onClose={() => setShowSprintEdit(false)} />
      )}

      {/* Confirm status change */}
      {confirmStatus && (
        <Modal open={true} onClose={() => setConfirmStatus(null)} title="Change Sprint Status">
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                {confirmStatus === 'ACTIVE'
                  ? 'Start this sprint? Goals will be tracked as active work.'
                  : 'Complete this sprint? This marks all sprint work as finished.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmStatus(null)} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => statusMutation.mutate(confirmStatus)}
                disabled={statusMutation.isPending}
                className="flex-1 bg-accent text-white rounded-xl py-2.5 text-sm font-medium hover:bg-accent-dark disabled:opacity-50"
              >
                {statusMutation.isPending ? 'Updating...' : confirmStatus === 'ACTIVE' ? 'Start Sprint' : 'Complete Sprint'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm delete sprint */}
      {confirmDelete && (
        <Modal open={true} onClose={() => setConfirmDelete(false)} title="Delete Sprint">
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-red-50 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">Delete "{sprint.name}"?</p>
                <p>All {sprint.goals.length} goals in this sprint will also be deleted. This cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => deleteSprintMutation.mutate()}
                disabled={deleteSprintMutation.isPending}
                className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-red-600 disabled:opacity-50"
              >
                {deleteSprintMutation.isPending ? 'Deleting...' : 'Delete Sprint'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function GoalFormModal({ open, onClose, sprintId }: { open: boolean; onClose: () => void; sprintId: string }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<GoalPriority>('MEDIUM');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');

  const mutation = useMutation({
    mutationFn: () => goalsApi.create(sprintId, {
      title,
      description: description || undefined,
      priority,
      assignee: assignee || undefined,
      dueDate: dueDate || undefined,
    } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', sprintId] });
      toast.success('Goal added!');
      onClose();
      setTitle(''); setDescription(''); setPriority('MEDIUM'); setAssignee(''); setDueDate('');
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
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optional details..." className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <div className="flex gap-1">
              {(['LOW', 'MEDIUM', 'HIGH'] as GoalPriority[]).map((p) => (
                <button key={p} type="button" onClick={() => setPriority(p)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${priority === p ? 'bg-accent text-white' : 'bg-gray-100 text-text-light hover:bg-gray-200'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Assignee</label>
            <input value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Anh / Em" className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Due Date</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
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

function SprintEditModal({ sprint, onClose }: { sprint: { id: string; name: string; description: string | null; startDate: string; endDate: string }; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(sprint.name);
  const [description, setDescription] = useState(sprint.description || '');
  const [startDate, setStartDate] = useState(format(new Date(sprint.startDate), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(sprint.endDate), 'yyyy-MM-dd'));

  const mutation = useMutation({
    mutationFn: () => sprintsApi.update(sprint.id, { name, description: description || undefined, startDate, endDate } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', sprint.id] });
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      toast.success('Sprint updated!');
      onClose();
    },
    onError: () => toast.error('Failed to update sprint'),
  });

  return (
    <Modal open={true} onClose={onClose} title="Edit Sprint">
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Sprint Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What's the focus of this sprint?" className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date *</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date *</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
          </div>
        </div>
        <div className="flex gap-3 pt-3 pb-2 sticky bottom-0 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 border-t border-border mt-4">
          <button type="button" onClick={onClose} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={mutation.isPending || !name} className="flex-1 bg-accent text-white rounded-xl py-2.5 text-sm font-medium hover:bg-accent-dark disabled:opacity-50">
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
