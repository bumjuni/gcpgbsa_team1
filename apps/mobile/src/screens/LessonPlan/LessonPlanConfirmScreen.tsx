import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Button } from '../../components/button/Button';
import { Card } from '../../components/card/Card';
import { LessonPlanItem, LessonPlanResponse, LessonPlanSet } from '../../types/lessonPlan';
import { lessonPlanApi } from '../../api/lessonPlan';
import { useLessonPlanStore } from '../../stores/useLessonPlanStore';


const getSectionTotalMeters = (section: LessonPlanSet): number =>
  section.items.reduce((sum, item) => sum + item.distance_m * item.set, 0);

export const LessonPlanConfirmScreen = ({ navigation, route }: any) => {
  const { result } = route?.params ?? {};
  const { lessonPlan, setLessonPlan, clearLessonPlan } = useLessonPlanStore();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    setLessonPlan(result ?? null);
    return () => clearLessonPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!lessonPlan) return null;

  const handleRetry = () => {
    navigation?.goBack();
  };

  const handleConfirm = async () => {
    if (isLoading || !lessonPlan) return;
    setIsLoading(true);
    try {
      await lessonPlanApi.confirmLessonPlan(lessonPlan.id, {
        status: 'CONFIRMED',
        program: {
          pre_set: lessonPlan.lesson_plan.pre_set,
          main_set: lessonPlan.lesson_plan.main_set,
          post_set: lessonPlan.lesson_plan.post_set,
        },
      });
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
          <Text className="text-metric text-ink my-sm">{lessonPlan.session_summary.total_distance_m}m</Text>
          <Text className="text-legal text-ink-tertiary">Pre-Set · Main-Set · Post-Set 거리를 더한 값이에요</Text>
        </Card>
        <Text className="text-caption font-bold text-ink my-sm">수업 구성</Text>
        {sections.map((section) => (
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
              {section.items.map((item: LessonPlanItem, index: number) => (
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
                  isLast={index === section.items.length - 1}
                />
              ))}
            </Card>
          </View>
        ))}
      </View>
    </ScreenLayout>
  );
};
