// Sprint 67 T459 — Demo route for the Stories shell with hardcoded
// mock slides covering all 9 kinds. T460 wires real BE-derived slides
// at the production routes; this file is removed during T460/sprint
// cleanup. Boss can reach it via the Profile preview row to stress-test
// progress bars / tap zones / hold pause / swipe close / Ken Burns /
// count-up before the production composer ships.

import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Alert } from 'react-native';

import { RecapStoriesScreen } from '@/screens/Recap/Stories';
import type { Slide } from '@/screens/Recap/Stories';

export default function StoriesDemo() {
  const router = useRouter();

  const slides: Slide[] = useMemo(
    () => [
      {
        kind: 'cover',
        bgPhotoUrl: 'https://picsum.photos/seed/dalat-rain/800/1400',
        kicker: 'RECAP · TUẦN 17, 2026',
        titleLine1: 'Tuần này',
        titleLine2: 'của mình',
        coupleNamesScript: 'Hùng & Như',
        people: [
          { initial: 'H', gradientKey: 'A' },
          { initial: 'N', gradientKey: 'B' },
        ],
        scrollHint: 'chạm để xem tiếp',
      },
      {
        kind: 'stat',
        bgPhotoUrl: 'https://picsum.photos/seed/sg-coffee-walk/800/1400',
        value: 3,
        label: 'KHOẢNH KHẮC',
        tone: 'primary',
        sub: 'Một tuần đủ chậm để nhớ',
      },
      {
        kind: 'stat',
        value: 6,
        label: 'ẢNH ĐÃ LƯU',
        tone: 'secondary',
      },
      {
        kind: 'topMoment',
        momentId: 'demo-id',
        bgPhotoUrl: 'https://picsum.photos/seed/dalat-window/800/1400',
        rank: 1,
        title: 'Chiều Đà Lạt ngồi chờ mưa',
        sub: 'Đà Lạt · 3 ảnh · 0 tim',
        palette: 'sunset',
        ctaLabel: 'Xem chi tiết',
      },
      {
        kind: 'places',
        headline: 'Mình đã đến 2 nơi',
        caption: 'Sài Gòn + Đà Lạt',
        thumbnails: [
          { name: 'Sài Gòn', photoUrl: 'https://picsum.photos/seed/sg-laugh/600/600' },
          { name: 'Đà Lạt', photoUrl: 'https://picsum.photos/seed/dalat-cafe/600/600' },
        ],
      },
      {
        kind: 'firsts',
        firstId: 'demo-first',
        bgPhotoUrl: 'https://picsum.photos/seed/dalat-cafe/800/1400',
        sticker: '🎉',
        kicker: 'Lần đầu của mình',
        title: 'Chiều Đà Lạt ngồi chờ mưa',
      },
      {
        kind: 'topQuestion',
        text: '“Hôm nay điều gì khiến em cười?”',
        meta: 'Mình đã hỏi nhau 4 lần trong tháng',
        initialA: 'H',
        initialB: 'N',
      },
      {
        kind: 'closing',
        title: 'Cảm ơn Như\nvì tuần này.',
        body: 'Một tuần nhỏ thôi, nhưng đủ ấm. Mong tuần sau mình có thêm vài chiều nữa để cùng nhau.',
        signature: 'Hùng & Như · 21-27 thg 4',
        initialA: 'H',
        initialB: 'N',
      },
      {
        kind: 'actionsTray',
        saveLabel: 'Lưu thành video 30 giây',
        shareLabel: 'Chia sẻ với Như',
        detailLabel: 'Xem chi tiết',
        onSave: () => Alert.alert('Sắp có ✨', 'Video 30 giây đang được Memoura chăm chút.'),
        onShare: () => Alert.alert('Đã sao chép link', 'Gửi cho người ấy nhé.'),
        onDetail: () => router.replace('/(modal)/recap/weekly'),
      },
    ],
    [router],
  );

  const onClose = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/profile');
  };

  return <RecapStoriesScreen slides={slides} onClose={onClose} />;
}
