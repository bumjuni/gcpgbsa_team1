import { Text, TouchableOpacity, View } from "react-native";
import { CardItemProps } from "./Card.types";

export const CardItem: React.FC<CardItemProps> = ({
  title,
  description,
  leftElement,
  rightElement,
  onPress,
  isLast = false,
}) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      onPress={onPress}
      activeOpacity={0.7}
      className={`flex-row items-center justify-between py-3.5 px-4 bg-canvas ${
        !isLast ? 'border-b border-hairline' : ''
      }`}
    >
      <View className="flex-row items-center flex-1 mr-3">
        {leftElement && <View className="mr-3">{leftElement}</View>}
        <View className="flex-1">
          <Text className="text-body-strong text-ink">{title}</Text>
          {description && (
            <Text className="text-caption text-ink-secondary mt-0.5">{description}</Text>
          )}
        </View>
      </View>
      {rightElement}
    </Container>
  );
};
