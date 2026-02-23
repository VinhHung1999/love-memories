import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Utensils, ChefHat, Sparkles, UtensilsCrossed, Pencil, Check, X, LogOut, Settings, Trophy, Camera, CalendarHeart } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth';
import { settingsApi, profileApi } from '../lib/api';
import { uploadQueue } from '../lib/uploadQueue';
import Modal from '../components/Modal';

const modules = [
  {
    to: '/what-to-eat',
    icon: UtensilsCrossed,
    label: 'What to Eat',
    description: 'Nấu ăn cùng nhau',
    color: 'bg-gradient-to-br from-secondary/10 to-accent/10 text-secondary',
  },
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
  {
    to: '/achievements',
    icon: Trophy,
    label: 'Achievements',
    description: 'Thành tích của chúng mình',
    color: 'bg-secondary/10 text-secondary',
  },
  {
    to: '/date-planner',
    icon: CalendarHeart,
    label: 'Date Planner',
    description: 'Kế hoạch hẹn hò',
    color: 'bg-primary/10 text-primary',
  },
];

export default function MorePage() {
  const { user, logout, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name ?? '');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // App customization
  const { data: appNameSetting } = useQuery({ queryKey: ['settings', 'app_name'], queryFn: () => settingsApi.get('app_name') });
  const { data: appSloganSetting } = useQuery({ queryKey: ['settings', 'app_slogan'], queryFn: () => settingsApi.get('app_slogan') });
  const { data: dateStartSetting } = useQuery({ queryKey: ['settings', 'relationship-start-date'], queryFn: () => settingsApi.get('relationship-start-date') });
  const [appNameInput, setAppNameInput] = useState('');
  const [appSloganInput, setAppSloganInput] = useState('');
  const [dateInput, setDateInput] = useState('');

  // Sync inputs when settings load (only on first load)
  useEffect(() => { if (appNameSetting?.value != null) setAppNameInput(appNameSetting.value); }, [appNameSetting?.value]);
  useEffect(() => { if (appSloganSetting?.value != null) setAppSloganInput(appSloganSetting.value); }, [appSloganSetting?.value]);
  useEffect(() => { if (dateStartSetting?.value != null) setDateInput(dateStartSetting.value); }, [dateStartSetting?.value]);

  const saveCustomMutation = useMutation({
    mutationFn: async () => {
      await settingsApi.set('app_name', appNameInput.trim() || 'Love Scrum');
      await settingsApi.set('app_slogan', appSloganInput.trim() || 'Our little world, beautifully organized');
      if (dateInput) await settingsApi.set('relationship-start-date', dateInput);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'app_name'] });
      queryClient.invalidateQueries({ queryKey: ['settings', 'app_slogan'] });
      queryClient.invalidateQueries({ queryKey: ['settings', 'relationship-start-date'] });
      toast.success('Đã lưu!');
    },
    onError: () => toast.error('Không thể lưu'),
  });

  const initials = (user?.name ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const nameMutation = useMutation({
    mutationFn: () => profileApi.updateName(nameInput.trim()),
    onSuccess: (data) => {
      updateUser({ name: data.name });
      toast.success('Đã lưu tên!');
      setEditOpen(false);
    },
    onError: () => toast.error('Không thể lưu tên'),
  });

  const handleSave = () => {
    if (!nameInput.trim()) return;
    nameMutation.mutate();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    uploadQueue.enqueue(
      `avatar-${Date.now()}`,
      'Đang tải ảnh đại diện...',
      (onProgress) => profileApi.uploadAvatar(file, onProgress),
      (result) => {
        const data = result as { id: string; email: string; name: string; avatar: string | null };
        updateUser({ avatar: data.avatar });
      },
    );
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Profile section */}
      <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <span className="font-heading text-xl font-bold text-primary">{initials}</span>
              </div>
            )}
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow hover:bg-primary/90 transition-colors"
              title="Đổi ảnh đại diện"
            >
              <Camera className="w-3 h-3" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
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

      {/* App Customization */}
      <div className="mt-6">
        <h2 className="font-heading text-base font-semibold text-text mb-3 flex items-center gap-2">
          <Settings className="w-4 h-4 text-text-light" /> Tùy chỉnh
        </h2>
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <div>
            <label className="block text-xs font-medium text-text-light mb-1">Tên app</label>
            <input
              value={appNameInput}
              onChange={(e) => setAppNameInput(e.target.value)}
              placeholder="Love Scrum"
              className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-light mb-1">Slogan</label>
            <input
              value={appSloganInput}
              onChange={(e) => setAppSloganInput(e.target.value)}
              placeholder="Our little world, beautifully organized"
              className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-light mb-1">Ngày yêu nhau</label>
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            onClick={() => saveCustomMutation.mutate()}
            disabled={saveCustomMutation.isPending}
            className="w-full bg-primary text-white rounded-xl py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saveCustomMutation.isPending ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
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
          <div className="flex gap-3">
            <button onClick={() => setEditOpen(false)} disabled={nameMutation.isPending} className="flex-1 flex items-center justify-center gap-1.5 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors">
              <X className="w-4 h-4" /> Cancel
            </button>
            <button onClick={handleSave} disabled={nameMutation.isPending || !nameInput.trim()} className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-white rounded-xl py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {nameMutation.isPending
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><Check className="w-4 h-4" /> Save</>
              }
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
