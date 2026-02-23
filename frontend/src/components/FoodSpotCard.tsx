import { Link } from 'react-router-dom';
import { Utensils, MapPin } from 'lucide-react';

interface FoodSpotCardProps {
  foodSpot: {
    id: string;
    name: string;
    location?: string | null;
    photos: { url: string }[];
  };
}

export default function FoodSpotCard({ foodSpot }: FoodSpotCardProps) {
  return (
    <Link to={`/foodspots/${foodSpot.id}`} className="group block">
      <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-lg ring-1 ring-black/5 group-hover:shadow-xl transition-shadow duration-300">
        {foodSpot.photos[0] ? (
          <img
            src={foodSpot.photos[0].url}
            alt={foodSpot.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary/15 to-accent/15 flex items-center justify-center">
            <Utensils className="w-10 h-10 text-secondary/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
        {foodSpot.location && (
          <div className="absolute top-2.5 right-2.5">
            <span className="flex items-center gap-1 bg-black/30 backdrop-blur-sm text-white/90 text-[10px] px-2 py-0.5 rounded-full leading-4">
              <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="truncate max-w-[80px]">{foodSpot.location.split(',')[0]}</span>
            </span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-3.5">
          <p className="text-white font-semibold text-sm leading-snug line-clamp-2 drop-shadow-sm">{foodSpot.name}</p>
          <p className="text-white/65 text-xs mt-1 flex items-center gap-1">
            <Utensils className="w-3 h-3 flex-shrink-0" />
            Quán ăn
          </p>
        </div>
      </div>
    </Link>
  );
}
