import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Button } from '../../components/button/Button';
import { Card } from '../../components/card/Card';
import { LessonPlanItem, LessonPlanSet, LessonPlanSetKey } from '../../types/lessonPlan';
import { lessonPlanApi } from '../../api/lessonPlan';
import { useLessonPlanStore } from '../../stores/useLessonPlanStore';
import { calculateTotalDistance, toLessonPlanSets } from '../../utils/lessonPlan';


const getSectionTotalMeters = (section: LessonPlanSet): number =>
  section.items.reduce((sum, item) => sum + item.distance_m * item.set, 0);

export const LessonPlanConfirmScreen = ({ navigation, route }: any) => {
  const { result } = route?.params ?? {};
  const { lessonPlan, setLessonPlan } = useLessonPlanStore();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    console.log(result)
    if (result) {
      setLessonPlan(result);
    }
    // cleanup 함수
    // return () => clearLessonPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  if (!lessonPlan) return null;

  const sections = toLessonPlanSets(lessonPlan.program);

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
          pre_set: lessonPlan.program.pre_set,
          main_set: lessonPlan.program.main_set,
          post_set: lessonPlan.program.post_set,
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

  const handleEditItem = (setKey: LessonPlanSetKey, itemIndex: number) => {
    navigation?.navigate('LessonPlanEditItem', { setKey, itemIndex });
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
          <Text className="text-metric text-ink my-sm">{calculateTotalDistance(toLessonPlanSets(lessonPlan.program))}m</Text>
          <Text className="text-legal text-ink-tertiary">Pre-Set · Main-Set · Post-Set 거리를 더한 값이에요</Text>
        </Card>
        <Text className="text-caption font-bold text-ink my-sm">수업 구성</Text>
        {sections.map((section: LessonPlanSet) => (
          <View key={section.title} className="mb-lg">
            <Card>
              <Card.Header
                className="flex-row items-center justify-between mb-xs"
                title={section.title}
                rightElement={
                  <View className="bg-canvas px-md py-xs rounded-full">
                    <Text className="text-caption-strong text-ink">{`${getSectionTotalMeters(section)}m`}</Text>
                  </View>
                }
              />
              {section.items.map((item: LessonPlanItem, index: number) => (
                <Card.Item
                  key={`${section.key}-${index}`}
                  title={`${item.set} X ${item.distance_m}m  ${item.title}`}
                  description={item.detail}
                  rightElement={
                    <View className="justify-start">
                      <Pressable onPress={() => handleEditItem(section.key, index)} hitSlop={8}>
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
