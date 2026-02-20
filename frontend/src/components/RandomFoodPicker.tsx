import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dices, MapPin, RotateCcw, ArrowRight, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { foodSpotsApi } from '../lib/api';
import type { FoodSpot } from '../types';
import Modal from './Modal';

type RandomSpot = FoodSpot & { distance: number };

type State = 'idle' | 'locating' | 'spinning' | 'result' | 'empty' | 'error';

export default function RandomFoodPicker() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>('idle');
  const [result, setResult] = useState<RandomSpot | null>(null);

  const spin = () => {
    setState('locating');
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      setState('idle');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setState('spinning');
        try {
          const spot = await foodSpotsApi.random(pos.coords.latitude, pos.coords.longitude);
          // Brief spin delay for the animation
          await new Promise((r) => setTimeout(r, 1200));
          setResult(spot);
          setState('result');
        } catch (err) {
          const msg = err instanceof Error ? err.message : '';
          if (msg.includes('No food spots')) {
            setState('empty');
          } else {
            setState('error');
          }
        }
      },
      () => {
        toast.error('Không lấy được vị trí. Vui lòng cho phép truy cập.');
        setState('idle');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleOpen = () => {
    setOpen(true);
    setState('idle');
    setResult(null);
  };

  const handleClose = () => {
    setOpen(false);
    setState('idle');
    setResult(null);
  };

  const reroll = () => {
    setResult(null);
    spin();
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-secondary to-accent text-white rounded-xl font-medium text-sm shadow-md hover:shadow-lg hover:scale-105 transition-all"
      >
        <Dices className="w-4 h-4" />
        Random Ăn Gì 🎲
      </button>

      <Modal open={open} onClose={handleClose} title="Random Ăn Gì 🎲">
        <div className="min-h-[200px] flex flex-col items-center justify-center">

          {/* Idle */}
          {state === 'idle' && (
            <div className="text-center space-y-4">
              <div className="text-5xl">🍜</div>
              <p className="text-text-light text-sm">Không biết ăn gì? Để số phận quyết định!</p>
              <button
                onClick={spin}
                className="px-6 py-3 bg-gradient-to-r from-secondary to-accent text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
              >
                Bắt đầu 🎲
              </button>
            </div>
          )}

          {/* Locating */}
          {state === 'locating' && (
            <div className="text-center space-y-3">
              <div className="text-4xl animate-bounce">📍</div>
              <p className="text-text-light text-sm">Đang lấy vị trí của bạn...</p>
            </div>
          )}

          {/* Spinning */}
          {state === 'spinning' && (
            <div className="text-center space-y-4">
              <div className="text-5xl animate-spin">🎰</div>
              <div className="flex gap-1 justify-center">
                {['🍜', '🍣', '🍕', '🍔', '🌮', '🍱'].map((e, i) => (
                  <span
                    key={i}
                    className="text-2xl animate-bounce"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    {e}
                  </span>
                ))}
              </div>
              <p className="text-text-light text-sm font-medium">Đang chọn quán cho bạn...</p>
            </div>
          )}

          {/* Result */}
          {state === 'result' && result && (
            <div className="w-full space-y-4 animate-in fade-in duration-500">
              <div className="text-center text-sm font-medium text-accent">✨ Hôm nay ăn ở đây nè!</div>

              {/* Food spot card */}
              <div className="bg-gradient-to-br from-secondary/5 to-accent/5 border border-secondary/20 rounded-2xl overflow-hidden">
                {result.photos[0] && (
                  <img src={result.photos[0].url} alt="" className="w-full h-36 object-cover" />
                )}
                <div className="p-4">
                  <h3 className="font-heading text-xl font-bold">{result.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= result.rating ? 'text-secondary fill-secondary' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-text-light">{'$'.repeat(result.priceRange)}</span>
                    <span className="text-xs text-accent font-medium ml-auto">
                      📍 {result.distance.toFixed(1)} km
                    </span>
                  </div>
                  {result.location && (
                    <p className="flex items-center gap-1 mt-2 text-xs text-text-light">
                      <MapPin className="w-3 h-3" />
                      {result.location}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={reroll}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" /> Chọn lại
                </button>
                <button
                  onClick={() => { handleClose(); navigate(`/foodspots/${result.id}`); }}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-secondary text-white rounded-xl py-2.5 text-sm font-medium hover:bg-secondary/90 transition-colors"
                >
                  Xem chi tiết <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Empty */}
          {state === 'empty' && (
            <div className="text-center space-y-4">
              <div className="text-4xl">🗺️</div>
              <p className="text-sm font-medium text-gray-700">Không có quán nào gần đây!</p>
              <p className="text-xs text-text-light">Hãy thêm quán ăn mới gần vị trí của bạn nhé.</p>
              <button onClick={handleClose} className="px-4 py-2 border border-border rounded-xl text-sm hover:bg-gray-50">
                Đóng
              </button>
            </div>
          )}

          {/* Error */}
          {state === 'error' && (
            <div className="text-center space-y-4">
              <div className="text-4xl">😅</div>
              <p className="text-sm text-red-500">Có lỗi xảy ra. Thử lại nhé!</p>
              <button
                onClick={() => setState('idle')}
                className="px-4 py-2 bg-secondary text-white rounded-xl text-sm hover:bg-secondary/90"
              >
                Thử lại
              </button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
