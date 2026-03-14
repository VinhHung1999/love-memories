import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  PermissionsAndroid,
  Platform,
  StatusBar,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { Label } from '../../components/Typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { MomentsStackParamList } from '../../navigation';
import type { MomentPhoto } from '../../types';


type Route = RouteProp<MomentsStackParamList, 'PhotoGallery'>;

// ── Zoomable image item ───────────────────────────────────────────────────────

function ZoomableImage({ photo }: { photo: MomentPhoto }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate(e => {
      scale.value = Math.max(1, Math.min(savedScale.value * e.scale, 5));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < 1.05) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const panGesture = Gesture.Pan()
    .minPointers(2)
    .onUpdate(e => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withSpring(2.5);
        savedScale.value = 2.5;
      }
    });

  const composedGesture = Gesture.Simultaneous(
    Gesture.Race(doubleTapGesture, pinchGesture),
    panGesture,
  );

  // Exception: Animated.Value transforms must stay in style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View className="w-screen h-screen" style={animatedStyle}>
        <Image
          source={{ uri: photo.url }}
          className="w-screen h-screen"
          resizeMode="contain"
        />
      </Animated.View>
    </GestureDetector>
  );
}

// ── Main Gallery Screen ───────────────────────────────────────────────────────

export default function PhotoGalleryScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { photos, initialIndex } = route.params;

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);

  const handleClose = useCallback(() => navigation.goBack(), [navigation]);

  const handleSave = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;
      }
      const currentPhoto = photos[currentIndex];
      await CameraRoll.saveAsset(currentPhoto.url, { type: 'photo' });
      Alert.alert('Saved', 'Photo saved to your library.');
    } catch {
      Alert.alert('Error', 'Could not save photo.');
    }
  }, [currentIndex, photos]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, photos.length]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems[0]?.index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const renderItem = useCallback(
    ({ item }: { item: MomentPhoto }) => <ZoomableImage photo={item} />,
    [],
  );

  const keyExtractor = useCallback((item: MomentPhoto) => item.id, []);

  return (
    <GestureHandlerRootView style={{flex: 1, backgroundColor:"#0A0404"}}>
      <StatusBar hidden />

      {/* Photos list */}
      <FlatList
        ref={flatListRef}
        data={photos}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        getItemLayout={(_data: ArrayLike<MomentPhoto> | null | undefined, index: number) => {
          const w = Dimensions.get('window').width; // logic, not style
          return { length: w, offset: w * index, index };
        }}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
      />

      {/* Top controls */}
      <SafeAreaView edges={['top']} className="absolute top-0 inset-x-0 z-10">
        <View className="flex-row items-center justify-between px-5 pt-2 pb-5">
          {/* Close */}
          <TouchableOpacity
            onPress={handleClose}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
            <X size={22} color="#fff" strokeWidth={1.5} />
          </TouchableOpacity>

          {/* Counter */}
          <View className="rounded-full px-[14px] py-[6px]" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
            <Label className="text-white/85">
              {currentIndex + 1} / {photos.length}
            </Label>
          </View>

          {/* Save to library */}
          <TouchableOpacity
            onPress={handleSave}
            style={{ backgroundColor: 'rgba(0,0,0,0.45)', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
            <Download size={20} color="#fff" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Prev / Next navigation buttons */}
      {photos.length > 1 && (
        <View
          className="absolute inset-y-0 inset-x-4 flex-row items-center justify-between z-10"
          pointerEvents="box-none">
          <TouchableOpacity
            onPress={handlePrev}
            disabled={currentIndex === 0}
            style={{
              backgroundColor: 'rgba(0,0,0,0.45)',
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: currentIndex === 0 ? 0.3 : 1,
            }}>
            <ChevronLeft size={22} color="#fff" strokeWidth={1.5} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleNext}
            disabled={currentIndex === photos.length - 1}
            style={{
              backgroundColor: 'rgba(0,0,0,0.45)',
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: currentIndex === photos.length - 1 ? 0.3 : 1,
            }}>
            <ChevronRight size={22} color="#fff" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
      )}

      {/* Dot indicators */}
      {photos.length > 1 && photos.length <= 10 ? (
        <View className="absolute bottom-[50px] inset-x-0 flex-row justify-center gap-[6px] z-10">
          {photos.map((_, idx) => (
            <View
              key={idx}
              className="h-1 rounded-sm"
              style={{ backgroundColor: idx === currentIndex ? '#fff' : 'rgba(255,255,255,0.3)', width: idx === currentIndex ? 24 : 4 }}
            />
          ))}
        </View>
      ) : null}

      {/* Thumbnail strip at bottom */}
      {photos.length > 1 ? (
        <SafeAreaView
          edges={['bottom']}
          className="absolute bottom-0 inset-x-0 z-10 px-4 pb-2 pt-2" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <FlatList
            data={photos}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id}
            ItemSeparatorComponent={() => <View className="w-2" />}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPress={() => {
                  flatListRef.current?.scrollToIndex({ index, animated: true });
                  setCurrentIndex(index);
                }}>
                <Image
                  source={{ uri: item.url }}
                  className="w-[52px] h-[52px] rounded-xl"
                  style={{ opacity: index === currentIndex ? 1 : 0.5, borderWidth: index === currentIndex ? 2 : 0, borderColor: '#fff' }}
                />
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      ) : null}
    </GestureHandlerRootView>
  );
}
