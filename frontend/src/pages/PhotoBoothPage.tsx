import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import FrameSelector from '../components/photobooth/FrameSelector';
import PhotoSelector from '../components/photobooth/PhotoSelector';
import FilterSelector from '../components/photobooth/FilterSelector';
import StickerPanel from '../components/photobooth/StickerPanel';
import CanvasPreview from '../components/photobooth/CanvasPreview';
import { FRAMES } from '../lib/photobooth/frames';
import { createPlacedSticker, type PlacedSticker } from '../lib/photobooth/stickers';

type Step = 0 | 1 | 2 | 3 | 4;

const STEP_LABELS = ['Frame', 'Photos', 'Filter', 'Stickers', 'Preview'];
const STEP_EMOJIS = ['🖼️', '📷', '🎨', '✨', '⬇️'];

export default function PhotoBoothPage() {
  const [step, setStep] = useState<Step>(0);
  const [frameId, setFrameId] = useState(FRAMES[0]!.id);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [filterId, setFilterId] = useState('original');
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const [prevStep, setPrevStep] = useState<Step>(0);

  const frame = FRAMES.find((f) => f.id === frameId)!;

  const goTo = (next: Step) => {
    setPrevStep(step);
    setStep(next);
  };

  const canNext = (): boolean => {
    if (step === 1) return photoUrls.length >= frame.photoCount.min;
    return true;
  };

  const handleFrameChange = (id: string) => {
    setFrameId(id);
    // Reset photos when frame changes (different photo count requirements)
    setPhotoUrls([]);
  };

  const addSticker = (stickerId: string) => {
    setStickers((prev) => [...prev, createPlacedSticker(stickerId)]);
  };

  const removeSticker = (id: string) => {
    setStickers((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSticker = (id: string, patch: Partial<PlacedSticker>) => {
    setStickers((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const direction = step > prevStep ? 1 : -1;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold">Photo Booth ✨</h1>
        <p className="text-text-light text-sm mt-1">Create beautiful memories together</p>
      </div>

      {/* Step progress bar */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center flex-shrink-0">
            <button
              onClick={() => {
                // Allow going back to any completed step
                if (i <= step || (i === 1 && photoUrls.length > 0)) goTo(i as Step);
              }}
              className={`flex flex-col items-center gap-1 px-2 transition-all ${
                i === step
                  ? 'opacity-100'
                  : i < step
                  ? 'opacity-70 hover:opacity-100 cursor-pointer'
                  : 'opacity-30 cursor-default'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-base font-bold border-2 transition-all ${
                  i === step
                    ? 'bg-primary text-white border-primary shadow-md'
                    : i < step
                    ? 'bg-primary/20 text-primary border-primary/30'
                    : 'bg-gray-100 text-gray-400 border-gray-200'
                }`}
              >
                {STEP_EMOJIS[i]}
              </div>
              <span
                className={`text-xs font-medium ${
                  i === step ? 'text-primary' : i < step ? 'text-text-light' : 'text-gray-300'
                }`}
              >
                {label}
              </span>
            </button>
            {i < STEP_LABELS.length - 1 && (
              <div className={`w-6 h-0.5 mx-1 rounded ${i < step ? 'bg-primary/40' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm mb-6 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ x: direction * 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -direction * 40, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
          >
            {step === 0 && (
              <FrameSelector selectedId={frameId} onSelect={handleFrameChange} />
            )}
            {step === 1 && (
              <PhotoSelector frame={frame} selectedUrls={photoUrls} onSelect={setPhotoUrls} />
            )}
            {step === 2 && (
              <FilterSelector
                selectedId={filterId}
                previewUrl={photoUrls[0] ?? null}
                onSelect={setFilterId}
              />
            )}
            {step === 3 && (
              <StickerPanel
                placedStickers={stickers}
                onAdd={addSticker}
                onRemove={removeSticker}
                onUpdate={updateSticker}
              />
            )}
            {step === 4 && (
              <CanvasPreview
                frameId={frameId}
                photoUrls={photoUrls}
                filterId={filterId}
                stickers={stickers}
                onStickersChange={setStickers}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <button
            onClick={() => goTo((step - 1) as Step)}
            className="flex items-center gap-1.5 px-5 py-3 border border-border rounded-2xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        )}
        {step < 4 && (
          <button
            onClick={() => goTo((step + 1) as Step)}
            disabled={!canNext()}
            className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl py-3 text-sm font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {step === 3 ? 'Preview & Download' : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Step hint */}
      {step === 1 && photoUrls.length < frame.photoCount.min && (
        <p className="text-center text-xs text-text-light mt-3">
          Select at least {frame.photoCount.min} photo{frame.photoCount.min > 1 ? 's' : ''} to continue
        </p>
      )}
    </div>
  );
}
