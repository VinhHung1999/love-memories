import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import HeaderIcon from './HeaderIcon';
import { Body, Heading } from './Typography';

interface ListHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  filterBar?: React.ReactNode;
}

export default function ListHeader({ title, subtitle, onBack, right, filterBar }: ListHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0E6E3',
        shadowColor: '#E8788A',
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 4,
        elevation: 2,
      }}>
      {/* Title row */}
      <View style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center px-4 gap-3" style={{ height: 56 }}>
          <HeaderIcon icon={ArrowLeft} onPress={onBack} />
          <View className="flex-1">
            <Heading size="md" className="text-textDark dark:text-darkTextDark" numberOfLines={1}>
              {title}
            </Heading>
            {subtitle ? (
              <Body size="sm" className="text-textMid dark:text-darkTextMid font-medium" numberOfLines={1}>
                {subtitle}
              </Body>
            ) : null}
          </View>
          {right ? <View>{right}</View> : null}
        </View>
      </View>

      {/* Filter bar */}
      {filterBar ?? null}
    </View>
  );
}
