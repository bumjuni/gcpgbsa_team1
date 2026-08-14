import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, LayoutChangeEvent } from 'react-native';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Button } from '../../components/button/Button';
import { Card } from '../../components/card/Card';
import { useClassStore } from '../../stores/useClassStore';
import { formatNextClassLabel, groupProgramHistoryByWeek, ProgramHistoryItem } from '../../utils/classSchedule';
import { lessonPlanApi } from '../../api/lessonPlan';
import { LLMCurriculumProgram, LLMCurriculumResponse } from '../../types/lessonPlan';

type ClassDetailsTab = '수업진행' | '반정보' | '명단' | '리포트';

const TABS: ClassDetailsTab[] = ['수업진행', '반정보', '명단', '리포트'];

interface CompletedLesson {
  id: number;
  label: string;
}

export const ClassDetailsLessonTabScreen = ({ navigation }: any) => {
  const { currentClass } = useClassStore();
  const [tabRowWidth, setTabRowWidth] = useState(0);
  const [activeTabLayout, setActiveTabLayout] = useState({ x: 0, width: 0 });
  const [programToday, setProgramToday] = useState<LLMCurriculumResponse | null>(null);
  const [programHistory, setProgramHistory] = useState<ProgramHistoryItem[]>([]);


  useEffect(() => {
    if (!currentClass) return;

    const fetchPrograms = async () => {
      try {
        const history = await lessonPlanApi.getLessonPlanHistory(currentClass.id);
        const today = await lessonPlanApi.getLessonPlanToday(currentClass.id);
        setProgramHistory(history);
        setProgramToday(today);
      } catch (error) {
        console.error('수업 기록 조회 실패:', error);
      }
    };

    fetchPrograms();
  }, [currentClass]);

  const completedWeeks = useMemo(
    () =>
      programHistory.length > 0 && currentClass
        ? groupProgramHistoryByWeek(programHistory, currentClass?.start_time)
        : [],
    [programHistory, currentClass],
  );

  if (!currentClass) return null;

  const printNextLesson = () => {
    const nextLesson = formatNextClassLabel(
      currentClass?.days_of_week,
      currentClass?.start_time,
      currentClass?.today_program_status)

    if (nextLesson.startsWith('다'))
      return nextLesson.substring(8)

    return nextLesson
  }

  const UPCOMING_LESSON = {
    dateLabel: printNextLesson(),
    totalDistanceM: programToday?.session_summary.total_distance_m,
  };


  const handleTabPress = (tab: ClassDetailsTab) => {
    if (tab === '수업진행') return;
    if (tab === '반정보') navigation?.navigate('ClassDetailsInfoTab');
    if (tab === '명단') navigation?.navigate('ClassDetailsMemberTab');
    if (tab === '리포트') navigation?.navigate('ClassDetailsReportTab');
  };

  const handleStartLesson = () => {
    navigation?.navigate('LessonPlanComplete');
  };

  const handleLessonHistoryPress = (lesson: CompletedLesson) => {
    navigation?.navigate('ClassDetailsLessonHistory');
  };

  const handleTabRowLayout = (e: LayoutChangeEvent) => {
    setTabRowWidth(e.nativeEvent.layout.width);
  };

  const handleActiveTabLayout = (e: LayoutChangeEvent) => {
    setActiveTabLayout({ x: e.nativeEvent.layout.x, width: e.nativeEvent.layout.width });
  };

  const indicatorWidth = tabRowWidth * 0.25;
  const indicatorLeft = activeTabLayout.x + activeTabLayout.width / 2 - indicatorWidth / 2;

  return (
    <ScreenLayout title={currentClass.name} showBackButton scrollable={false}>
      <View
        className="relative -mx-md px-md pt-md flex-row justify-between border-b border-hairline mb-lg"
        onLayout={handleTabRowLayout}
      >
        {TABS.map((tab) => {
          const active = tab === '수업진행';
          return (
            <Pressable
              key={tab}
              onPress={() => handleTabPress(tab)}
              onLayout={active ? handleActiveTabLayout : undefined}
              className="items-center pb-md"
            >
              <Text className={`text-body-strong ${active ? 'text-primary' : 'text-ink-secondary'}`}>
                {tab}
              </Text>
            </Pressable>
          );
        })}
        {tabRowWidth > 0 && (
          <View
            className="h-1 bg-primary absolute bottom-0"
            style={{ width: indicatorWidth, left: indicatorLeft }}
          />
        )}
      </View>

      <View className="pb-lg">
        <Text className="text-base font-bold text-ink mb-sm">진행 예정 수업</Text>
        <Card variant="default" className="px-md py-md mb-lg">
          <Text className="text-title-sm text-ink mb-xxs">{UPCOMING_LESSON.dateLabel}</Text>
          <Text className="text-caption text-ink-secondary">
            총 {UPCOMING_LESSON.totalDistanceM}m
          </Text>
        </Card>
        <Button label="수업 진행하기" onPress={handleStartLesson} />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Text className="text-base font-bold text-ink mb-sm">종료된 수업</Text>
        {completedWeeks.map((week) => (
          <View key={week.weekLabel} className="mb-md">
            <Card>
              <Card.Header title={week.weekLabel} />
              {week.lessons.map((lesson, index) => (
                <Card.Item
                  key={lesson.id}
                  title={lesson.label}
                  onPress={() => handleLessonHistoryPress(lesson)}
                  isLast={index === week.lessons.length - 1}
                  rightElement={<Text className="text-ink-tertiary">›</Text>}
                />
              ))}
            </Card>
          </View>
        ))}
        <View className="pb-xl" />
      </ScrollView>
    </ScreenLayout>
  );
};
