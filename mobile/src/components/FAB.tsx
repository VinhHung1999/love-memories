import { useAppColors } from '@/navigation/theme';
import { Pressable, ViewStyle } from 'react-native';

type LucideIcon = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

type FABProps = {
  icon: LucideIcon;
  onPress: () => void;
  style?: ViewStyle;
};

export const FAB = ({ icon: Icon, onPress, style }: FABProps) => {
  const colors = useAppColors();
  return (
    <Pressable
      onPress={onPress}
      className="absolute bottom-6 right-5 w-14 h-14 rounded-full items-center justify-center"
      style={[{ backgroundColor: colors.primary + "1A" }, style]}
    >
      <Icon size={22} color={colors.primary}/>
    </Pressable>
  );
};
