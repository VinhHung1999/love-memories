import { CameraView } from 'expo-camera';
import { Download, Share2, Zap } from 'lucide-react-native';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Image, KeyboardAvoidingView, PanResponder, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';
import type { BoothFrame, BoothLayout, EditTool, FilterCfg, FrameCfg } from './usePhotoboothViewModel';
import { FILTERS, FRAMES, STICKERS, usePhotoboothViewModel } from './usePhotoboothViewModel';

// T404 (Sprint 64) Photobooth — MVVM, full prototype parity.
// State machine: mode → capture/gallery → edit (T420) → share (T421)
// Prototype: docs/design/prototype/memoura-v2/photobooth.jsx

export function PhotoboothScreen() {
  const vm = usePhotoboothViewModel();

  return (
    <View className="flex-1">
      {vm.step === 'mode'    && <ModeStep vm={vm} />}
      {vm.step === 'capture' && <CaptureStep vm={vm} />}
      {vm.step === 'edit'    && <EditStep vm={vm} />}
      {vm.step === 'share'   && <ShareStep vm={vm} />}
    </View>
  );
}

// ─── Layout config ──────────────────────────────────────────────────────────

type LayoutCfg = { id: BoothLayout; name: string; cols: number; count: number };

const LAYOUTS: LayoutCfg[] = [
  { id: 'grid-4', name: 'Lưới 4', cols: 2, count: 4 },
  { id: 'col-4',  name: 'Dọc 4',  cols: 1, count: 4 },
  { id: 'single', name: 'Đơn',    cols: 1, count: 1 },
];

const STRIP_DIMS: Record<BoothLayout, { cols: number; cellW: number; cellH: number; stripW: number; stripH: number }> = {
  'grid-4': { cols: 2, cellW: 138, cellH: 166, stripW: 292, stripH: 348 },
  'col-4':  { cols: 1, cellW: 224, cellH: 140, stripW: 224, stripH: 584 },
  'single': { cols: 1, cellW: 240, cellH: 290, stripW: 240, stripH: 290 },
};

function LayoutGlyph({ cfg, active }: { cfg: LayoutCfg; active: boolean }) {
  const color = active ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)';
  return (
    <View style={{ width: 32, height: 32, flexDirection: 'row', flexWrap: 'wrap', gap: 2, alignContent: 'center', justifyContent: 'center' }}>
      {Array.from({ length: cfg.count }).map((_, i) => (
        <View key={i} style={{ width: cfg.cols === 1 ? 20 : 12, height: cfg.count <= 2 ? 12 : 6, backgroundColor: color, borderRadius: 2 }} />
      ))}
    </View>
  );
}

// ─── Shared strip component (inside ViewShot ref) ───────────────────────────

const FRAME_BG: Record<BoothFrame, string> = {
  polaroid:  '#ffffff',
  filmstrip: '#1a1a1a',
  rose:      '',       // filled dynamically from c.primarySoft
  none:      'transparent',
};

function StripComposite({
  vm,
  innerRef,
  dim,
}: {
  vm: ReturnType<typeof usePhotoboothViewModel>;
  innerRef?: React.RefObject<View | null>;
  dim: typeof STRIP_DIMS['grid-4'];
}) {
  const c = useAppColors();
  const filterCfg = FILTERS.find((f) => f.id === vm.filter) ?? FILTERS[0]!;
  const hasFrame = vm.frame !== 'none';
  const frameBg = vm.frame === 'rose' ? c.primarySoft : FRAME_BG[vm.frame];
  const pad = hasFrame ? 16 : 0;
  const bottomPad = hasFrame ? 16 : 0;

  return (
    <View
      ref={innerRef}
      style={{
        backgroundColor: frameBg,
        paddingTop: pad,
        paddingLeft: pad,
        paddingRight: pad,
        paddingBottom: bottomPad,
        borderRadius: vm.frame === 'filmstrip' ? 4 : 12,
        ...(hasFrame ? {
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowOffset: { width: 0, height: 8 },
          shadowRadius: 20,
        } : {}),
        overflow: 'hidden',
      }}
    >
      {/* Film sprocket holes */}
      {vm.frame === 'filmstrip' && (
        <>
          <FilmHoles side="left" />
          <FilmHoles side="right" />
        </>
      )}

      {/* Photo grid */}
      <View
        style={{
          width: dim.stripW,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: dim.cols === 2 ? 16 : 8,
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {Array.from({ length: vm.totalShots }).map((_, i) => (
          <View key={i} style={{ width: dim.cellW, height: dim.cellH, borderRadius: vm.frame === 'filmstrip' ? 2 : 6, overflow: 'hidden' }}>
            {vm.shots[i] ? (
              <>
                <Image source={{ uri: vm.shots[i] }} style={{ width: dim.cellW, height: dim.cellH }} resizeMode="cover" />
                {filterCfg.tint ? (
                  <View style={{ position: 'absolute', inset: 0, backgroundColor: filterCfg.tint }} />
                ) : null}
              </>
            ) : (
              <View style={{ width: dim.cellW, height: dim.cellH, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 24 }}>📷</Text>
              </View>
            )}
          </View>
        ))}

        {/* Sticker overlay — PB7: PanResponder drag, PB8: tap=select, X=remove */}
        {vm.stickers.map((s) => (
          <StickerView
            key={s.id}
            sticker={s}
            selected={vm.selectedStickerId === s.id}
            onSelect={() => vm.selectSticker(s.id)}
            onRemove={() => vm.removeSticker(s.id)}
            onMove={(x, y) => vm.moveStickerTo(s.id, x, y)}
            stripW={dim.stripW}
            stripH={dim.stripH}
          />
        ))}
      </View>

      {/* Caption strip — D19: plain View (PB9 tap-to-edit reverted) */}
      {hasFrame ? (
        <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
          <Text style={{ fontFamily: 'DancingScript_700Bold', fontSize: 16, color: vm.frame === 'filmstrip' ? '#fff' : c.primary }}>
            {vm.caption}
          </Text>
          <Text style={{ fontSize: 9, color: vm.frame === 'filmstrip' ? 'rgba(255,255,255,0.5)' : c.inkMute, fontFamily: 'Courier' }}>
            {new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

// PB7: draggable sticker. PB8: tap=select shows X delete button.
// D25: PanResponder is memoized in useRef (created ONCE at mount). Its
// closures — sticker.x/y, stripW, stripH, onMove, onSelect — are frozen
// at first render, so after the user drags a sticker to a new position
// the next drag reads the ORIGINAL position from the stale closure and
// the sticker snaps back to the pre-first-drag origin. Fix: stash the
// latest props on a ref that we write every render, and have handlers
// read from `latestRef.current` instead of the closure scope.
function StickerView({ sticker, selected, onSelect, onRemove, onMove, stripW, stripH }: {
  sticker: { id: string; emoji: string; x: number; y: number };
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onMove: (x: number, y: number) => void;
  stripW: number;
  stripH: number;
}) {
  const startPos = useRef({ x: sticker.x, y: sticker.y });
  const latestRef = useRef({ sticker, stripW, stripH, onMove, onSelect });
  latestRef.current = { sticker, stripW, stripH, onMove, onSelect };

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      const { sticker: s } = latestRef.current;
      startPos.current = { x: s.x, y: s.y };
    },
    onPanResponderMove: (_, gs) => {
      const { stripW: w, stripH: h, onMove: move } = latestRef.current;
      // Convert pixel delta → percentage of strip dimensions
      const newX = startPos.current.x + (gs.dx / w) * 100;
      const newY = startPos.current.y + (gs.dy / h) * 100;
      move(newX, newY);
    },
    onPanResponderRelease: (_, gs) => {
      const { onSelect: select } = latestRef.current;
      const dist = Math.abs(gs.dx) + Math.abs(gs.dy);
      if (dist < 4) select(); // tap without drag = select
    },
  })).current;

  return (
    <View
      {...panResponder.panHandlers}
      style={{ position: 'absolute', left: `${sticker.x}%`, top: `${sticker.y}%` }}
    >
      <Text style={{ fontSize: 28 }}>{sticker.emoji}</Text>
      {selected ? (
        <Pressable
          onPress={onRemove}
          style={{ position: 'absolute', top: -8, right: -8, width: 18, height: 18, borderRadius: 9, backgroundColor: '#ff3b30', alignItems: 'center', justifyContent: 'center' }}
          hitSlop={6}
        >
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800', lineHeight: 14 }}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function FilmHoles({ side }: { side: 'left' | 'right' }) {
  return (
    <View style={{ position: 'absolute', [side]: 4, top: 4, bottom: 4, width: 10, flexDirection: 'column', justifyContent: 'space-around' }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <View key={i} style={{ width: 10, height: 6, borderRadius: 2, backgroundColor: '#000' }} />
      ))}
    </View>
  );
}

// ─── Mode step ──────────────────────────────────────────────────────────────

function ModeStep({ vm }: { vm: ReturnType<typeof usePhotoboothViewModel> }) {
  const { t } = useTranslation();
  const c = useAppColors();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1">
      <LinearGradient colors={[c.heroA, c.heroB, c.heroC]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} className="absolute inset-0" />
      <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderBottomLeftRadius: 320, borderBottomRightRadius: 320 }} className="absolute top-0 left-0 right-0 h-72" />

      <View style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16, paddingHorizontal: 20, flex: 1 }}>
        <View className="flex-row items-center gap-3 mb-6 mt-2">
          <Pressable onPress={vm.onClose} className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} hitSlop={8}>
            <Text className="text-white text-base font-bodyMedium">✕</Text>
          </Pressable>
          <Text className="font-displayMedium text-white text-[22px]">Photo Booth</Text>
        </View>
        <Text className="font-script text-white/90 text-2xl leading-8 mb-6">{t('compose.photobooth.headline')}</Text>

        <View className="gap-3 mb-6">
          <ModeCard emoji="📷" title={t('compose.photobooth.captureNow')} sub={t('compose.photobooth.captureNowSub')} onPress={vm.onStartCamera} />
          <ModeCard emoji="🖼" title={t('compose.photobooth.fromGallery')} sub={t('compose.photobooth.fromGallerySub')} onPress={vm.onPickGallery} />
        </View>

        <Text className="font-bodySemibold text-white/75 text-[11px] uppercase tracking-widest mb-3">Bố cục</Text>
        <View className="flex-row gap-2">
          {LAYOUTS.map((l) => {
            const active = vm.layout === l.id;
            return (
              <Pressable key={l.id} onPress={() => vm.setLayout(l.id)} className="flex-1 rounded-2xl py-2.5 items-center gap-1.5 active:opacity-80"
                style={{ backgroundColor: active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.18)' }}>
                <LayoutGlyph cfg={l} active={active} />
                <Text className="font-bodyBold text-[10px] uppercase tracking-widest" style={{ color: active ? c.primary : '#fff' }}>{l.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function ModeCard({ emoji, title, sub, onPress }: { emoji: string; title: string; sub: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-4 rounded-3xl p-5 active:opacity-80" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
      <Text className="text-3xl">{emoji}</Text>
      <View className="flex-1">
        <Text className="font-bodyBold text-white text-[16px] leading-[22px]">{title}</Text>
        <Text className="font-body text-white/75 text-[12.5px] leading-[17px] mt-0.5">{sub}</Text>
      </View>
    </Pressable>
  );
}

// ─── Capture step ────────────────────────────────────────────────────────────

function CaptureStep({ vm }: { vm: ReturnType<typeof usePhotoboothViewModel> }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isCapturing = vm.countdown > 0;
  const canStart = !isCapturing && vm.shots.length < vm.totalShots;

  return (
    <View className="flex-1 bg-black">
      <CameraView ref={vm.cameraRef} className="flex-1" facing="front" />

      <Animated.View className="absolute inset-0 bg-white" style={{ opacity: vm.flashOpacity }} pointerEvents="none" />

      <View className="absolute left-0 right-0 flex-row items-center justify-between px-4" style={{ top: insets.top + 12 }}>
        <Pressable onPress={vm.onClose} className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} hitSlop={8}>
          <Text className="text-white text-base">✕</Text>
        </Pressable>
        <View className="flex-row gap-2">
          {Array.from({ length: vm.totalShots }).map((_, i) => (
            <View key={i} className="h-1 w-10 rounded-full" style={{ backgroundColor: i < vm.shots.length ? '#fff' : i === vm.shotIndex && isCapturing ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)' }} />
          ))}
        </View>
        <Text className="font-bodyBold text-white text-xs rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 10, paddingVertical: 5 }}>
          {t('compose.photobooth.shotCounter', { current: vm.shots.length + (isCapturing ? 1 : 0), total: vm.totalShots })}
        </Text>
      </View>

      {vm.countdown > 0 && (
        <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
          <Text className="font-displayBold text-white" style={{ fontSize: 120, opacity: 0.9, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 12 }}>
            {vm.countdown}
          </Text>
        </View>
      )}

      <View className="absolute left-0 right-0 items-center" style={{ bottom: insets.bottom + 24 }}>
        {canStart && (
          <Pressable onPress={vm.onStartCountdown} className="rounded-full px-10 py-4 active:opacity-80" style={{ backgroundColor: '#fff' }}>
            <Text className="font-bodyBold text-[16px]" style={{ color: '#000' }}>{t('compose.photobooth.start')}</Text>
          </Pressable>
        )}
        {isCapturing && <View className="w-16 h-16 rounded-full items-center justify-center border-4 border-white" />}
      </View>
    </View>
  );
}

// ─── Edit step (T420) ────────────────────────────────────────────────────────

function EditStep({ vm }: { vm: ReturnType<typeof usePhotoboothViewModel> }) {
  const c = useAppColors();
  const insets = useSafeAreaInsets();
  const dim = STRIP_DIMS[vm.layout];

  return (
    <View className="flex-1 bg-bg">
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8 }} className="px-5 flex-row items-center justify-between pb-3 border-b border-line-on-surface">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={vm.onRetake} className="w-9 h-9 rounded-full items-center justify-center bg-surface border border-line-on-surface" hitSlop={8}>
            <Text className="text-ink text-sm">←</Text>
          </Pressable>
          <View>
            <Text className="font-displayMedium text-ink text-[18px]">Chỉnh dải ảnh</Text>
            <Text className="font-body text-ink-mute text-[11px]">Màu · khung · nhãn dán</Text>
          </View>
        </View>
        <Pressable onPress={vm.onProceedToShare} className="rounded-full px-4 py-2 active:opacity-80" style={{ backgroundColor: c.primary }}>
          <Text className="font-bodyBold text-white text-[13px]">Tiếp →</Text>
        </Pressable>
      </View>

      {/* D17: bounces=false prevents elastic scroll from stealing PanResponder
          touch events during sticker drag (scroll absorbs the gesture before
          the sticker's PanResponder can respond). */}
      <ScrollView className="flex-1" contentContainerStyle={{ alignItems: 'center', paddingTop: 24, paddingBottom: 200 }} showsVerticalScrollIndicator={false} bounces={false}>
        <StripComposite vm={vm} dim={dim} />
      </ScrollView>

      {/* EditDock — PB6: paddingBottom = safeArea.bottom + 16
          D21: KAV on the dock itself (not EditStep root) so caption TextInput
          lifts above keyboard. Outer EditStep KAV removed — it couldn't lift
          the absolute-positioned dock reliably; wrapping the dock directly
          does. */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.line, paddingBottom: insets.bottom + 16 }}
      >
        <EditPanel vm={vm} />
        <ToolSwitcher activeTool={vm.activeTool} setActiveTool={vm.setActiveTool} />
      </KeyboardAvoidingView>

    </View>
  );
}

function EditPanel({ vm }: { vm: ReturnType<typeof usePhotoboothViewModel> }) {
  const c = useAppColors();
  return (
    <View style={{ minHeight: 100, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
      {vm.activeTool === 'filter' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {FILTERS.map((f: FilterCfg) => {
            const active = vm.filter === f.id;
            return (
              <Pressable key={f.id} onPress={() => vm.setFilter(f.id)} className="items-center gap-1" style={{ flexShrink: 0 }}>
                <View style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', borderWidth: active ? 3 : 3, borderColor: active ? c.primary : 'transparent' }}>
                  <View style={{ flex: 1, backgroundColor: f.tint ?? '#e0d0c0' }} />
                </View>
                <Text style={{ fontFamily: 'BeVietnamPro_600SemiBold', fontSize: 10, color: active ? c.primary : c.inkMute }}>{f.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
      {vm.activeTool === 'frame' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {FRAMES.map((f: FrameCfg) => {
            const active = vm.frame === f.id;
            const bg = f.id === 'filmstrip' ? '#1a1a1a' : f.id === 'none' ? 'transparent' : f.id === 'rose' ? c.primarySoft : '#fff';
            return (
              <Pressable key={f.id} onPress={() => vm.setFrame(f.id)} className="items-center gap-1.5" style={{ flexShrink: 0, padding: 8, borderRadius: 14, borderWidth: active ? 2 : 1, borderColor: active ? c.primary : c.line, minWidth: 74, backgroundColor: c.bg }}>
                <View style={{ width: 44, height: 54, backgroundColor: bg, borderRadius: 3, overflow: 'hidden', borderWidth: f.id === 'none' ? 1.5 : 0, borderStyle: f.id === 'none' ? 'dashed' : 'solid', borderColor: c.line, padding: 4 }}>
                  <View style={{ flex: 1, backgroundColor: '#c9a27a', borderRadius: 2 }} />
                </View>
                <Text style={{ fontFamily: 'BeVietnamPro_600SemiBold', fontSize: 10, color: c.ink }}>{f.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
      {vm.activeTool === 'sticker' && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {STICKERS.map((s) => (
            <Pressable key={s} onPress={() => vm.addSticker(s)} className="items-center justify-center rounded-xl active:opacity-70"
              style={{ width: 42, height: 42, backgroundColor: c.bg }}>
              <Text style={{ fontSize: 22 }}>{s}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {vm.activeTool === 'text' && (
        // D19: caption TextInput restored (PB9 Option A reverted). D14: no iOS
        // underline (underlineColorAndroid='transparent' + borderBottomWidth:0).
        // KAV in EditStep handles keyboard lift.
        <TextInput
          value={vm.caption}
          onChangeText={vm.setCaption}
          maxLength={40}
          className="rounded-xl px-4 py-3 font-body text-ink text-[14px]"
          style={{ borderWidth: 1, borderColor: c.line, backgroundColor: c.bg, borderBottomWidth: 0 }}
          underlineColorAndroid="transparent"
          placeholder="Viết chú thích…"
          placeholderTextColor={c.inkMute}
        />
      )}
    </View>
  );
}

function ToolSwitcher({ activeTool, setActiveTool }: { activeTool: EditTool; setActiveTool: (t: EditTool) => void }) {
  const c = useAppColors();
  const tools: [EditTool, string, string][] = [
    ['filter', 'Màu', '🎨'],
    ['frame', 'Viền', '▢'],
    ['sticker', 'Sticker', '✨'],
    ['text', 'Chữ', 'T'],
  ];

  return (
    <View className="flex-row border-t border-line-on-surface pt-2 px-2">
      {tools.map(([tool, label, icon]) => {
        const active = activeTool === tool;
        return (
          <Pressable key={tool} onPress={() => setActiveTool(tool)} className="flex-1 items-center gap-1 py-1">
            <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: active ? c.primarySoft : 'transparent' }}>
              <Text className="text-sm font-bodyBold" style={{ color: active ? c.primary : c.inkMute }}>{icon}</Text>
            </View>
            <Text className="text-[10px] font-bodyBold" style={{ color: active ? c.primary : c.inkMute }}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Share step (T421) ───────────────────────────────────────────────────────

function ShareStep({ vm }: { vm: ReturnType<typeof usePhotoboothViewModel> }) {
  const c = useAppColors();
  const insets = useSafeAreaInsets();
  const dim = STRIP_DIMS[vm.layout];

  return (
    <View className="flex-1 bg-bg">
      <View style={{ paddingTop: insets.top + 8 }} className="px-5 flex-row items-center gap-3 pb-4 border-b border-line-on-surface">
        <Pressable onPress={vm.onRetake} className="w-9 h-9 rounded-full items-center justify-center bg-surface border border-line-on-surface" hitSlop={8}>
          <Text className="text-ink text-sm">←</Text>
        </Pressable>
        <View>
          <Text className="font-displayMedium text-ink text-[18px]">Sẵn sàng chia sẻ</Text>
          <Text className="font-body text-ink-mute text-[11px]">Lưu về máy hoặc gửi vào Moment</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ alignItems: 'center', paddingVertical: 32 }} showsVerticalScrollIndicator={false}>
        {/* Tilted strip preview — -3deg per prototype L428 */}
        <View style={{ transform: [{ rotate: '-3deg' }] }}>
          <StripComposite vm={vm} innerRef={vm.stripRef} dim={dim} />
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View className="px-5 gap-3" style={{ paddingBottom: insets.bottom + 20 }}>
        {/* Primary: Dùng ngay — PB10: Zap lucide icon */}
        <Pressable
          onPress={vm.onUseNow}
          disabled={vm.isSaving}
          className="rounded-2xl py-4 items-center flex-row justify-center gap-2 active:opacity-80"
          style={{ backgroundColor: c.primary, opacity: vm.isSaving ? 0.6 : 1 }}
        >
          <Zap size={16} color="#fff" strokeWidth={2} />
          <Text className="font-bodyBold text-white text-[15px]">
            {vm.isSaving ? 'Đang lưu…' : 'Dùng ngay'}
          </Text>
        </Pressable>

        {/* Secondary: save + share row — PB10: Download + Share2 lucide icons */}
        <View className="flex-row gap-3">
          <Pressable onPress={vm.onSaveToLibrary} className="flex-1 rounded-2xl py-3.5 items-center flex-row justify-center gap-1.5 border border-line-on-surface active:opacity-70" style={{ backgroundColor: c.surface }}>
            <Download size={14} color={c.ink} strokeWidth={2} />
            <Text className="font-bodySemibold text-ink text-[13px]">Lưu ảnh</Text>
          </Pressable>
          <Pressable onPress={vm.onNativeShare} className="flex-1 rounded-2xl py-3.5 items-center flex-row justify-center gap-1.5 border border-line-on-surface active:opacity-70" style={{ backgroundColor: c.surface }}>
            <Share2 size={14} color={c.ink} strokeWidth={2} />
            <Text className="font-bodySemibold text-ink text-[13px]">Chia sẻ</Text>
          </Pressable>
        </View>

        {/* Reset */}
        <Pressable onPress={vm.onReset} className="py-3 items-center active:opacity-70">
          <Text className="font-bodySemibold text-ink-soft text-[13px]">↺ Làm dải mới</Text>
        </Pressable>
      </View>
    </View>
  );
}
