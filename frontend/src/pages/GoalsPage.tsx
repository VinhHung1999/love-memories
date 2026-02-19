import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Target, Plus, Calendar, ChevronRight, Flag, Inbox, UserCircle, ArrowRight } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { sprintsApi, goalsApi } from '../lib/api';
import type { Goal, Sprint, SprintStatus, GoalPriority } from '../types';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import GoalDetailModal from '../components/GoalDetailModal';

const statusColors: Record<SprintStatus, string> = {
  PLANNING: 'bg-blue-100 text-blue-700',
  ACTIVE: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-600',
};

const priorityColors: Record<GoalPriority, string> = {
  LOW: 'text-gray-400',
  MEDIUM: 'text-secondary',
  HIGH: 'text-red-500',
};

export default function GoalsPage() {
  const [showSprintForm, setShowSprintForm] = useState(false);
  const [showBacklogForm, setShowBacklogForm] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  const { data: sprints = [], isLoading: sprintsLoading } = useQuery({
    queryKey: ['sprints'],
    queryFn: sprintsApi.list,
  });

  const { data: backlog = [], isLoading: backlogLoading } = useQuery({
    queryKey: ['goals', 'backlog'],
    queryFn: goalsApi.backlog,
  });

  const isLoading = sprintsLoading || backlogLoading;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold">Goals</h1>
          <p className="text-text-light text-sm mt-1">Our shared goals and sprints</p>
        </div>
        <button
          onClick={() => setShowSprintForm(true)}
          className="bg-accent text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-accent-dark transition-colors"
        >
          <Plus className="w-4 h-4" /> New Sprint
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Backlog Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Inbox className="w-5 h-5 text-text-light" />
                <h2 className="font-heading text-lg font-semibold">Backlog</h2>
                {backlog.length > 0 && (
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">{backlog.length}</span>
                )}
              </div>
              <button
                onClick={() => setShowBacklogForm(true)}
                className="text-accent text-sm flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add to Backlog
              </button>
            </div>

            {backlog.length === 0 ? (
              <div className="bg-gray-50 rounded-2xl p-5 text-center">
                <p className="text-text-light text-sm">No backlog items — ideas go here before a sprint.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
                {backlog.map((goal) => (
                  <BacklogGoalRow
                    key={goal.id}
                    goal={goal}
                    sprints={sprints}
                    onTap={() => setSelectedGoal(goal)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sprints Section */}
          <div>
            <h2 className="font-heading text-lg font-semibold mb-3">Sprints</h2>
            {sprints.length === 0 ? (
              <EmptyState
                icon={Target}
                title="No sprints yet"
                description="Create your first sprint and start tracking goals together"
                action={{ label: 'Create Sprint', onClick: () => setShowSprintForm(true) }}
              />
            ) : (
              <div className="space-y-4">
                {sprints.map((sprint, i) => (
                  <SprintCard key={sprint.id} sprint={sprint} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <SprintFormModal open={showSprintForm} onClose={() => setShowSprintForm(false)} />
      <BacklogGoalFormModal open={showBacklogForm} onClose={() => setShowBacklogForm(false)} />
      <GoalDetailModal
        goal={selectedGoal}
        open={!!selectedGoal}
        onClose={() => setSelectedGoal(null)}
        invalidateKeys={[['goals', 'backlog'], ['sprints']]}
      />
    </div>
  );
}

function BacklogGoalRow({ goal, sprints, onTap }: { goal: Goal; sprints: Sprint[]; onTap: () => void }) {
  const queryClient = useQueryClient();
  const [showAssign, setShowAssign] = useState(false);

  const assignMutation = useMutation({
    mutationFn: (sprintId: string) => goalsApi.assign(goal.id, sprintId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', 'backlog'] });
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      toast.success('Goal assigned to sprint!');
      setShowAssign(false);
    },
    onError: () => toast.error('Failed to assign goal'),
  });

  const isOverdue = goal.dueDate && isPast(new Date(goal.dueDate));

  return (
    <div className="px-4 py-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        <button onClick={onTap} className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <Flag className={`w-3 h-3 flex-shrink-0 ${priorityColors[goal.priority]}`} />
            <span className="text-sm font-medium truncate">{goal.title}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 ml-5 text-xs text-text-light">
            {goal.assignee && (
              <span className="flex items-center gap-1">
                <UserCircle className="w-3 h-3" />{goal.assignee}
              </span>
            )}
            {goal.dueDate && (
              <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : ''}`}>
                <Calendar className="w-3 h-3" />
                {format(new Date(goal.dueDate), 'MMM d')}
              </span>
            )}
          </div>
        </button>

        {/* Assign to sprint */}
        <div className="relative flex-shrink-0">
          {showAssign ? (
            <div className="flex items-center gap-2">
              <select
                autoFocus
                onChange={(e) => e.target.value && assignMutation.mutate(e.target.value)}
                defaultValue=""
                className="border border-border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-accent/30"
                onBlur={() => setShowAssign(false)}
              >
                <option value="" disabled>Pick sprint...</option>
                {sprints.filter((s) => s.status !== 'COMPLETED' && s.status !== 'CANCELLED').map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <button
              onClick={() => setShowAssign(true)}
              className="text-xs text-accent flex items-center gap-1 hover:underline"
            >
              Assign <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SprintCard({ sprint, index }: { sprint: Sprint; index: number }) {
  const doneCount = sprint.goals.filter((g) => g.status === 'DONE').length;
  const totalCount = sprint.goals.length;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/goals/sprint/${sprint.id}`}
        className="block bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-heading font-semibold text-lg truncate">{sprint.name}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${statusColors[sprint.status]}`}>
                {sprint.status}
              </span>
            </div>
            <p className="text-text-light text-xs flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(sprint.startDate), 'MMM d')} — {format(new Date(sprint.endDate), 'MMM d, yyyy')}
            </p>
            {sprint.description && (
              <p className="text-text-light text-xs mt-1.5 line-clamp-1">{sprint.description}</p>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-text-light flex-shrink-0 ml-2" />
        </div>

        {totalCount > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-text-light">{doneCount}/{totalCount} goals done</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </Link>
    </motion.div>
  );
}

function BacklogGoalFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<GoalPriority>('MEDIUM');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');

  const mutation = useMutation({
    mutationFn: () => goalsApi.createBacklog({
      title,
      description: description || undefined,
      priority,
      assignee: assignee || undefined,
      dueDate: dueDate || undefined,
    } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', 'backlog'] });
      toast.success('Added to backlog!');
      onClose();
      setTitle(''); setDescription(''); setPriority('MEDIUM'); setAssignee(''); setDueDate('');
    },
    onError: () => toast.error('Failed to add goal'),
  });

  return (
    <Modal open={open} onClose={onClose} title="Add to Backlog">
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Goal Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Plan a weekend trip" className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optional details..." className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <div className="flex flex-col gap-1">
              {(['LOW', 'MEDIUM', 'HIGH'] as GoalPriority[]).map((p) => (
                <button key={p} type="button" onClick={() => setPriority(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${priority === p ? 'bg-accent text-white' : 'bg-gray-100 text-text-light hover:bg-gray-200'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Assignee</label>
              <input value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Anh / Em" className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 pt-3 pb-2 sticky bottom-0 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 border-t border-border mt-4">
          <button type="button" onClick={onClose} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={mutation.isPending || !title} className="flex-1 bg-accent text-white rounded-xl py-2.5 text-sm font-medium hover:bg-accent-dark disabled:opacity-50">
            {mutation.isPending ? 'Adding...' : 'Add to Backlog'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function SprintFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');

  const mutation = useMutation({
    mutationFn: () => sprintsApi.create({ name, description: description || undefined, startDate, endDate } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      toast.success('Sprint created!');
      onClose();
      setName(''); setDescription(''); setEndDate('');
    },
    onError: () => toast.error('Failed to create sprint'),
  });

  return (
    <Modal open={open} onClose={onClose} title="New Sprint">
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Sprint Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Sprint 1 - February" className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
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
          <button type="submit" disabled={mutation.isPending || !name || !endDate} className="flex-1 bg-accent text-white rounded-xl py-2.5 text-sm font-medium hover:bg-accent-dark disabled:opacity-50">
            {mutation.isPending ? 'Creating...' : 'Create Sprint'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
