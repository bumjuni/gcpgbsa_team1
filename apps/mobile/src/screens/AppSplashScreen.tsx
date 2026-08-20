import React, { useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../stores/useAuthStore';

export const AppSplashScreen = ({ navigation }: any) => {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isHydrating) return;
    navigation?.reset({
      index: 0,
      routes: [{ name: isAuthenticated ? 'ClassList' : 'Login' }],
    });
  }, [isHydrating, isAuthenticated, navigation]);

  return (
    <SafeAreaView className="flex-1 bg-primary items-center justify-center">
      <View className="items-center">
        <View className="w-20 h-20 rounded-2xl bg-canvas items-center justify-center mb-md">
          <Image
            source={require('../assets/growdy-mark.png')}
            className="w-12 h-12"
            resizeMode="contain"
          />
        </View>
        <Text className="text-title-lg text-ink-on-primary mb-xxs">growdy</Text>
        <Text className="text-caption text-ink-on-primary opacity-80">
          수영강사를 위한 단 하나뿐인 버디!
        </Text>
      </View>
    </SafeAreaView>
  );
};
