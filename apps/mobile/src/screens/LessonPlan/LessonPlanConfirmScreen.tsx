import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Button } from '../../components/button/Button';
import { Card } from '../../components/card/Card';
import { useLessonPlanStore } from '../../stores/useLessonPlanStore';
import { LessonPlanItem, LessonPlanSet } from '../../types/lessonPlan';
import { lessonPlanApi } from '../../api/lessonPlan';


const getSectionTotalMeters = (section: LessonPlanSet): number =>
  section.items.reduce((sum, item) => sum + item.distance_m * item.set, 0);

const getTotalMeters = (sections: LessonPlanSet[]): number =>
  sections.reduce((sum, section) => sum + getSectionTotalMeters(section), 0);

export const LessonPlanConfirmScreen = ({ navigation, route }: any) => {
  const { result } = route?.params ?? {};
  const sections = useLessonPlanStore((s) => s.sections);
  const setSections = useLessonPlanStore((s) => s.setSections);
  const clearSections = useLessonPlanStore((s) => s.clearSections);
  const totalDistance = useMemo(() => getTotalMeters(sections), [sections]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    setSections(result);
    return () => {
      clearSections(); // 화면 unmount 시 정리
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetry = () => {
    navigation?.goBack();
  };

  const handleConfirm = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await lessonPlanApi.confirmLessonPlan(result.id, {
        status: 'CONFIRMED',
        program: {
          pre_set: sections.find((s) => s.title === 'Pre-Set')?.items ?? [],
          main_set: sections.find((s) => s.title === 'Main-Set')?.items ?? [],
          post_set: sections.find((s) => s.title === 'Post-Set')?.items ?? [],
        },
      });

      clearSections();
      navigation?.navigate('ClassList');
    } catch (error) {
      console.error(error);
      // TODO: 에러 토스트/알럿
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditItem = (sectionTitle: string, itemIndex: number) => {
    navigation?.navigate('LessonPlanEditItem', { sectionTitle, itemIndex });
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
          <View className="flex-auto ml-xs">
            <Button label="수업안 확정하기" onPress={handleConfirm} variant="primary" />
          </View>
        </View>
      }
    >
      <View className="pt-md pb-xl">
        <Card variant="muted" className="items-center pt-md">
          <Text className="text-caption text-ink-secondary">총 운동량</Text>
          <Text className="text-metric text-ink my-sm">{totalDistance}m</Text>
          <Text className="text-legal text-ink-tertiary">Pre-Set · Main-Set · Post-Set 거리를 더한 값이에요</Text>
        </Card>

        <Text className="text-caption font-bold text-ink my-sm">수업 구성</Text>


        {sections.map((section: LessonPlanSet) => (
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
              {section.items.map((item: LessonPlanItem, index) =>
                <Card.Item
                  key={`${section.title}-${index}`}
                  title={item.title}
                  description={item.detail}
                  rightElement={
                    <View className="items-end flex-col justify-between">
                      <Text className="text-label text-ink-tertiary">{item.set} X {item.distance_m}m</Text>
                      <Pressable onPress={() => handleEditItem(section.title, index)} hitSlop={8}>
                        <Text className="text-caption text-primary font-medium">수정</Text>
                      </Pressable>
                    </View>
                  }
                  isLast={(index === section.items.length) ? true : false}
                />
              )}
            </Card>


          </View>
        ))}
      </View>
    </ScreenLayout>
  );
};
