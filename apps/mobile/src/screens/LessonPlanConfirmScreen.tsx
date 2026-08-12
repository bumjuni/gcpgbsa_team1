import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { Button } from '../components/button/Button';
import { Card } from '../components/card/Card';

interface LessonSetItem {
  name: string;
  description: string;
  distance: string;
}

interface LessonSection {
  title: string;
  items: LessonSetItem[];
}

const DEFAULT_SECTIONS: LessonSection[] = [
  {
    title: 'Pre-Set',
    items: [
      { name: '100m 자유형', description: '천천히 힘 빼고 편하게', distance: '100m' },
      { name: '100m 배영', description: '편하게', distance: '100m' },
    ],
  },
  {
    title: 'Main-Set',
    items: [
      { name: '4×25m 자유형 킥', description: '강도 편한 방식으로 자유롭게 내용', distance: '4×25m' },
      { name: '2×100m 자유형 풀', description: '풀부이 활용', distance: '2×100m' },
      { name: '피라미드 25·50·75·75·50·25m 자유형', description: '자신감이 있으면 도전', distance: '300m' },
      { name: '4×25m 접영 (90%)', description: '휴식은 충분히', distance: '4×25m' },
    ],
  },
  {
    title: 'Post-Set',
    items: [{ name: '100m 자유형', description: '천천히', distance: '100m' }],
  },
];

// 수영 관용 표기(개수×구간거리) 파싱: "4×25m" -> 4*25, "100m" -> 100
const parseDistanceMeters = (distance: string): number => {
  const match = distance.match(/^(\d+)(?:[×x](\d+))?m$/);
  if (!match) return 0;
  const [, first, second] = match;
  return second ? Number(first) * Number(second) : Number(first);
};

const getSectionTotalMeters = (section: LessonSection): number =>
  section.items.reduce((sum, item) => sum + parseDistanceMeters(item.distance), 0);

// "4×25m" -> { count: 4, intervalDistance: 25 }, "100m" -> { count: 1, intervalDistance: 100 }
const parseCountAndDistance = (distance: string): { count: number; intervalDistance: number } => {
  const match = distance.match(/^(\d+)(?:[×x](\d+))?m$/);
  if (!match) return { count: 1, intervalDistance: 0 };
  const [, first, second] = match;
  return second
    ? { count: Number(first), intervalDistance: Number(second) }
    : { count: 1, intervalDistance: Number(first) };
};

export const LessonPlanConfirmScreen = ({ navigation, route }: any) => {
  const { totalDistance = 1000 } = route?.params ?? {};
  const [sections, setSections] = useState<LessonSection[]>(
    route?.params?.sections ?? DEFAULT_SECTIONS
  );

  useEffect(() => {
    const edited = route?.params?.editedItem;
    if (!edited) return;

    setSections((prev) =>
      prev.map((section) =>
        section.title !== edited.sectionTitle
          ? section
          : {
              ...section,
              items: section.items.map((it, i) =>
                i !== edited.itemIndex
                  ? it
                  : {
                      name: edited.name,
                      description: edited.description,
                      distance:
                        edited.count === 1
                          ? `${edited.intervalDistance}m`
                          : `${edited.count}×${edited.intervalDistance}m`,
                    }
              ),
            }
      )
    );
    navigation?.setParams({ editedItem: undefined });
  }, [route?.params?.editedItem]);

  const handleRetry = () => {
    navigation?.goBack();
  };

  const handleConfirm = () => {
    navigation?.navigate('LessonPlanComplete', { totalDistance, sections });
  };

  const handleEditItem = (sectionTitle: string, itemIndex: number, item: LessonSetItem) => {
    const { count, intervalDistance } = parseCountAndDistance(item.distance);
    navigation?.navigate('LessonPlanEditItem', {
      sectionTitle,
      itemIndex,
      name: item.name,
      description: item.description,
      count,
      intervalDistance,
    });
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
        <Card variant="muted" className="items-center py-6">
          <Text className="text-caption text-ink-secondary">총 운동량</Text>
          <Text className="text-metric text-ink my-1">1,000m</Text>
          <Text className="text-legal text-ink-tertiary">Pre-Set · Main-Set · Post-Set 거리를 더한 값이에요</Text>
        </Card>
        {/*<View className="bg-surface-muted rounded-md px-md py-lg items-center mb-lg">
          <Text className="text-sm text-ink-teriary font-medium mb-xxs">총 운동량</Text>
          <Text className="text-3xl font-bold text-primary mb-xs">
            {totalDistance.toLocaleString()} m
          </Text>
          <Text className="text-xs text-ink-teriary text-center">
            Pre-Set · Main-Set · Post-Set 자유형 다 같이해요
          </Text>
        </View>*/}

        <Text className="text-base font-bold text-ink mb-sm">수업 구성</Text>

        {sections.map((section: LessonSection) => (
          <View key={section.title} className="mb-lg">

            <Card>
              <Card.Header className="flex-row items-center justify-between mb-xs"
                title={section.title}
                rightElement={
                  <View className="bg-canvas px-md py-xs rounded-full">
                    <Text className="text-caption-strong text-ink">{`${getSectionTotalMeters(section)}m`}</Text>
                  </View>
                }
              />
              {section.items.map((item, index) =>
                <Card.Item
                  key={`${section.title}-${index}`}
                  title={item.name}
                  description={item.description}
                  rightElement={
                    <View className="items-end">
                      <Text className="text-caption-strong text-ink">{item.distance}</Text>
                      <Pressable onPress={() => handleEditItem(section.title, index, item)} hitSlop={8}>
                        <Text className="text-caption text-primary font-medium">수정</Text>
                      </Pressable>
                    </View>
                  }
                  isLast={(index === section.items.length) ? true : false}
                />
              )}
              {/*{section.items.map((item, index) => (
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
                    <Pressable onPress={() => handleEditItem(section.title, index, item)} hitSlop={8}>
                      <Text className="text-xs font-medium text-primary">수정</Text>
                    </Pressable>
                  </View>
                </View>
              ))}*/}
            </Card>


          </View>
        ))}
      </View>
    </ScreenLayout>
  );
};
