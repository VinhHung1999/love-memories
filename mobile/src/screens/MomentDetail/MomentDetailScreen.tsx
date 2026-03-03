import React, { useRef } from 'react';
import {
  ActivityIndicator,
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
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import { useMomentDetailViewModel } from './useMomentDetailViewModel';
import { Card, CardTitle } from '../../components/Card';
import TagBadge from '../../components/TagBadge';
import AlertModal from '../../components/AlertModal';
import ReactionsBar from './components/ReactionsBar';
import VoiceMemoSection from './components/VoiceMemoSection';
import CommentsSection from './components/CommentsSection';
import CreateMomentSheet from '../CreateMoment/CreateMomentSheet';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function MomentDetailScreen() {
  const colors = useAppColors();
  const vm = useMomentDetailViewModel();
  const { moment } = vm;
  const editSheetRef = useRef<BottomSheetModal>(null);

  if (vm.isLoading || !moment) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const coverPhoto = moment.photos[0];

  return (
    <KeyboardAvoidingView className="flex-1 bg-gray-50" behavior="padding">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}>
        <View className="pb-[60px]">

          {/* ── Hero photo ── */}
          <View className="h-[280px] w-screen">
            {coverPhoto ? (
              <Image
                source={{ uri: coverPhoto.url }}
                className="w-screen h-[280px]"
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={['#FFE4EA', colors.primary, '#D4607A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="w-screen h-[280px]"
              />
            )}
            <LinearGradient
              colors={['rgba(0,0,0,0.22)', 'transparent', 'rgba(0,0,0,0.3)']}
              locations={[0, 0.4, 1]}
              className="absolute inset-0"
            />

            {/* Back + Actions */}
            <SafeAreaView
              edges={['top']}
              className="absolute top-0 left-0 right-0">
              <View className="flex-row items-center justify-between px-4 pt-2">
                <TouchableOpacity
                  onPress={vm.handleBack}
                  className="w-9 h-9 rounded-xl items-center justify-center bg-white/20">
                  <Icon name="arrow-left" size={20} color="#fff" />
                </TouchableOpacity>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => editSheetRef.current?.present()}
                    className="w-9 h-9 rounded-xl items-center justify-center bg-white/20">
                    <Icon name="pencil-outline" size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={vm.handleDeleteMoment}
                    disabled={vm.isDeleting}
                    className="w-9 h-9 rounded-xl items-center justify-center bg-white/20">
                    <Icon name="trash-can-outline" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </SafeAreaView>

            {/* Photo count */}
            {moment.photos.length > 1 ? (
              <View className="absolute bottom-3 right-4 px-2 py-1 rounded-xl bg-black/40">
                <Text className="text-[11px] font-semibold text-white">
                  1 / {moment.photos.length}
                </Text>
              </View>
            ) : null}
          </View>

          {/* ── Photo thumbnail strip ── */}
          {moment.photos.length > 1 ? (
            <View className="bg-white mx-4 -mt-5 rounded-3xl shadow-sm px-3 py-3 mb-3">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {moment.photos.map((photo, idx) => (
                    <Pressable
                      key={photo.id}
                      onPress={() => vm.handleOpenGallery(moment.photos, idx)}>
                      <Image
                        source={{ uri: photo.url }}
                        className={`w-[52px] h-[52px] rounded-xl ${
                          idx === 0
                            ? 'border-2 border-primary opacity-100'
                            : 'opacity-75'
                        }`}
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
            {/* Date + Spotify row */}
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs text-textMid">📅 {formatDate(moment.date)}</Text>
              {moment.spotifyUrl ? (
                <TouchableOpacity
                  onPress={() => Linking.openURL(moment.spotifyUrl!).catch(() => {})}
                  className="flex-row items-center gap-1 px-3 py-1.5 rounded-xl bg-[rgba(29,185,84,0.1)]">
                  <Icon name="spotify" size={14} color="#1DB954" />
                  <Text className="text-[11px] font-semibold text-[#1DB954]">
                    {t.moments.detail.spotifyLink}
                  </Text>
                </TouchableOpacity>
              ) : null}
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
              <View className="flex-row flex-wrap gap-1.5 pt-2">
                {moment.tags.map(tag => (
                  <TagBadge key={tag} label={tag} variant="display" />
                ))}
              </View>
            ) : null}
          </Card>

          {/* ── Photos gallery link ── */}
          {moment.photos.length > 0 ? (
            <Card>
              <TouchableOpacity
                onPress={() => vm.handleOpenGallery(moment.photos, 0)}
                className="flex-row items-center gap-2 py-1">
                <Icon name="image-multiple-outline" size={16} color={colors.primary} />
                <Text className="text-sm font-semibold text-primary flex-1">
                  {t.moments.detail.viewGallery} ({moment.photos.length})
                </Text>
                <Icon name="chevron-right" size={16} color={colors.textLight} />
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

        </View>
      </ScrollView>

      {/* ── Edit sheet ── */}
      <CreateMomentSheet
        ref={editSheetRef}
        momentId={moment.id}
      />

      {/* ── Alert ── */}
      <AlertModal {...vm.alert} onDismiss={vm.dismissAlert} />

    </KeyboardAvoidingView>
  );
}
