interface Props {
  value: string;
  onChange: (color: string) => void;
}

const PRESETS = [
  { label: 'White',     color: '#FFFFFF' },
  { label: 'Black',     color: '#1A1A1A' },
  { label: 'Pink',      color: '#E8788A' },
  { label: 'Orange',    color: '#F4A261' },
  { label: 'Mint',      color: '#7EC8B5' },
  { label: 'Lavender',  color: '#C3B1E1' },
  { label: 'Gold',      color: '#F4C430' },
  { label: 'Baby Blue', color: '#89CFF0' },
  { label: 'Coral',     color: '#FF6B6B' },
  { label: 'Cream',     color: '#FFF8E7' },
];

export default function ColorPicker({ value, onChange }: Props) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-text-light mb-3">Frame Color</h3>
      <div className="flex flex-wrap gap-2 items-center">
        {PRESETS.map(({ label, color }) => (
          <button
            key={color}
            title={label}
            onClick={() => onChange(color)}
            className={`w-8 h-8 rounded-full border-2 transition-all shadow-sm hover:scale-110 ${
              value === color
                ? 'border-primary scale-110 shadow-md'
                : 'border-transparent hover:border-gray-300'
            }`}
            style={{
              backgroundColor: color,
              outline: color === '#FFFFFF' || color === '#FFF8E7' ? '1px solid #e5e7eb' : undefined,
            }}
          />
        ))}
        {/* Custom color swatch */}
        <label
          className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-primary transition-all relative overflow-hidden"
          title="Custom color"
        >
          <span className="text-xs text-gray-400 select-none">+</span>
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>
      </div>
    </div>
  );
}
