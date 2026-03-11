import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import audioPlayer, { type PlayBackType } from 'react-native-audio-recorder-player';
import type { LettersStackParamList } from '../../navigation';
import { loveLettersApi } from '../../lib/api';

type Nav = NativeStackNavigationProp<LettersStackParamList>;
type Route = RouteProp<LettersStackParamList, 'LetterRead'>;

export function useLetterReadViewModel() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { letterId } = route.params;

  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<Record<string, number>>({});

  // Fetching the letter auto-marks it as READ on the backend
  const { data: letter, isLoading } = useQuery({
    queryKey: ['letter', letterId],
    queryFn: () => loveLettersApi.get(letterId),
    staleTime: 0, // always fresh — marks as read
  });

  const handlePlayAudio = async (audioId: string, url: string) => {
    try {
      if (playingAudioId === audioId) {
        await audioPlayer.stopPlayer();
        audioPlayer.removePlayBackListener();
        setPlayingAudioId(null);
        return;
      }
      if (playingAudioId) {
        await audioPlayer.stopPlayer();
        audioPlayer.removePlayBackListener();
      }
      setPlayingAudioId(audioId);
      await audioPlayer.startPlayer(url);
      audioPlayer.addPlayBackListener((e: PlayBackType) => {
        const progress = e.duration > 0 ? e.currentPosition / e.duration : 0;
        setAudioProgress(prev => ({ ...prev, [audioId]: progress }));
        if (e.currentPosition >= e.duration && e.duration > 0) {
          audioPlayer.removePlayBackListener();
          setAudioProgress(prev => ({ ...prev, [audioId]: 0 }));
          setPlayingAudioId(null);
        }
      });
    } catch {
      setPlayingAudioId(null);
    }
  };

  const handleStopAudio = async () => {
    if (!playingAudioId) return;
    await audioPlayer.stopPlayer().catch(() => {});
    audioPlayer.removePlayBackListener();
    setPlayingAudioId(null);
  };

  return {
    letter,
    isLoading,
    playingAudioId,
    audioProgress,
    handlePlayAudio,
    handleStopAudio,
    handleBack: () => navigation.goBack(),
  };
}
