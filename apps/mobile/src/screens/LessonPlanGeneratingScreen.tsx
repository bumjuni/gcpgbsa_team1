import React, { useEffect } from 'react';
import { View, Text } from 'react-native';

export const LessonPlanGeneratingScreen = ({ navigation }: any) => {
  // 개선 필요
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation?.navigate('LessonPlanConfirm');
    }, 2000); // TODO: 임시 타이머. 실제 수업안 생성 API 연동 시 응답 완료 시점으로 교체 필요
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View className="flex-1 justify-center items-center">
      <View className="w-20 h-20 rounded-full bg-primary-subtle items-center justify-center mb-md">
        <View className="flex-row items-center">
          <View className={`${dotStyle} bg-primary`} />
          <View className={`${dotStyle} bg-white`} />
          <View className={`${dotStyle} bg-white`} />
        </View>
      </View>
      <Text className="text-sm text-ink-teriary text-center">
        반 정보에 맞춰 수업안을 만들고 있어요
      </Text>
    </View>
  );
};

const dotStyle = 'w-3 h-3 rounded-full mx-xxs';
