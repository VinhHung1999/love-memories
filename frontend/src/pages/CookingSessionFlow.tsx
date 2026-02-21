import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChefHat, ArrowLeft } from 'lucide-react';
import { cookingSessionsApi } from '../lib/api';
import type { CookingSession } from '../types';

// Phase components will be implemented in Tasks 3, 4, 5
// This file acts as the phase router — each task fills in its phase

export default function CookingSessionFlow() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: session, isLoading, isError } = useQuery({
    queryKey: ['cooking-session', id],
    queryFn: () => cookingSessionsApi.get(id!),
    // Poll every 3s during active phases to sync between devices
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && status !== 'completed' ? 3000 : false;
    },
    enabled: !!id,
  });

  const invalidateActive = () => {
    queryClient.invalidateQueries({ queryKey: ['cooking-sessions', 'active'] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !session) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <ChefHat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-text-light">Không tìm thấy phiên nấu ăn này.</p>
        <button
          onClick={() => navigate('/what-to-eat')}
          className="mt-4 text-primary text-sm font-medium hover:underline"
        >
          Về trang chọn món
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Phase router — expand each case in Tasks 3, 4, 5 */}
      {session.status === 'selecting' && (
        <SelectingPhase session={session} onAdvance={invalidateActive} />
      )}
      {session.status === 'shopping' && (
        <ShoppingPhasePlaceholder session={session} />
      )}
      {session.status === 'cooking' && (
        <CookingPhasePlaceholder session={session} />
      )}
      {session.status === 'photo' && (
        <PhotoPhasePlaceholder session={session} />
      )}
      {session.status === 'completed' && (
        <CompletedPhasePlaceholder session={session} />
      )}
    </div>
  );
}

// ─── Selecting phase: review selection + "Go Shopping" ───────────────────────

function SelectingPhase({
  session,
  onAdvance,
}: {
  session: CookingSession;
  onAdvance: () => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [advancing, setAdvancing] = useState(false);

  const handleAdvance = async () => {
    setAdvancing(true);
    try {
      await cookingSessionsApi.updateStatus(session.id, 'shopping');
      queryClient.invalidateQueries({ queryKey: ['cooking-session', session.id] });
      onAdvance();
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <button
        onClick={() => navigate('/what-to-eat')}
        className="flex items-center gap-1.5 text-sm text-text-light hover:text-text mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Chọn lại món
      </button>

      <h1 className="font-heading text-2xl font-bold mb-1">Danh sách hôm nay</h1>
      <p className="text-text-light text-sm mb-6">
        {session.recipes.length} món • {session.items.length} nguyên liệu cần mua
      </p>

      <div className="space-y-3 mb-6">
        {session.recipes.map(({ recipe, order }) => (
          <div key={recipe.id} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
              {recipe.photos?.[0] ? (
                <img src={recipe.photos[0].url} alt={recipe.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-gray-300" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{recipe.title}</p>
              <p className="text-xs text-text-light">
                {recipe.ingredients.length} nguyên liệu • {recipe.steps.length} bước
              </p>
            </div>
            <span className="text-xs text-text-light flex-shrink-0">#{order + 1}</span>
          </div>
        ))}
      </div>

      <button
        onClick={handleAdvance}
        disabled={advancing}
        className="w-full flex items-center justify-center gap-2 bg-secondary text-white py-3.5 rounded-2xl font-semibold text-base shadow-lg shadow-secondary/25 hover:bg-secondary/90 active:scale-95 transition-all disabled:opacity-60"
      >
        {advancing ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>🛒 Bắt đầu đi chợ!</>
        )}
      </button>
    </div>
  );
}

// ─── Phase stubs — will be replaced in Tasks 3, 4, 5 ────────────────────────

function ShoppingPhasePlaceholder({ session }: { session: CookingSession }) {
  return <PhasePlaceholder label="Đi chợ" emoji="🛒" items={session.items.length} note="Task 3 sẽ implement giao diện này." />;
}

function CookingPhasePlaceholder({ session }: { session: CookingSession }) {
  return <PhasePlaceholder label="Nấu ăn" emoji="🍳" items={session.steps.length} note="Task 4 sẽ implement giao diện này." />;
}

function PhotoPhasePlaceholder({ session: _session }: { session: CookingSession }) {
  return <PhasePlaceholder label="Chụp ảnh" emoji="📸" items={0} note="Task 5 sẽ implement giao diện này." />;
}

function CompletedPhasePlaceholder({ session: _session }: { session: CookingSession }) {
  return <PhasePlaceholder label="Hoàn thành" emoji="🎉" items={0} note="Task 5 sẽ implement giao diện này." />;
}

function PhasePlaceholder({
  label,
  emoji,
  items,
  note,
}: {
  label: string;
  emoji: string;
  items: number;
  note: string;
}) {
  const navigate = useNavigate();
  return (
    <div className="max-w-lg mx-auto text-center py-12">
      <div className="text-5xl mb-4">{emoji}</div>
      <h2 className="font-heading text-2xl font-bold mb-2">{label}</h2>
      {items > 0 && <p className="text-text-light text-sm mb-1">{items} mục</p>}
      <p className="text-text-light text-xs mb-6">{note}</p>
      <button
        onClick={() => navigate('/what-to-eat')}
        className="text-primary text-sm font-medium hover:underline"
      >
        ← Về trang chọn món
      </button>
    </div>
  );
}
