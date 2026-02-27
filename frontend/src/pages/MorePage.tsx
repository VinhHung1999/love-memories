import React, { useState, useEffect, useRef } from 'react';

import { Pencil, Check, X, LogOut, Settings, Camera, Bell, MapPin, Mic, Shield } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth';
import { settingsApi, profileApi } from '../lib/api';
import { uploadQueue } from '../lib/uploadQueue';
import Modal from '../components/Modal';

// ── App Permissions ──────────────────────────────────────────────────────────

type PermStatus = 'granted' | 'denied' | 'prompt';
type PermKey = 'notifications' | 'camera' | 'geolocation' | 'microphone';
type PermStates = Record<PermKey, PermStatus>;

const PERM_CONFIG: { key: PermKey; label: string; description: string; icon: React.ElementType }[] = [
  { key: 'notifications', label: 'Thông báo',  description: 'Nhận thông báo thư tình, bình luận', icon: Bell   },
  { key: 'camera',        label: 'Camera',      description: 'Chụp ảnh Photo Booth, đại diện',   icon: Camera },
  { key: 'geolocation',   label: 'Vị trí',      description: 'Bản đồ quán ăn, hẹn hò',           icon: MapPin },
  { key: 'microphone',    label: 'Microphone',  description: 'Ghi âm voice memo',                icon: Mic    },
];

async function checkAllPermissions(): Promise<PermStates> {
  const notif: PermStatus = !('Notification' in window)
    ? 'prompt'
    : Notification.permission === 'default' ? 'prompt' : (Notification.permission as PermStatus);

  const queryPerm = async (name: string): Promise<PermStatus> => {
    if (!navigator.permissions) return 'prompt';
    try {
      const r = await navigator.permissions.query({ name: name as PermissionName });
      return r.state === 'granted' ? 'granted' : r.state === 'denied' ? 'denied' : 'prompt';
    } catch {
      return 'prompt'; // iOS Safari: camera/microphone not supported
    }
  };

  const [geolocation, camera, microphone] = await Promise.all([
    queryPerm('geolocation'),
    queryPerm('camera'),
    queryPerm('microphone'),
  ]);

  return { notifications: notif, camera, geolocation, microphone };
}


export default function MorePage() {
  const { user, logout, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name ?? '');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const TOUR_KEYS = ['dashboard', 'moments', 'map', 'goals', 'recipes', 'love-letters', 'date-planner', 'photobooth', 'weekly-recap', 'foodspots', 'achievements', 'what-to-eat', 'monthly-recap', 'expenses'];
  const handleReplayTours = async () => {
    if (!user?.id) return;
    await Promise.all(TOUR_KEYS.map((k) => settingsApi.set(`tour_done__${k}__${user.id}`, '')));
    window.location.reload();
  };

  // Permissions
  const [permStates, setPermStates] = useState<PermStates>({
    notifications: 'prompt', camera: 'prompt', geolocation: 'prompt', microphone: 'prompt',
  });

  useEffect(() => {
    checkAllPermissions().then(setPermStates);
    const onVisibility = () => { if (!document.hidden) checkAllPermissions().then(setPermStates); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const requestPermission = async (key: PermKey) => {
    const status = permStates[key];
    if (status === 'granted') {
      toast('Vào Cài đặt trình duyệt để tắt quyền này', { icon: '⚙️' });
      return;
    }
    if (status === 'denied') {
      toast('Vào Cài đặt trình duyệt để bật quyền này', { icon: '⚙️' });
      return;
    }
    // status === 'prompt' — trigger browser request
    switch (key) {
      case 'notifications':
        if ('Notification' in window) await Notification.requestPermission();
        break;
      case 'camera':
        try {
          const s = await navigator.mediaDevices.getUserMedia({ video: true });
          s.getTracks().forEach((t) => t.stop());
          setPermStates((p) => ({ ...p, camera: 'granted' }));
        } catch {
          setPermStates((p) => ({ ...p, camera: 'denied' }));
        }
        break;
      case 'geolocation':
        navigator.geolocation.getCurrentPosition(() => {}, () => {});
        break;
      case 'microphone':
        try {
          const s = await navigator.mediaDevices.getUserMedia({ audio: true });
          s.getTracks().forEach((t) => t.stop());
          setPermStates((p) => ({ ...p, microphone: 'granted' }));
        } catch {
          setPermStates((p) => ({ ...p, microphone: 'denied' }));
        }
        break;
    }
    // Re-check after a short delay to pick up browser-level state changes
    setTimeout(() => { checkAllPermissions().then(setPermStates); }, 600);
  };

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
          <button
            type="button"
            onClick={handleReplayTours}
            className="w-full border border-border text-text-light rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Xem lại hướng dẫn
          </button>
        </div>
      </div>

      {/* App Permissions */}
      <div className="mt-6">
        <h2 className="font-heading text-base font-semibold text-text mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-text-light" /> Quyền ứng dụng
        </h2>
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-border">
          {PERM_CONFIG.map((cfg) => {
            const status = permStates[cfg.key];
            return (
              <button
                key={cfg.key}
                type="button"
                onClick={() => requestPermission(cfg.key)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <cfg.icon className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-text">{cfg.label}</p>
                  <p className="text-xs text-text-light">{cfg.description}</p>
                  {status === 'denied' && (
                    <p className="text-xs text-red-400 mt-0.5">Vào Cài đặt trình duyệt để bật lại</p>
                  )}
                </div>
                {/* Toggle switch */}
                <div className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                  status === 'granted' ? 'bg-green-400' : 'bg-gray-300'
                }`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    status === 'granted' ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </div>
              </button>
            );
          })}
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
