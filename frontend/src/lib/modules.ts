import { UtensilsCrossed, Utensils, ChefHat, Sparkles, Trophy, CalendarHeart, Mail, CalendarDays, Wallet, MessageCircleHeart } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface AppModule {
  to: string;
  icon: LucideIcon;
  label: string;
  description: string;
  color: string;
}

export const modules: AppModule[] = [
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
  {
    to: '/love-letters',
    icon: Mail,
    label: 'Love Letters',
    description: 'Thư tình bất ngờ',
    color: 'bg-primary/10 text-primary',
  },
  {
    to: '/monthly-recap',
    icon: CalendarDays,
    label: 'Monthly Recap',
    description: 'Tổng kết tháng',
    color: 'bg-orange-500/10 text-orange-500',
  },
  {
    to: '/expenses',
    icon: Wallet,
    label: 'Budget',
    description: 'Theo dõi chi tiêu',
    color: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    to: '/daily-questions',
    icon: MessageCircleHeart,
    label: 'Daily Q&A',
    description: 'Câu hỏi mỗi ngày',
    color: 'bg-pink-500/10 text-pink-500',
  },
];
