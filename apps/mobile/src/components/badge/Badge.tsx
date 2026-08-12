import { Text, TouchableOpacity, View } from "react-native";
import { BADGE_CONTAINER_STYLES, BADGE_TEXT_STYLES } from "./Badge.variants";

export type BadgeVariant = 'default' | 'primary' | 'danger' | 'muted';

interface BadgeProps {
  variant?: BadgeVariant;
  onPress?: () => void;
  text: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  onPress,
  text,
  className = '',
}) => {
  const isClickable = Boolean(onPress);
  const Container = isClickable ? TouchableOpacity : View;

  return (
    <Container
      onPress={onPress}
      activeOpacity={isClickable ? 0.8 : 1}
      className={`${BADGE_CONTAINER_STYLES[variant]} ${className} px-sm py-xs rounded-sm`}
    >
      <Text className={`${BADGE_TEXT_STYLES[variant]} text-legal`}>
        {text}
      </Text>
    </Container>
  );
};
