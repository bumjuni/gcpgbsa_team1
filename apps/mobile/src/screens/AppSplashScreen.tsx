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

    // 2초(2000ms) 지연 후 화면 전환
    const timer = setTimeout(() => {
      navigation?.reset({
        index: 0,
        routes: [{ name: isAuthenticated ? 'ClassList' : 'Login' }],
      });
    }, 2000);

    // 컴포넌트 언마운트 시 타이머 정리
    return () => clearTimeout(timer);
  }, [isHydrating, isAuthenticated, navigation]);

  return (
    <SafeAreaView className="flex-1 bg-primary items-center justify-center">
      <View className="items-center">
        <View className="w-20 h-20 rounded-2xl bg-canvas items-center justify-center mb-md">
          <Image
            source={require('../assets/growdy-mark.png')}
            style={{ width: '100%', height: '100%', borderRadius: '1rem' }}
            resizeMode="center"
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
