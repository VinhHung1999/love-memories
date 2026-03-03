import React from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../../navigation/theme';
import t from '../../../locales/en';

interface AudioRecorderProps {
  isRecording: boolean;
  recordedPath: string | null;
  recordingDuration: number;
  isPlayingPreview: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlayPreview: () => void;
  onDelete: () => void;
}

function formatSecs(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AudioRecorder({
  isRecording,
  recordedPath,
  recordingDuration,
  isPlayingPreview,
  onStartRecording,
  onStopRecording,
  onPlayPreview,
  onDelete,
}: AudioRecorderProps) {
  const colors = useAppColors();

  if (recordedPath) {
    return (
      <View
        className="flex-row items-center gap-3 p-3 rounded-2xl"
        style={{ backgroundColor: colors.accentMuted, borderWidth: 1, borderColor: `rgba(126,200,181,0.2)` }}>
        <TouchableOpacity
          onPress={onPlayPreview}
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.accent }}>
          <Icon name={isPlayingPreview ? 'pause' : 'play'} size={22} color="#fff" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-textDark">Voice memo recorded</Text>
          <Text className="text-xs text-textLight mt-0.5">{formatSecs(recordingDuration)} • m4a</Text>
        </View>
        <Pressable onPress={onDelete} hitSlop={8}>
          <Icon name="trash-can-outline" size={18} color={colors.textLight} />
        </Pressable>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={isRecording ? onStopRecording : onStartRecording}
      className="flex-row items-center gap-3 p-3 rounded-2xl"
      style={{
        backgroundColor: isRecording ? 'rgba(232,120,138,0.08)' : colors.accentMuted,
        borderWidth: 1,
        borderColor: isRecording ? `rgba(232,120,138,0.3)` : `rgba(126,200,181,0.2)`,
      }}>
      {/* Record button */}
      <View
        className="w-12 h-12 rounded-full items-center justify-center"
        style={{ backgroundColor: isRecording ? colors.primary : colors.accent }}>
        {isRecording ? (
          <View className="w-4 h-4 rounded bg-white" />
        ) : (
          <Icon name="microphone" size={22} color="#fff" />
        )}
      </View>

      {/* Label */}
      <View className="flex-1">
        <Text className="text-sm font-semibold text-textDark">
          {isRecording ? t.moments.create.recording : t.moments.create.recordMemo}
        </Text>
        <Text className="text-xs text-textLight mt-0.5">
          {isRecording
            ? `${formatSecs(recordingDuration)} · ${t.moments.create.stopRecording}`
            : t.moments.create.recordHint}
        </Text>
      </View>

      {/* Live indicator */}
      {isRecording ? (
        <View className="w-2 h-2 rounded-full bg-primary" />
      ) : null}
    </TouchableOpacity>
  );
}
