import React from 'react';
import { View, Text } from 'react-native';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Card } from '../../components/card/Card';
import { useClassStore } from '../../stores/useClassStore';

interface LessonHistoryItem {
  name: string;
  description: string;
  achieved: boolean;
}

interface LessonHistorySection {
  title: string;
  items: LessonHistoryItem[];
}

const DEFAULT_SECTIONS: LessonHistorySection[] = [
  {
    title: 'Pre-Set',
    items: [
      { name: '1 x 100m 자유형', description: '멈추지 않고 편하게', achieved: true },
      { name: '1 x 100m 배영', description: '편하게', achieved: true },
    ],
  },
  {
    title: 'Main-Set',
    items: [
      { name: '4×25m 자유형 킥', description: '강도 점점 높이며 마지막은 대쉬', achieved: false },
      { name: '2×100m 자유형 풀', description: '풀부이 끼고', achieved: false },
      { name: '4 x 200m 자유형 2-4-6 호흡', description: '호흡을 2번, 4번, 6번에 한번씩 하기', achieved: false },
      { name: '4×25m 접영 (90%)', description: '파워풀하게', achieved: false },
    ],
  },
  {
    title: 'Post-Set',
    items: [{ name: '1 x 100m 자유형', description: '천천히', achieved: false }],
  },
];

export const ClassDetailsLessonHistoryScreen = ({ route }: any) => {
  const { currentClass } = useClassStore();

  // const {
  //   label = '8월 4일 오후 7:00 수업',
  //   plannedDistanceM = 1500,
  //   actualDistanceM = 200,
  //   sections = DEFAULT_SECTIONS,
  // } = route?.params ?? {};

  return (
    <ScreenLayout title={label} showBackButton>
      <View className="pt-md pb-xl">
        <Text className="text-sm text-ink-secondary mb-lg">
          계획 {plannedDistanceM.toLocaleString()}m 중 실제 {actualDistanceM.toLocaleString()}m 진행
        </Text>

        {sections.map((section: LessonHistorySection) => (
          <View key={section.title} className="mb-lg">
            <Card>
              <Card.Header title={section.title} />
              {section.items.map((item, index) => (
                <View
                  key={`${section.title}-${index}`}
                  className={`flex-row items-center px-4 py-3.5 ${
                    item.achieved ? 'bg-primary-subtle' : 'bg-canvas opacity-[0.45]'
                  } ${index !== section.items.length - 1 ? 'border-b border-hairline' : ''}`}
                >
                  <View
                    className={`w-6 h-6 rounded-sm border items-center justify-center mr-3 ${
                      item.achieved ? 'bg-primary border-primary' : 'border-hairline-border-strong'
                    }`}
                  >
                    {item.achieved && <Text className="text-white text-xs font-bold">✓</Text>}
                  </View>
                  <View className="flex-1">
                    <Text className="text-body-strong text-ink">{item.name}</Text>
                    <Text className="text-caption text-ink-tertiary mt-0.5">{item.description}</Text>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        ))}
      </View>
    </ScreenLayout>
  );
};
