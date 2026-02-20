import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Camera, Image, ArrowLeft } from 'lucide-react';
import FrameSelector from '../components/photobooth/FrameSelector';
import PhotoSelector from '../components/photobooth/PhotoSelector';
import FilterSelector from '../components/photobooth/FilterSelector';
import StickerPanel from '../components/photobooth/StickerPanel';
import CanvasPreview from '../components/photobooth/CanvasPreview';
import CameraCapture from '../components/photobooth/CameraCapture';
import ColorPicker from '../components/photobooth/ColorPicker';
import { FRAMES } from '../lib/photobooth/frames';
import { createPlacedSticker, type PlacedSticker } from '../lib/photobooth/stickers';

type AppMode = 'landing' | 'camera' | 'gallery';
type CameraStep = 0 | 1 | 2 | 3;
type GalleryStep = 0 | 1 | 2 | 3 | 4;

const STRIP_FRAMES = FRAMES.filter((f) => f.mode === 'strip');
const GALLERY_FRAMES = FRAMES.filter((f) => f.mode === 'frame');

const CAM_LABELS  = ['Layout', 'Camera', 'Customize', 'Preview'];
const CAM_EMOJIS  = ['🎞', '📸', '🎨', '⬇️'];
const GAL_LABELS  = ['Frame', 'Photos', 'Filter', 'Stickers', 'Preview'];
const GAL_EMOJIS  = ['🖼️', '📷', '🎨', '✨', '⬇️'];

export default function PhotoBoothPage() {
  const [mode, setMode] = useState<AppMode>('landing');

  // Camera mode state
  const [cameraStep, setCameraStep] = useState<CameraStep>(0);
  const [cameraFrameId, setCameraFrameId] = useState(STRIP_FRAMES[0]?.id ?? '');
  const [cameraPhotos, setCameraPhotos] = useState<string[]>([]);
  const [frameColor, setFrameColor] = useState('#FFFFFF');

  // Gallery mode state
  const [galleryStep, setGalleryStep] = useState<GalleryStep>(0);
  const [galleryFrameId, setGalleryFrameId] = useState(GALLERY_FRAMES[0]?.id ?? '');
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);

  // Shared filter + stickers
  const [filterId, setFilterId] = useState('original');
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const [prevCamStep, setPrevCamStep] = useState<CameraStep>(0);
  const [prevGalStep, setPrevGalStep] = useState<GalleryStep>(0);

  const goCamera = (next: CameraStep) => { setPrevCamStep(cameraStep); setCameraStep(next); };
  const goGallery = (next: GalleryStep) => { setPrevGalStep(galleryStep); setGalleryStep(next); };

  const camFrame = FRAMES.find((f) => f.id === cameraFrameId);
  const galFrame = FRAMES.find((f) => f.id === galleryFrameId);

  const resetCamera = () => {
    setCameraStep(0); setCameraPhotos([]); setFilterId('original'); setStickers([]);
    setFrameColor('#FFFFFF'); setMode('landing');
  };
  const resetGallery = () => {
    setGalleryStep(0); setGalleryPhotos([]); setFilterId('original'); setStickers([]);
    setMode('landing');
  };

  const addSticker = (id: string) => setStickers((p) => [...p, createPlacedSticker(id)]);
  const removeSticker = (id: string) => setStickers((p) => p.filter((s) => s.id !== id));
  const updateSticker = (id: string, patch: Partial<PlacedSticker>) =>
    setStickers((p) => p.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  // ── LANDING ────────────────────────────────────────────────────────────────

  if (mode === 'landing') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold">Photo Booth ✨</h1>
          <p className="text-text-light text-sm mt-1">Create beautiful memories together</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Camera Mode */}
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => { setMode('camera'); setCameraStep(0); }}
            className="group relative overflow-hidden rounded-3xl p-6 text-left bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[180px] flex flex-col justify-between"
          >
            <div className="text-5xl mb-3">📸</div>
            <div>
              <h2 className="font-heading text-xl font-bold mb-1">Camera Mode</h2>
              <p className="text-sm text-gray-300">Chụp trực tiếp với đếm ngược · Strip layout · Real-time filter</p>
            </div>
            <div className="absolute bottom-4 right-4 opacity-20 group-hover:opacity-30 transition-opacity">
              <Camera className="w-20 h-20" />
            </div>
          </motion.button>

          {/* Gallery Mode */}
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.08 }}
            onClick={() => { setMode('gallery'); setGalleryStep(0); }}
            className="group relative overflow-hidden rounded-3xl p-6 text-left bg-gradient-to-br from-primary/90 via-primary to-secondary text-white shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[180px] flex flex-col justify-between"
          >
            <div className="text-5xl mb-3">🖼️</div>
            <div>
              <h2 className="font-heading text-xl font-bold mb-1">Gallery Mode</h2>
              <p className="text-sm text-white/80">Chọn ảnh từ Moments · Frame · Filter · Stickers</p>
            </div>
            <div className="absolute bottom-4 right-4 opacity-20 group-hover:opacity-30 transition-opacity">
              <Image className="w-20 h-20" />
            </div>
          </motion.button>
        </div>
      </div>
    );
  }

  // ── CAMERA MODE ────────────────────────────────────────────────────────────

  if (mode === 'camera') {
    const direction = cameraStep > prevCamStep ? 1 : -1;
    const camCanNext = () => {
      if (cameraStep === 0) return !!camFrame;
      if (cameraStep === 1) return cameraPhotos.length >= (camFrame?.photoCount.min ?? 1);
      return true;
    };

    return (
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={resetCamera}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-text-light"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-heading text-2xl font-bold">Camera Mode 📸</h1>
            <p className="text-text-light text-xs mt-0.5">Chụp trực tiếp</p>
          </div>
        </div>

        {/* Step bar */}
        <StepBar labels={CAM_LABELS} emojis={CAM_EMOJIS} step={cameraStep} onGoTo={(i) => {
          if (i <= cameraStep) goCamera(i as CameraStep);
        }} />

        {/* Step content */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm mb-6 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={cameraStep}
              initial={{ x: direction * 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -direction * 40, opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              {cameraStep === 0 && (
                <FrameSelector
                  selectedId={cameraFrameId}
                  onSelect={(id) => { setCameraFrameId(id); setCameraPhotos([]); }}
                  filterMode="strip"
                />
              )}
              {cameraStep === 1 && camFrame && (
                <CameraCapture
                  photoCount={camFrame.photoCount.min}
                  filterId={filterId}
                  onFilterChange={setFilterId}
                  onComplete={(urls) => { setCameraPhotos(urls); goCamera(2); }}
                  onFallbackToGallery={() => { setMode('gallery'); setGalleryStep(0); }}
                />
              )}
              {cameraStep === 2 && (
                <div className="space-y-6">
                  <ColorPicker value={frameColor} onChange={setFrameColor} />
                  <StickerPanel
                    placedStickers={stickers}
                    onAdd={addSticker}
                    onRemove={removeSticker}
                    onUpdate={updateSticker}
                  />
                </div>
              )}
              {cameraStep === 3 && (
                <CanvasPreview
                  frameId={cameraFrameId}
                  photoUrls={cameraPhotos}
                  filterId={filterId}
                  stickers={stickers}
                  frameColor={frameColor}
                  onStickersChange={setStickers}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation — hide on camera capture step (it has its own controls) */}
        {cameraStep !== 1 && (
          <div className="flex gap-3">
            {cameraStep > 0 && (
              <button
                onClick={() => goCamera((cameraStep - 1) as CameraStep)}
                className="flex items-center gap-1.5 px-5 py-3 border border-border rounded-2xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {cameraStep < 3 && (
              <button
                onClick={() => goCamera((cameraStep + 1) as CameraStep)}
                disabled={!camCanNext()}
                className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl py-3 text-sm font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {cameraStep === 2 ? 'Preview & Download' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── GALLERY MODE ───────────────────────────────────────────────────────────

  const direction = galleryStep > prevGalStep ? 1 : -1;
  const galCanNext = () => {
    if (galleryStep === 1) return galleryPhotos.length >= (galFrame?.photoCount.min ?? 1);
    return true;
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={resetGallery}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-text-light"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-heading text-2xl font-bold">Gallery Mode 🖼️</h1>
          <p className="text-text-light text-xs mt-0.5">Chọn ảnh từ Moments</p>
        </div>
      </div>

      {/* Step bar */}
      <StepBar labels={GAL_LABELS} emojis={GAL_EMOJIS} step={galleryStep} onGoTo={(i) => {
        if (i <= galleryStep || (i === 1 && galleryPhotos.length > 0)) goGallery(i as GalleryStep);
      }} />

      {/* Step content */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm mb-6 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={galleryStep}
            initial={{ x: direction * 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -direction * 40, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            {galleryStep === 0 && (
              <FrameSelector
                selectedId={galleryFrameId}
                onSelect={(id) => { setGalleryFrameId(id); setGalleryPhotos([]); }}
                filterMode="frame"
              />
            )}
            {galleryStep === 1 && galFrame && (
              <PhotoSelector frame={galFrame} selectedUrls={galleryPhotos} onSelect={setGalleryPhotos} />
            )}
            {galleryStep === 2 && (
              <FilterSelector
                selectedId={filterId}
                previewUrl={galleryPhotos[0] ?? null}
                onSelect={setFilterId}
              />
            )}
            {galleryStep === 3 && (
              <StickerPanel
                placedStickers={stickers}
                onAdd={addSticker}
                onRemove={removeSticker}
                onUpdate={updateSticker}
              />
            )}
            {galleryStep === 4 && (
              <CanvasPreview
                frameId={galleryFrameId}
                photoUrls={galleryPhotos}
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
        {galleryStep > 0 && (
          <button
            onClick={() => goGallery((galleryStep - 1) as GalleryStep)}
            className="flex items-center gap-1.5 px-5 py-3 border border-border rounded-2xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        )}
        {galleryStep < 4 && (
          <button
            onClick={() => goGallery((galleryStep + 1) as GalleryStep)}
            disabled={!galCanNext()}
            className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl py-3 text-sm font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {galleryStep === 3 ? 'Preview & Download' : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {galleryStep === 1 && galleryPhotos.length < (galFrame?.photoCount.min ?? 1) && (
        <p className="text-center text-xs text-text-light mt-3">
          Select at least {galFrame?.photoCount.min ?? 1} photo{(galFrame?.photoCount.min ?? 1) > 1 ? 's' : ''} to continue
        </p>
      )}
    </div>
  );
}

// ── Step progress bar ──────────────────────────────────────────────────────────

function StepBar({
  labels, emojis, step, onGoTo,
}: {
  labels: string[];
  emojis: string[];
  step: number;
  onGoTo: (i: number) => void;
}) {
  return (
    <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
      {labels.map((label, i) => (
        <div key={i} className="flex items-center flex-shrink-0">
          <button
            onClick={() => onGoTo(i)}
            className={`flex flex-col items-center gap-1 px-2 transition-all ${
              i === step ? 'opacity-100' : i < step ? 'opacity-70 hover:opacity-100 cursor-pointer' : 'opacity-30 cursor-default'
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
              {emojis[i]}
            </div>
            <span className={`text-xs font-medium ${i === step ? 'text-primary' : i < step ? 'text-text-light' : 'text-gray-300'}`}>
              {label}
            </span>
          </button>
          {i < labels.length - 1 && (
            <div className={`w-6 h-0.5 mx-1 rounded ${i < step ? 'bg-primary/40' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}
