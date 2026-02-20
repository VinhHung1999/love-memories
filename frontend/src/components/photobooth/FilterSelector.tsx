import { FILTERS } from '../../lib/photobooth/filters';

interface Props {
  selectedId: string;
  previewUrl: string | null;
  onSelect: (id: string) => void;
}

export default function FilterSelector({ selectedId, previewUrl, onSelect }: Props) {
  return (
    <div>
      <h2 className="font-heading text-xl font-bold mb-4">Choose a Filter</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onSelect(filter.id)}
            className={`flex-shrink-0 flex flex-col items-center gap-1.5 snap-start transition-all ${
              filter.id === selectedId ? 'scale-105' : 'opacity-80 hover:opacity-100'
            }`}
          >
            <div
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-3 transition-all ${
                filter.id === selectedId
                  ? 'border-primary ring-2 ring-primary/30 shadow-md'
                  : 'border-transparent'
              }`}
              style={{ borderWidth: 3 }}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={filter.label}
                  className="w-full h-full object-cover"
                  style={{ filter: filter.css }}
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-xs text-gray-400"
                  style={{ background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)' }}
                >
                  Preview
                </div>
              )}
            </div>
            <span
              className={`text-xs font-medium ${
                filter.id === selectedId ? 'text-primary' : 'text-text-light'
              }`}
            >
              {filter.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
