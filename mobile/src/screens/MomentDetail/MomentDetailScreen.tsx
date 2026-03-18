import React, { useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Heading, Body, Caption } from '../../components/Typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import FastImage from 'react-native-fast-image';
import {
  ExternalLink,
  Heart,
  MapPin,
  Music2,

} from 'lucide-react-native';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { useAppColors } from '../../navigation/theme';
import { useTranslation } from 'react-i18next';
import { useMomentDetailViewModel } from './useMomentDetailViewModel';
import Skeleton from '../../components/Skeleton';
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
  const { t } = useTranslation();
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
          <Body size="sm" className="text-textLight dark:text-darkTextLight">Loading track info...</Body>
        ) : meta ? (
          <>
            <Body size="md" className="font-bold text-textDark dark:text-darkTextDark" numberOfLines={1}>
              {meta.title}
            </Body>
            {meta.author_name ? (
              <Body size="sm" className="text-textMid dark:text-darkTextMid mt-0.5" numberOfLines={1}>
                {meta.author_name}
              </Body>
            ) : null}
          </>
        ) : (
          <Body size="md" className="font-semibold text-textDark dark:text-darkTextDark">
            {t('moments.detail.spotifyLink')}
          </Body>
        )}
        <View className="flex-row items-center gap-1 mt-1">
          <Music2 size={10} strokeWidth={1.5} />
          <Caption
            className="font-semibold"
            style={{ color: '#1DB954' }}
          >
            Open in Spotify
          </Caption>
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
      <View className="mx-4 mt-5 mb-3">
        <Skeleton className="w-28 h-3 rounded-md mb-3" />
        <Skeleton className="w-3/4 h-5 rounded-md mb-2" />
        <Skeleton className="w-full h-3 rounded-md mb-1" />
        <Skeleton className="w-2/3 h-3 rounded-md mb-3" />
        <View className="flex-row gap-1.5">
          <Skeleton className="w-12 h-5 rounded-full" />
          <Skeleton className="w-16 h-5 rounded-full" />
        </View>
      </View>
      <View className="h-[1px] bg-border/30 mx-4 my-2" />
      <View className="mx-4 py-3">
        <View className="flex-row gap-2">
          {[0, 1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="w-9 h-9 rounded-full" />
          ))}
        </View>
      </View>
      <View className="h-[1px] bg-border/30 mx-4 my-2" />
      <View className="mx-4 py-3">
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
  const { t } = useTranslation();
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
        onHeroPress={moment.photos.length > 0
          ? () => vm.handleOpenGallery(moment.photos, 0)
          : undefined}
        icon={Heart}
      >

        {/* ── Thumbnail strip (2+ photos) ── */}
        {moment.photos.length >= 2 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mx-4 mt-4"
            contentContainerStyle={{ gap: 8 }}>
            {moment.photos.map((photo, idx) => (
              <Pressable
                key={photo.id}
                onPress={() => vm.handleOpenGallery(moment.photos, idx)}>
                <FastImage
                  source={{ uri: photo.url, priority: FastImage.priority.high }}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    borderWidth: idx === 0 ? 2 : 0,
                    borderColor: colors.primary,
                  }}
                  resizeMode={FastImage.resizeMode.cover}
                />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        {/* ── Content section ── */}
        <View className="mx-4 mt-3 mb-2">

          {/* Meta: date */}
          <Caption className="text-textLight dark:text-darkTextLight mb-2">
            📅 {formatDate(moment.date)}
          </Caption>

          {/* Location */}
          {moment.location ? (
            <View className="flex-row items-center gap-1.5 mb-3">
              <MapPin size={11} color={colors.textLight} strokeWidth={1.5} />
              <Caption className="text-textLight dark:text-darkTextLight flex-1" numberOfLines={1}>
                {moment.location}
              </Caption>
              {moment.latitude && moment.longitude ? (
                <Pressable
                  onPress={() =>
                    Linking.openURL(
                      `https://maps.google.com/?q=${moment.latitude},${moment.longitude}`,
                    ).catch(() => {})
                  }
                >
                  <Caption className="font-semibold text-accent">
                    {t('moments.detail.mapsLink')}
                  </Caption>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {/* Title */}
          <Heading size="lg" className="leading-tight tracking-tight mb-2 text-textDark dark:text-darkTextDark">
            {moment.title}
          </Heading>

          {/* Caption */}
          {moment.caption ? (
            <Body size="md" className="text-textMid dark:text-darkTextMid italic leading-relaxed mb-3">
              "{moment.caption}"
            </Body>
          ) : null}

          {/* Tags */}
          {moment.tags.length > 0 ? (
            <View className="flex-row flex-wrap gap-1.5 mb-3">
              {moment.tags.map(tag => (
                <TagBadge key={tag} label={tag} variant="display" />
              ))}
            </View>
          ) : null}

          {/* Spotify */}
          {moment.spotifyUrl ? (
            <View className="mb-3">
              <SpotifyTrackCard spotifyUrl={moment.spotifyUrl} />
            </View>
          ) : null}

          {/* Voice memo */}
          {moment.audios.length > 0 ? (
            <VoiceMemoSection
              audios={moment.audios}
              playingAudioId={vm.playingAudioId}
              audioProgress={vm.audioProgress}
              onPlay={vm.handlePlayAudio}
              onStop={vm.handleStopAudio}
            />
          ) : null}

        </View>

        {/* ── Divider ── */}
        <View className="h-[1px] bg-border/30 mx-4 mb-1" />

        {/* ── Reactions — inline, no CardTitle ── */}
        <View className="mx-4 py-3">
          <ReactionsBar
            presetEmojis={vm.presetEmojis}
            reactionCounts={vm.reactionCounts}
            hasReacted={vm.hasReacted}
            onToggle={vm.handleToggleReaction}
          />
        </View>

        {/* ── Divider ── */}
        <View className="h-[1px] bg-border/30 mx-4 mb-1" />

        {/* ── Comments — inline, no CardTitle ── */}
        <View className="mx-4 py-3">
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


        {/* Bottom spacer */}
        <View className="h-20" />
      </DetailScreenLayout>
    </KeyboardAvoidingView>
  );
}
