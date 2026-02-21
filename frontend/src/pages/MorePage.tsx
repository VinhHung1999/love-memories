import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Utensils, ChefHat, Sparkles, Pencil, Check, X, User, LogOut } from 'lucide-react';
import { useAuth } from '../lib/auth';
import Modal from '../components/Modal';

const modules = [
  {
    to: '/foodspots',
    icon: Utensils,
    label: 'Food Spots',
    description: 'Quán ăn yêu thích',
    color: 'bg-secondary/10 text-secondary',
  },
  {
    to: '/recipes',
    icon: ChefHat,
    label: 'Recipes',
    description: 'Công thức nấu ăn',
    color: 'bg-accent/10 text-accent',
  },
  {
    to: '/photobooth',
    icon: Sparkles,
    label: 'Photo Booth',
    description: 'Chụp ảnh kỷ niệm',
    color: 'bg-primary/10 text-primary',
  },
];

export default function MorePage() {
  const { user, logout } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name ?? '');

  const initials = (user?.name ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSave = () => {
    // placeholder — name edit API to be wired when profile endpoint added
    setEditOpen(false);
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Profile section */}
      <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-4">
          {/* Avatar placeholder */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
            <span className="font-heading text-xl font-bold text-primary">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base truncate">{user?.name}</p>
            <p className="text-text-light text-sm truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => { setNameInput(user?.name ?? ''); setEditOpen(true); }}
            className="flex-shrink-0 flex items-center gap-1.5 text-xs text-primary border border-primary/30 px-3 py-1.5 rounded-xl hover:bg-primary/5 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        </div>
      </div>

      {/* Modules grid */}
      <h2 className="font-heading text-base font-semibold text-text mb-3">Modules</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {modules.map(({ to, icon: Icon, label, description, color }) => (
          <Link key={to} to={to} className="block bg-white rounded-2xl p-5 shadow-sm border border-transparent transition-all hover:shadow-md hover:border-black/5 active:scale-95">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="font-semibold text-sm text-text">{label}</p>
            <p className="text-text-light text-xs mt-0.5">{description}</p>
          </Link>
        ))}
      </div>

      {/* Log Out */}
      <div className="mt-6 pt-4 border-t border-border">
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-red-400 hover:text-red-500 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>

      {/* Edit name modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Name</label>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Your name"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditOpen(false); }}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-text-light bg-gray-50 rounded-xl p-3">
            <User className="w-3.5 h-3.5 flex-shrink-0" />
            Avatar upload sẽ có trong Sprint 14
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEditOpen(false)} className="flex-1 flex items-center justify-center gap-1.5 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors">
              <X className="w-4 h-4" /> Cancel
            </button>
            <button onClick={handleSave} className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-white rounded-xl py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors">
              <Check className="w-4 h-4" /> Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
