import React, { useEffect, useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { Button } from '../components/button/Button';
import { classroomApi } from '../api/classroom';
import { SwimClass } from '../types/classroom';
import { Card } from '../components/card/Card';
import { Badge } from '../components/badge/Badge';
import { LEVEL_LABEL } from '../constants/classLabels';
import {
  isToday,
  getTodayBadge,
  getLessonPlanBadge,
  getNearestUpcomingTodayClassId,
  getTodayClassPlanText,
  formatTime,
  formatNextClassLabel,
} from '../utils/classSchedule';

export const ClassListScreen = ({ navigation }: any) => {
  const [classes, setClasses] = useState<SwimClass[]>([]);
  const [now] = useState(() => new Date());

  const fetchClasses = async () => {
    try {
      const data = await classroomApi.getClasses();
      setClasses(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleClassPress = (classId: number) => {
    navigation?.navigate('ClassDetail', { classId });
  };

  const todayClasses = useMemo(
    () => classes.filter((item) => isToday(item.days_of_week, now)),
    [classes, now]
  );

  const highlightedClassId = useMemo(
    () => getNearestUpcomingTodayClassId(todayClasses, now),
    [todayClasses, now]
  );

  const renderStudentCount = (item: SwimClass) =>
    `${item.student_count ?? '-'}/${item.capacity}명`;

  return (
    <ScreenLayout
      title="내 반 목록"
      footer={
        <Button
          label="반 등록하기"
          onPress={() => navigation?.navigate('ClassRegister')}
        />
      }
    >
      {classes.length > 0 ? (
        <>
          {todayClasses.length > 0 && (
            <View className="mb-lg">
              <Text className="text-title-sm text-ink mb-sm">
                오늘의 수업 {todayClasses.length}개
              </Text>
              {todayClasses.map((item) => {
                const badge = getTodayBadge(item.end_time, now);
                const isHighlighted = item.id === highlightedClassId;

                return (
                  <Card
                    key={item.id}
                    variant="default"
                    onPress={() => handleClassPress(item.id)}
                    className={`px-md py-sm mb-md ${isHighlighted ? 'bg-primary-subtle' : ''}`
                    }>
                    <View className="flex-row items-center justify-between mb-xxs">
                      <Text className="text-title-sm text-ink">{item.name}</Text>
                      <Badge variant={badge.variant} text={badge.text} />
                    </View>
                    <Text className="text-xs text-ink-secondary">
                      {formatTime(item.start_time)} · {renderStudentCount(item)} ·{' '}
                      {getTodayClassPlanText(item.lesson_status)}                    </Text>
                  </Card>
                );
              })}
            </View>
          )}

          <View>
            <Text className="text-title-sm text-ink mb-sm">전체 반</Text>
            {classes.map((item: SwimClass) => {
              const planBadge = getLessonPlanBadge(item.lesson_status);
              return (
                <Card
                  key={item.id}
                  variant="default"
                  onPress={() => handleClassPress(item.id)}
                  className="px-md py-sm mb-md"
                >
                  <View className="flex-row items-center justify-between mb-xxs">
                    <Text className="text-title-sm text-ink">{item.name}</Text>
                    <Badge variant={planBadge.variant} text={planBadge.text} />
                  </View>
                  <Text className="text-xs text-ink-secondary mb-xxs">
                    {renderStudentCount(item)} · {LEVEL_LABEL[item.level]}
                  </Text>
                  <Text className="text-xs text-ink-teriary">
                    {formatNextClassLabel(
                      item.days_of_week,
                      item.start_time,
                      item.end_time,
                      now
                    )}
                  </Text>
                </Card>
              );
            })}
          </View>
        </>
      ) : (
        <View className="flex-1 justify-center items-center py-xxl">
          <View className="w-xxl h-xxl bg-canvas-muted rounded-full justify-center items-center mb-md">
            <Text className="text-2xl text-ink-teriary">☰</Text>
          </View>
          <Text className="text-body font-bold text-ink mb-xs">
            아직 등록한 반이 없어요
          </Text>
          <Text className="text-sm text-ink-secondary text-center">
            반을 등록하면 수업안을 만들 수 있어요
          </Text>
        </View>
      )}
    </ScreenLayout>
  );
};
