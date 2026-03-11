import React from 'react';
import { ScrollView, View } from 'react-native';
import Skeleton from '../../../components/Skeleton';

export function DashboardSkeleton() {
  return (
    <ScrollView scrollEnabled={false} className="flex-1">
      <View className="pt-[220px] pb-[100px] px-4 gap-5">
        <Skeleton className="h-10 rounded-full self-center w-56" />
        <View className="flex-row gap-3">
          <Skeleton className="flex-1 h-[76px] rounded-3xl" />
          <Skeleton className="flex-1 h-[76px] rounded-3xl" />
        </View>
        <View>
          <Skeleton className="w-28 h-4 rounded-md mb-3" />
          <View className="flex-row gap-3">
            <Skeleton className="flex-1 h-[80px] rounded-3xl" />
            <Skeleton className="flex-1 h-[80px] rounded-3xl" />
            <Skeleton className="flex-1 h-[80px] rounded-3xl" />
            <Skeleton className="flex-1 h-[80px] rounded-3xl" />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
