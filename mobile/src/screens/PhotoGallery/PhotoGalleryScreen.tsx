import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
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
    <GestureHandlerRootView className="flex-1 bg-[#0A0404]">
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
            className="w-10 h-10 rounded-full items-center justify-center bg-white/12">
            <Icon name="close" size={22} color="#fff" />
          </TouchableOpacity>

          {/* Counter */}
          <View className="bg-white/12 rounded-full px-[14px] py-[6px]">
            <Text className="text-white/85 text-sm font-medium">
              {currentIndex + 1} / {photos.length}
            </Text>
          </View>

          {/* Share placeholder */}
          <View className="w-10" />
        </View>
      </SafeAreaView>

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
          className="absolute bottom-0 inset-x-0 z-10 px-4 pb-2 pt-2 bg-[rgba(10,4,4,0.7)]">
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
