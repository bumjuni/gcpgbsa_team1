import React from 'react';
import { View, Text } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { Button } from '../components/button/Button';

export const ClassCreateCompleteScreen = ({ navigation, route }: any) => {
  const {
    day = '화요일',
    timeOfDay = '저녁',
    className = '초급반',
    memberCount = 8,
    level = '초급',
  } = route?.params ?? {};

  const summaryText = `${day} ${timeOfDay} ${className} · 인원 ${memberCount}명 · ${level}`;

  const handleGoToClassList = () => {
    navigation?.navigate('ClassList');
  };

  const handleCreateLessonPlan = () => {
    navigation?.navigate('LessonPlanCreate');
  };

  return (
    <ScreenLayout
      title=""
      scrollable={false}
      footer={
        <View className="items-center">
          <Button
            label="반 목록으로 갈게요"
            onPress={handleGoToClassList}
            variant='text'
          />
          <Button label="수업안 만들기" onPress={handleCreateLessonPlan} />
        </View>
      }
    >
      <View className="flex-1 justify-center items-center">
        <View className="w-20 h-20 rounded-full bg-primary-subtle items-center justify-center mb-md">
          <Text className="text-3xl font-bold text-primary">✓</Text>
        </View>
        <Text className="text-title-lg text-ink text-center">등록을 완료했어요</Text>
        <Text className="text-body text-ink-secondary text-center my-md">{summaryText}</Text>
        <Text className="text-caption text-ink-tertiary text-center leading-5">
          이제 이 반에 맞는 수업안을 만들 수 있어요
        </Text>
      </View>
    </ScreenLayout>
  );
};
