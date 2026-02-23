import { useState } from 'react';
import { CalendarHeart } from 'lucide-react';

const TABS = [
  { id: 'wishes', label: 'Muốn đi' },
  { id: 'plans', label: 'Kế hoạch' },
] as const;

type Tab = typeof TABS[number]['id'];

export default function DatePlannerPage() {
  const [activeTab, setActiveTab] = useState<Tab>('wishes');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold">Date Planner</h1>
          <p className="text-text-light text-sm mt-1">Kế hoạch hẹn hò của chúng mình</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-text shadow-sm'
                : 'text-text-light hover:text-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Placeholder content */}
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <CalendarHeart className="w-16 h-16 text-primary/30 mb-4" />
        <p className="font-heading text-lg font-semibold text-text-light">Sắp ra mắt...</p>
        <p className="text-text-light text-sm mt-1">
          {activeTab === 'wishes'
            ? 'Danh sách ước mơ hẹn hò đang được xây dựng'
            : 'Tính năng lập kế hoạch đang được xây dựng'}
        </p>
      </div>
    </div>
  );
}
