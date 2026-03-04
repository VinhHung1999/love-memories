import React from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import { useMapViewModel } from './useMapViewModel';
import type { PinTypeFilter } from './useMapViewModel';
import TagBadge from '../../components/TagBadge';

// ── Type filter chip ──────────────────────────────────────────────────────────

const TYPE_FILTERS: { key: PinTypeFilter; label: string; icon: string }[] = [
  { key: 'all', label: t.map.filterAll, icon: 'map-marker-multiple-outline' },
  { key: 'moment', label: t.map.filterMoments, icon: 'heart-multiple-outline' },
  { key: 'foodspot', label: t.map.filterFoodSpots, icon: 'food-fork-drink' },
];

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function MapScreen() {
  const colors = useAppColors();
  const vm = useMapViewModel();

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView edges={['top']} className="bg-white">
        {/* Header */}
        <View className="px-5 pt-3 pb-2">
          <Text className="text-2xl font-bold text-textDark">{t.map.title}</Text>
          <Text className="text-xs text-textLight mt-0.5">{t.map.subtitle}</Text>
        </View>

        {/* Type filter chips */}
        <View className="px-5 pb-3 flex-row gap-2">
          {TYPE_FILTERS.map(f => {
            const active = vm.typeFilter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => vm.handleTypeFilter(f.key)}
                className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                  active ? 'bg-primary border-primary' : 'bg-transparent border-border'
                }`}>
                <Icon name={f.icon} size={13} color={active ? '#fff' : colors.textMid} />
                <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-textMid'}`}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Tag filter bar */}
        {vm.allTags.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-5 pb-3">
            <View className="flex-row gap-2 pr-5">
              <TagBadge
                label={t.foodSpots.allFilter}
                active={!vm.activeTag}
                onPress={() => vm.handleTagFilter(null)}
              />
              {vm.allTags.map(tag => (
                <TagBadge
                  key={tag}
                  label={tag}
                  active={vm.activeTag === tag}
                  onPress={() => vm.handleTagFilter(tag)}
                />
              ))}
            </View>
          </ScrollView>
        ) : null}
      </SafeAreaView>

      {/* Map placeholder — replace with @rnmapbox/maps after native install */}
      <View className="flex-1 items-center justify-center bg-gray-100">
        <View className="items-center px-8">
          <Icon name="map-outline" size={56} color={colors.textLight} />
          <Text className="text-base font-semibold text-textMid mt-3 text-center">
            {t.map.setupRequired}
          </Text>
          <Text className="text-sm text-textLight mt-1 text-center leading-relaxed">
            {t.map.setupDescription}
          </Text>

          {/* Pin count summary */}
          {!vm.isLoading && vm.pins.length > 0 ? (
            <View className="mt-4 px-4 py-2.5 rounded-2xl bg-white shadow-sm flex-row items-center gap-2">
              <Icon name="map-marker-multiple" size={16} color={colors.primary} />
              <Text className="text-sm font-medium text-textMid">
                {vm.pins.length} {t.map.pinsLoaded}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
