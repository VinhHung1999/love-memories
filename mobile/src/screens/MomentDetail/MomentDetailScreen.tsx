import React, { useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import FastImage from 'react-native-fast-image';
import {
  ChevronRight,
  ExternalLink,
  Heart,
  Images,
  MapPin,
  Music2,
} from 'lucide-react-native';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import { useMomentDetailViewModel } from './useMomentDetailViewModel';
import Skeleton from '../../components/Skeleton';
import { Card, CardTitle } from '../../components/Card';
import TagBadge from '../../components/TagBadge';
import ReactionsBar from './components/ReactionsBar';
import VoiceMemoSection from './components/VoiceMemoSection';
import CommentsSection from './components/CommentsSection';
import CreateMomentSheet from '../CreateMoment/CreateMomentSheet';
import DetailScreenLayout from '../../components/DetailScreenLayout';

// ── Spotify rich card ──────────────────────────────────────────────────────────

interface SpotifyOEmbed {
  title: string;
  author_name?: string;
  thumbnail_url?: string;
}

function SpotifyTrackCard({ spotifyUrl }: { spotifyUrl: string }) {
  const colors = useAppColors();

  const { data: meta, isLoading } = useQuery<SpotifyOEmbed>({
    queryKey: ['spotify-oembed', spotifyUrl],
    queryFn: async () => {
      const url = `https://open.spotify.com/oembed?url=${encodeURIComponent(
        spotifyUrl,
      )}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('oEmbed failed');
      return res.json();
    },
    staleTime: Infinity,
    retry: false,
  });

  // Auto-open Spotify when detail screen loads
  useEffect(() => {
    // Linking.openURL(spotifyUrl).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Pressable
      onPress={() => Linking.openURL(spotifyUrl).catch(() => {})}
      className="flex-row items-center gap-3 rounded-2xl overflow-hidden"
      style={{
        backgroundColor: 'rgba(29,185,84,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(29,185,84,0.2)',
      }}
    >
      {/* Album art */}
      {meta?.thumbnail_url ? (
        <FastImage
          source={{ uri: meta.thumbnail_url }}
          style={{ width: 56, height: 56, borderRadius: 10 }}
          resizeMode={FastImage.resizeMode.cover}
        />
      ) : (
        <View
          className="w-14 h-14 rounded-xl items-center justify-center"
          style={{ backgroundColor: 'rgba(29,185,84,0.15)' }}
        >
          <Music2 size={24} strokeWidth={1.5} />
        </View>
      )}

      {/* Track info */}
      <View className="flex-1">
        {isLoading ? (
          <Text className="text-xs text-textLight">Loading track info...</Text>
        ) : meta ? (
          <>
            <Text className="text-sm font-bold text-textDark" numberOfLines={1}>
              {meta.title}
            </Text>
            {meta.author_name ? (
              <Text className="text-xs text-textMid mt-0.5" numberOfLines={1}>
                {meta.author_name}
              </Text>
            ) : null}
          </>
        ) : (
          <Text className="text-sm font-semibold text-textDark">
            {t.moments.detail.spotifyLink}
          </Text>
        )}
        <View className="flex-row items-center gap-1 mt-1">
          <Music2 size={10} strokeWidth={1.5} />
          <Text
            className="text-[10px] font-semibold"
            style={{ color: '#1DB954' }}
          >
            Open in Spotify
          </Text>
        </View>
      </View>

      <ExternalLink
        size={14}
        color={colors.textLight}
        strokeWidth={1.5}
        style={{ marginRight: 12 }}
      />
    </Pressable>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────────────────

function MomentDetailLoadingSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Hero */}
      <Skeleton className="w-full h-[280px]" />
      <View className="h-4" />
      {/* Title card */}
      <View className="bg-white mx-4 rounded-3xl px-4 py-4 mb-3">
        <Skeleton className="w-28 h-3 rounded-md mb-3" />
        <Skeleton className="w-3/4 h-5 rounded-md mb-2" />
        <Skeleton className="w-full h-3 rounded-md mb-1" />
        <Skeleton className="w-2/3 h-3 rounded-md mb-3" />
        <View className="flex-row gap-1.5">
          <Skeleton className="w-12 h-5 rounded-full" />
          <Skeleton className="w-16 h-5 rounded-full" />
        </View>
      </View>
      {/* Reactions card */}
      <View className="bg-white mx-4 rounded-3xl px-4 py-4 mb-3">
        <Skeleton className="w-20 h-3 rounded-md mb-3" />
        <View className="flex-row gap-2">
          {[0, 1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="w-9 h-9 rounded-full" />
          ))}
        </View>
      </View>
      {/* Comments card */}
      <View className="bg-white mx-4 rounded-3xl px-4 py-4">
        <Skeleton className="w-24 h-3 rounded-md mb-3" />
        <Skeleton className="w-full h-3 rounded-md mb-1.5" />
        <Skeleton className="w-4/5 h-3 rounded-md" />
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

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
  const navigation = useAppNavigation();
  const vm = useMomentDetailViewModel();
  const { moment } = vm;

  if (vm.isLoading || !moment) {
    return <MomentDetailLoadingSkeleton />;
  }

  const coverPhoto = moment.photos[0];

  return (
    <KeyboardAvoidingView className="flex-1" behavior="padding">
      <DetailScreenLayout
        title={moment.title}
        coverImageUri={coverPhoto?.url}
        onBack={vm.handleBack}
        onEdit={() => navigation.showBottomSheet(CreateMomentSheet, { moment })}
        onDelete={vm.handleDeleteMoment}
        icon={Heart}
      >
        {/* ── Photo thumbnail strip ── */}
        {moment.photos.length > 1 ? (
          <View className="bg-white mx-4 mt-5 rounded-3xl px-3 py-3 mb-3">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {moment.photos.map((photo, idx) => (
                  <Pressable
                    key={photo.id}
                    onPress={() => vm.handleOpenGallery(moment.photos, idx)}
                  >
                    <FastImage
                      source={{
                        uri: photo.url,
                        priority: FastImage.priority.high,
                      }}
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 12,
                        borderWidth: idx === 0 ? 2 : 0,
                        borderColor: colors.primary,
                        opacity: idx === 0 ? 1 : 0.75,
                      }}
                      resizeMode={FastImage.resizeMode.cover}
                    />
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        ) : (
          <View className="h-4" />
        )}

        {/* ── Title card ── */}
        <Card>
          {/* Date row */}
          <View className="flex-row items-center mb-2">
            <Text className="text-xs text-textMid">
              📅 {formatDate(moment.date)}
            </Text>
          </View>

          <Text className="text-xl font-bold text-textDark leading-tight tracking-tight mb-2">
            {moment.title}
          </Text>

          {moment.caption ? (
            <Text className="text-sm text-textMid italic leading-relaxed mb-2">
              "{moment.caption}"
            </Text>
          ) : null}

          {/* Location */}
          {moment.location ? (
            <View className="flex-row items-center gap-1.5 pt-1 border-t border-border/30">
              <MapPin size={13} color={colors.textLight} strokeWidth={1.5} />
              <Text className="text-xs text-textMid flex-1">
                {moment.location}
              </Text>
              {moment.latitude && moment.longitude ? (
                <Pressable
                  onPress={() =>
                    Linking.openURL(
                      `https://maps.google.com/?q=${moment.latitude},${moment.longitude}`,
                    ).catch(() => {})
                  }
                >
                  <Text className="text-xs font-semibold text-accent">
                    {t.moments.detail.mapsLink}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {/* Tags */}
          {moment.tags.length > 0 ? (
            <View className="flex-row flex-wrap gap-1.5 pt-2">
              {moment.tags.map(tag => (
                <TagBadge key={tag} label={tag} variant="display" />
              ))}
            </View>
          ) : null}
        </Card>

        {/* ── Spotify track card ── */}
        {moment.spotifyUrl ? (
          <Card>
            <CardTitle>{t.moments.detail.spotifyLink}</CardTitle>
            <View className="py-2">
              <SpotifyTrackCard spotifyUrl={moment.spotifyUrl} />
            </View>
          </Card>
        ) : null}

        {/* ── Photos gallery link ── */}
        {moment.photos.length > 0 ? (
          <Card>
            <TouchableOpacity
              onPress={() => vm.handleOpenGallery(moment.photos, 0)}
              className="flex-row items-center gap-2 py-1"
            >
              <Images size={16} color={colors.primary} strokeWidth={1.5} />
              <Text className="text-sm font-semibold text-primary flex-1">
                {t.moments.detail.viewGallery} ({moment.photos.length})
              </Text>
              <ChevronRight
                size={16}
                color={colors.textLight}
                strokeWidth={1.5}
              />
            </TouchableOpacity>
          </Card>
        ) : null}

        {/* ── Voice memos ── */}
        {moment.audios.length > 0 ? (
          <Card>
            <CardTitle>{t.moments.detail.voiceMemo}</CardTitle>
            <VoiceMemoSection
              audios={moment.audios}
              playingAudioId={vm.playingAudioId}
              audioProgress={vm.audioProgress}
              onPlay={vm.handlePlayAudio}
              onStop={vm.handleStopAudio}
            />
          </Card>
        ) : null}

        {/* ── Reactions ── */}
        <Card>
          <CardTitle>{t.moments.detail.reactions}</CardTitle>
          <ReactionsBar
            presetEmojis={vm.presetEmojis}
            reactionCounts={vm.reactionCounts}
            hasReacted={vm.hasReacted}
            onToggle={vm.handleToggleReaction}
          />
        </Card>

        {/* ── Comments ── */}
        <Card>
          <CardTitle>{t.moments.detail.comments}</CardTitle>
          <CommentsSection
            comments={moment.comments}
            commentText={vm.commentText}
            currentUserName={vm.user?.name}
            isSubmitting={vm.isCommentSubmitting}
            onChangeText={vm.setCommentText}
            onSubmit={vm.handleAddComment}
            onDelete={vm.handleDeleteComment}
          />
        </Card>

        {/* Bottom spacer */}
        <View className="h-20" />
      </DetailScreenLayout>
    </KeyboardAvoidingView>
  );
}
