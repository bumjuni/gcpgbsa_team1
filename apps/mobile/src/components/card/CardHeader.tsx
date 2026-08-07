import { Text, View } from "react-native";
import { CardHeaderProps } from "./Card.types";
import { CARD_TITLE_STYLES } from "./Card.variants";

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  variant = 'default',
  icon,
  rightElement,
  className = '',
}) => {
  const isDefault = variant === 'default';

  return (
    <View
      className={`flex-row items-center justify-between ${
        isDefault ? 'bg-canvas-muted px-4 py-3.5 border-b border-hairline' : ''
      } ${className}`}
    >
      <View className="flex-row items-center flex-1 mr-2">
        {icon && <View className="mr-2">{icon}</View>}
        <Text className={CARD_TITLE_STYLES[variant]}>{title}</Text>
      </View>
      {rightElement && <View>{rightElement}</View>}
    </View>
  );
};
