import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Button } from '../../components/button/Button';
import { Card } from '../../components/card/Card';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useLessonPlanStore } from '../../stores/useLessonPlanStore';
import { toLessonPlanSets } from '../../utils/lessonPlan';
import { LessonPlanSet, LessonPlanSetKey } from '../../types/lessonPlan';
import { lessonPlanApi } from '../../api/lessonPlan';

export const LessonPlanCompleteScreen = ({ navigation }: any) => {
  const { lessonPlan, updateItem } = useLessonPlanStore();
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!lessonPlan) return null;

  const toggleItem = async (setKey: LessonPlanSetKey, index: number) => {
    if (!lessonPlan) return;
    const item = lessonPlan.program[setKey][index];
    if (!item) return;

    const prevChecked = item.is_checked;
    updateItem(setKey, index, { ...item, is_checked: !prevChecked });

    try {
      await lessonPlanApi.toggleLessonPlanItemChecked(item.id);
    } catch (error) {
      console.error('체크 상태 변경 실패:', error);
      updateItem(setKey, index, { ...item, is_checked: prevChecked }); // 원래 값으로 롤백
    }
  };

  const handleFinishClass = () => {
    setIsFinishModalOpen(true);
  };

  const handleConfirmFinish = async () => {
      if (!lessonPlan || isSubmitting) return;
      setIsSubmitting(true);
      try {
        await lessonPlanApi.completeLessonPlan(
          lessonPlan.id, {
          status: 'COMPLETED',
          program: lessonPlan.program
        });
        setIsFinishModalOpen(false);
        navigation?.navigate('ClassList');
      } catch (error) {
        console.error('수업 종료 실패:', error);
        // TODO: 에러 토스트/알럿
      } finally {
        setIsSubmitting(false);
      }
    };


  if (!lessonPlan) return null;
  const sections = toLessonPlanSets(lessonPlan.program);

  return (
    <>
      <ScreenLayout
        title="수업 진행"
        showBackButton
        footer={<Button label="수업 종료하기" onPress={handleFinishClass} />}
      >
        <View className="pt-md pb-xl">
          <Text className="text-base font-bold text-ink mb-xxs">
            {lessonPlan.date}· 총 {lessonPlan.session_summary.total_distance_m.toLocaleString()}m
          </Text>
          <Text className="text-caption text-ink-tertiary mb-lg">
            *실제로 진행한 수업에 체크하시면 돼요
          </Text>

          {sections.map((section: LessonPlanSet) => (
            <View key={section.title} className="mb-lg">
              <Card>
                <Card.Header title={section.title} />
                {section.items.map((item, index) => {
                  const checked = Boolean(item.is_checked);
                  return (
                    <Card.Item
                      key={`${section.key}-${index}`}
                      title={`${item.title} · ${item.duration_min}분`}
                      description={item.detail}
                      isLast={index === section.items.length - 1}
                      onPress={() => toggleItem(section.key, index)}
                      leftElement={
                        <View
                          className={`w-xl h-xl rounded-sm border items-center justify-center mr-xxs ${
                            checked ? 'bg-primary border-primary' : 'border-hairline-border-strong'
                          }`}
                        >
                          {checked && <Text className="text-white text-2xl font-bold">✓</Text>}
                        </View>
                      }
                    />
                  );
                })}
              </Card>
            </View>
          ))}
        </View>
      </ScreenLayout>

      <ConfirmModal
        visible={isFinishModalOpen}
        title="수업이 끝나셨나요?"
        description="종료하면 오늘 수업 내용이 확정돼요. 확정 후에는 출석을 바꿀 수 없어요."
        confirmText="종료하기"
        cancelText="아직 안끝났어요"
        onConfirm={handleConfirmFinish}
        onCancel={() => setIsFinishModalOpen(false)}
      />
    </>
  );
};
