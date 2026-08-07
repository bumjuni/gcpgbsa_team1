import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { Button } from '../components/Button';

interface LessonSetItem {
  name: string;
  description: string;
  distance: string;
}

interface LessonSection {
  title: string;
  totalDistance: string;
  items: LessonSetItem[];
}

const DEFAULT_SECTIONS: LessonSection[] = [
  {
    title: '웜업',
    totalDistance: '200m',
    items: [
      { name: '100m 자유형', description: '천천히 힘 빼고 편하게', distance: '100m' },
      { name: '100m 배영', description: '편하게', distance: '100m' },
    ],
  },
  {
    title: '메인 세트',
    totalDistance: '700m',
    items: [
      { name: '4×25m 자유형 킥', description: '강도 편한 방식으로 자유롭게 내용', distance: '4×25m' },
      { name: '2×100m 자유형 풀', description: '풀부이 활용', distance: '2×100m' },
      { name: '피라미드 25·50·75·75·50·25m 자유형', description: '자신감이 있으면 도전', distance: '300m' },
      { name: '4×25m 접영 (90%)', description: '휴식은 충분히', distance: '4×25m' },
    ],
  },
  {
    title: '콜다운',
    totalDistance: '100m',
    items: [{ name: '100m 자유형', description: '천천히', distance: '100m' }],
  },
];

export const LessonPlanConfirmScreen = ({ navigation, route }: any) => {
  const { totalDistance = 1000, sections = DEFAULT_SECTIONS } = route?.params ?? {};

  const handleRetry = () => {
    navigation?.goBack();
  };

  const handleConfirm = () => {
    navigation?.navigate('LessonPlanComplete', { totalDistance, sections });
  };

  const handleEditItem = (sectionTitle: string, itemIndex: number) => {
    navigation?.navigate('LessonPlanCreate', { section: sectionTitle, itemIndex });
  };

  return (
    <ScreenLayout
      title="수업안 확인"
      showBackButton
      footer={
        <View className="flex-row">
          <View className="flex-1 mr-xs">
            <Button label="다시 만들기" onPress={handleRetry} variant="secondary" />
          </View>
          <View className="flex-1 ml-xs">
            <Button label="수업안 확정하기" onPress={handleConfirm} variant="primary" />
          </View>
        </View>
      }
    >
      <View className="pt-md pb-xl">
        <View className="bg-surface-muted rounded-md px-md py-lg items-center mb-lg">
          <Text className="text-sm text-ink-teriary font-medium mb-xxs">총 운동량</Text>
          <Text className="text-3xl font-bold text-primary mb-xs">
            {totalDistance.toLocaleString()} m
          </Text>
          <Text className="text-xs text-ink-teriary text-center">
            웜업 · 메인 · 콜다운 자유형 다 같이해요
          </Text>
        </View>

        <Text className="text-base font-bold text-ink mb-sm">수업 구성</Text>

        {sections.map((section: LessonSection) => (
          <View key={section.title} className="mb-lg">
            <View className="flex-row items-center justify-between mb-xs">
              <Text className="text-base font-bold text-ink">{section.title}</Text>
              <Text className="text-sm font-bold text-ink-teriary">{section.totalDistance}</Text>
            </View>

            {section.items.map((item, index) => (
              <View
                key={`${section.title}-${index}`}
                className="flex-row items-center justify-between border border-surface-hairline rounded-md px-md py-sm mb-xs"
              >
                <View className="flex-1 mr-xs">
                  <Text className="text-sm font-bold text-ink mb-xxs">{item.name}</Text>
                  <Text className="text-xs text-ink-teriary">{item.description}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-sm font-bold text-ink mb-xxs">{item.distance}</Text>
                  <Pressable onPress={() => handleEditItem(section.title, index)} hitSlop={8}>
                    <Text className="text-xs font-medium text-primary">수정</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScreenLayout>
  );
};
