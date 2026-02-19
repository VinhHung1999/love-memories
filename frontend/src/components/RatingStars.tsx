import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  onChange?: (rating: number) => void;
  size?: number;
}

export default function RatingStars({ rating, onChange, size = 20 }: RatingStarsProps) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          disabled={!onChange}
          className={`${onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
        >
          <Star
            size={size}
            className={
              star <= rating
                ? 'text-secondary fill-secondary'
                : 'text-gray-300'
            }
          />
        </button>
      ))}
    </div>
  );
}
