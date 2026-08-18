import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export const Header = ({
  title,
  showBackButton = false,
  onBack,
  rightElement,
}: HeaderProps) => {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View className="h-14 px-md flex-row items-center justify-between bg-canvas border-b border-hairline">
      <View className="flex-row items-center">
        {showBackButton && (
          <Pressable onPress={handleBack} hitSlop={12} className="mr-xs">
            <Text className="text-title-lg font-bold text-ink">←</Text>
          </Pressable>
        )}
        <Text className="text-xl font-bold text-ink">{title}</Text>
      </View>
      {rightElement && <View>{rightElement}</View>}
    </View>
  );
};
