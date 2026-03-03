import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import { useMomentDetailViewModel } from './useMomentDetailViewModel';
import ReactionsBar from './components/ReactionsBar';
import VoiceMemoSection from './components/VoiceMemoSection';
import CommentsSection from './components/CommentsSection';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 300;

// ── Section badge ──────────────────────────────────────────────────────────────

function SectionDivider() {
  return <View className="h-px bg-border/30 my-3" />;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function MomentDetailScreen() {
  const colors = useAppColors();
  const vm = useMomentDetailViewModel();
  const { moment } = vm;

  if (vm.isLoading || !moment) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const coverPhoto = moment.photos[0];

  return (
    <KeyboardAvoidingView className="flex-1 bg-white" behavior="padding">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Hero photo */}
        <View style={{ height: HERO_HEIGHT, width: SCREEN_WIDTH }}>
          {coverPhoto ? (
            <Image
              source={{ uri: coverPhoto.url }}
              style={{ width: SCREEN_WIDTH, height: HERO_HEIGHT, resizeMode: 'cover' }}
            />
          ) : (
            <LinearGradient
              colors={[colors.primaryLight, colors.primary, '#D4607A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: SCREEN_WIDTH, height: HERO_HEIGHT }}
            />
          )}
          {/* Gradient overlay */}
          <LinearGradient
            colors={['rgba(0,0,0,0.2)', 'transparent', 'rgba(0,0,0,0.35)']}
            locations={[0, 0.4, 1]}
            style={{ position: 'absolute', inset: 0 } as object}
          />

          {/* Back + Actions */}
          <SafeAreaView
            edges={['top']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
            <View className="flex-row items-center justify-between px-4 pt-2">
              <TouchableOpacity
                onPress={vm.handleBack}
                className="w-9 h-9 rounded-xl items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <Icon name="arrow-left" size={20} color="#fff" />
              </TouchableOpacity>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={vm.handleEdit}
                  className="w-9 h-9 rounded-xl items-center justify-center"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <Icon name="pencil-outline" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={vm.handleDeleteMoment}
                  disabled={vm.isDeleting}
                  className="w-9 h-9 rounded-xl items-center justify-center"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <Icon name="trash-can-outline" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>

          {/* Photo count */}
          {moment.photos.length > 1 ? (
            <View
              className="absolute bottom-3 right-4 px-2 py-1 rounded-xl"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
              <Text className="text-[11px] font-semibold text-white">
                1 / {moment.photos.length}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Thumbnail strip */}
        {moment.photos.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="bg-white"
            contentContainerStyle={{ gap: 8, padding: 12 }}>
            {moment.photos.map((photo, idx) => (
              <Pressable
                key={photo.id}
                onPress={() => vm.handleOpenGallery(moment.photos, idx)}>
                <Image
                  source={{ uri: photo.url }}
                  className="rounded-xl"
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 12,
                    borderWidth: idx === 0 ? 2 : 0,
                    borderColor: colors.primary,
                  }}
                />
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View className="h-3" />
        )}

        {/* Content */}
        <View className="px-5">
          {/* Date + Spotify */}
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-xs text-textMid">📅 {formatDate(moment.date)}</Text>
            {moment.spotifyUrl ? (
              <TouchableOpacity
                onPress={() => Linking.openURL(moment.spotifyUrl!).catch(() => {})}
                className="flex-row items-center gap-1 px-3 py-1.5 rounded-xl"
                style={{ backgroundColor: 'rgba(29,185,84,0.1)' }}>
                <Icon name="spotify" size={14} color="#1DB954" />
                <Text className="text-[11px] font-semibold" style={{ color: '#1DB954' }}>
                  {t.moments.detail.spotifyLink}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Title */}
          <Text className="text-2xl font-bold text-textDark leading-tight tracking-tight mb-2">
            {moment.title}
          </Text>

          {/* Caption */}
          {moment.caption ? (
            <Text className="text-sm text-textMid italic leading-relaxed mb-2">
              "{moment.caption}"
            </Text>
          ) : null}

          {/* Location */}
          {moment.location ? (
            <View className="flex-row items-center gap-1.5 mb-3">
              <Icon name="map-marker-outline" size={13} color={colors.textLight} />
              <Text className="text-xs text-textMid flex-1">{moment.location}</Text>
              {moment.latitude && moment.longitude ? (
                <Pressable
                  onPress={() =>
                    Linking.openURL(
                      `https://maps.google.com/?q=${moment.latitude},${moment.longitude}`,
                    ).catch(() => {})
                  }>
                  <Text className="text-xs font-semibold text-accent">
                    {t.moments.detail.mapsLink}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {/* Tags */}
          {moment.tags.length > 0 ? (
            <View className="flex-row flex-wrap gap-2 mb-3">
              {moment.tags.map(tag => (
                <View
                  key={tag}
                  className="px-3 py-1 rounded-lg"
                  style={{ backgroundColor: colors.primaryMuted }}>
                  <Text className="text-[11px] font-medium text-primary">{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <SectionDivider />

          {/* View gallery button */}
          {moment.photos.length > 0 ? (
            <TouchableOpacity
              onPress={() => vm.handleOpenGallery(moment.photos, 0)}
              className="flex-row items-center gap-2 py-2 mb-2">
              <Icon name="image-multiple-outline" size={16} color={colors.primary} />
              <Text className="text-sm font-semibold text-primary">
                {t.moments.detail.viewGallery} ({moment.photos.length})
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* Voice Memos */}
          <VoiceMemoSection
            audios={moment.audios}
            playingAudioId={vm.playingAudioId}
            audioProgress={vm.audioProgress}
            onPlay={vm.handlePlayAudio}
            onStop={vm.handleStopAudio}
          />

          {moment.audios.length > 0 ? <SectionDivider /> : null}

          {/* Reactions */}
          <ReactionsBar
            presetEmojis={vm.presetEmojis}
            reactionCounts={vm.reactionCounts}
            hasReacted={vm.hasReacted}
            onToggle={vm.handleToggleReaction}
          />

          <SectionDivider />

          {/* Comments */}
          <CommentsSection
            comments={moment.comments}
            commentText={vm.commentText}
            currentUserName={vm.user?.name}
            isSubmitting={vm.isCommentSubmitting}
            onChangeText={vm.setCommentText}
            onSubmit={vm.handleAddComment}
            onDelete={vm.handleDeleteComment}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
