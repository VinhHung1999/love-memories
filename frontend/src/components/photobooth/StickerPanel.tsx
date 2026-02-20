import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { STICKERS, type PlacedSticker } from '../../lib/photobooth/stickers';

type Category = 'love' | 'fun' | 'text';

interface Props {
  placedStickers: PlacedSticker[];
  onAdd: (stickerId: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<PlacedSticker>) => void;
}

const CATEGORY_LABELS: Record<Category, string> = {
  love: '💕 Love',
  fun: '✨ Fun',
  text: '✍️ Text',
};

export default function StickerPanel({ placedStickers, onAdd, onRemove, onUpdate }: Props) {
  const [activeTab, setActiveTab] = useState<Category>('love');

  const filtered = STICKERS.filter((s) => s.category === activeTab);

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-bold">Add Stickers</h2>

      {/* Category tabs */}
      <div className="flex gap-2">
        {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === cat
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-text-light hover:bg-primary/10 hover:text-primary'
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Sticker grid */}
      <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
        {filtered.map((sticker) => (
          <button
            key={sticker.id}
            onClick={() => onAdd(sticker.id)}
            title={sticker.label}
            className="aspect-square rounded-xl bg-gray-50 hover:bg-primary/10 active:scale-90 transition-all flex items-center justify-center text-2xl border border-border hover:border-primary/30"
          >
            {sticker.emoji.length > 2 ? (
              <span className="text-xs font-bold text-primary leading-tight text-center px-1">
                {sticker.label}
              </span>
            ) : (
              sticker.emoji
            )}
          </button>
        ))}
      </div>

      {/* Placed stickers list */}
      {placedStickers.length > 0 && (
        <div>
          <p className="text-xs font-medium text-text-light mb-2 uppercase tracking-wide">
            Placed ({placedStickers.length})
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {placedStickers.map((ps) => {
              const def = STICKERS.find((s) => s.id === ps.stickerId);
              return (
                <div key={ps.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2">
                  <span className="text-xl flex-shrink-0">{def?.emoji ?? '?'}</span>
                  <span className="text-sm font-medium flex-1 truncate">{def?.label ?? ps.stickerId}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onUpdate(ps.id, { scale: Math.max(0.3, ps.scale - 0.2) })}
                      className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-sm font-bold flex items-center justify-center hover:bg-gray-300"
                    >
                      −
                    </button>
                    <button
                      onClick={() => onUpdate(ps.id, { scale: Math.min(4, ps.scale + 0.2) })}
                      className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-sm font-bold flex items-center justify-center hover:bg-gray-300"
                    >
                      +
                    </button>
                    <button
                      onClick={() => onRemove(ps.id)}
                      className="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200 ml-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
