import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Card } from '../../components/card/Card';
import { lessonPlanApi } from '../../api/lessonPlan';
import { LessonPlanResponse, LessonPlanSet } from '../../types/lessonPlan';
import { calculateCheckedDistance, toLessonPlanSets } from '../../utils/lessonPlan';

export const ClassDetailsLessonHistoryScreen = ({ navigation, route }: any) => {
  const { classId, date } = route?.params ?? {};
  const [lessonPlan, setLessonPlan] = useState<LessonPlanResponse | null>(null)

  useEffect(() => {
    const fetchLessonPlan = async () => {
      try {
        const result = await lessonPlanApi.getLessonPlanDate(classId, date);
        setLessonPlan(result)
      } catch (error) {
        console.error('수업 조회 실패:', error);
      }
    };
    fetchLessonPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!lessonPlan) return null;
  const lessonSection = toLessonPlanSets(lessonPlan.program);


  return (
    <ScreenLayout title={date} showBackButton>
      <View className="pt-md pb-xl">
        <Text className="text-sm text-ink-secondary mb-lg">
          계획 {lessonPlan?.session_summary.total_distance_m.toLocaleString()}m 중 실제 {calculateCheckedDistance(lessonPlan)}m 진행
        </Text>

        {lessonSection.map((section: LessonPlanSet) => (
          <View key={section.title} className="mb-lg">
            <Card>
              <Card.Header title={section.title} />
              {section.items.map((item, index) => (
                <View
                  key={`${section.title}-${index}`}
                  className={`flex-row items-center px-4 py-3.5 ${
                    item.is_checked ? 'bg-primary-subtle' : 'bg-canvas opacity-[0.45]'
                  } ${index !== section.items.length - 1 ? 'border-b border-hairline' : ''}`}
                >
                  <View
                    className={`w-6 h-6 rounded-sm border items-center justify-center mr-3 ${
                      item.is_checked ? 'bg-primary border-primary' : 'border-hairline-border-strong'
                    }`}
                  >
                    {item.is_checked && <Text className="text-white text-xs font-bold">✓</Text>}
                  </View>
                  <View className="flex-1">
                    <Text className="text-body-strong text-ink">{item.title}</Text>
                    <Text className="text-caption text-ink-tertiary mt-0.5">{item.detail}</Text>
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
