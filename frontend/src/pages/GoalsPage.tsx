import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Target, Plus, Calendar, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { sprintsApi } from '../lib/api';
import type { Sprint, SprintStatus } from '../types';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

const statusColors: Record<SprintStatus, string> = {
  PLANNING: 'bg-blue-100 text-blue-700',
  ACTIVE: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-600',
};

export default function GoalsPage() {
  const [showForm, setShowForm] = useState(false);

  const { data: sprints = [], isLoading } = useQuery({
    queryKey: ['sprints'],
    queryFn: sprintsApi.list,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold">Goals</h1>
          <p className="text-text-light text-sm mt-1">Our shared goals and sprints</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
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
      ) : sprints.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No sprints yet"
          description="Create your first sprint and start tracking goals together"
          action={{ label: 'Create Sprint', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="space-y-4">
          {sprints.map((sprint, i) => (
            <SprintCard key={sprint.id} sprint={sprint} index={i} />
          ))}
        </div>
      )}

      <SprintFormModal open={showForm} onClose={() => setShowForm(false)} />
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
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-heading font-semibold text-lg">{sprint.name}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[sprint.status]}`}>
                {sprint.status}
              </span>
            </div>
            <p className="text-text-light text-xs flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(sprint.startDate), 'MMM d')} — {format(new Date(sprint.endDate), 'MMM d, yyyy')}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-text-light" />
        </div>

        {totalCount > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-text-light">{doneCount}/{totalCount} goals done</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </Link>
    </motion.div>
  );
}

function SprintFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<SprintStatus>('PLANNING');

  const mutation = useMutation({
    mutationFn: () => sprintsApi.create({ name, startDate, endDate, status } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      toast.success('Sprint created!');
      onClose();
      setName(''); setEndDate('');
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
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as SprintStatus)}
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            <option value="PLANNING">Planning</option>
            <option value="ACTIVE">Active</option>
          </select>
        </div>
        <div className="flex gap-3 pt-3 pb-2 sticky bottom-0 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 border-t border-border mt-4">
          <button type="button" onClick={onClose} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={mutation.isPending || !name || !endDate} className="flex-1 bg-accent text-white rounded-xl py-2.5 text-sm font-medium hover:bg-accent-dark disabled:opacity-50">
            {mutation.isPending ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
