import React, { useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const AppSplashScreen = ({ navigation }: any) => {
  useEffect(() => {
    // TODO: 임시 타이머. 실제 초기화 로직(인증 상태 확인 등) 완료 시점으로 교체 필요
    const timer = setTimeout(() => {
      navigation?.navigate('ClassList');
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigation]);

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
