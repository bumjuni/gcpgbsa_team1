import React from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../components/Header';

interface ScreenLayoutProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  scrollable?: boolean;
}

export const ScreenLayout = ({
  title,
  showBackButton = false,
  onBack,
  children,
  footer,
  scrollable = true,
}: ScreenLayoutProps) => {
  return (
    <SafeAreaView className="flex-1 bg-surface-canvas" edges={['top', 'bottom', 'left', 'right']}>
      <Header title={title} showBackButton={showBackButton} onBack={onBack} />

      {scrollable ? (
        <ScrollView
          className="flex-1 px-md"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View className="flex-1 px-md">{children}</View>
      )}

      {footer && (
        <View className="px-md py-sm border-t border-surface-hairline bg-surface-canvas">
          {footer}
        </View>
      )}
    </SafeAreaView>
  );
};
