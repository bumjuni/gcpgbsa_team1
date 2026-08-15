import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, LayoutChangeEvent } from 'react-native';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Button } from '../../components/button/Button';
import { Card } from '../../components/card/Card';
import { useClassStore } from '../../stores/useClassStore';
import { formatDateToYMD, formatNextClassLabel, getNextClassDate, groupProgramHistoryByWeek, ProgramHistoryItem } from '../../utils/classSchedule';
import { useLessonPlanStore } from '../../stores/useLessonPlanStore';
import { calculateTotalDistance } from '../../utils/calculator';
import { lessonPlanApi } from '../../api/lessonPlan';

type ClassDetailsTab = '수업진행' | '반정보' | '명단' | '리포트';

const TABS: ClassDetailsTab[] = ['수업진행', '반정보', '명단', '리포트'];

interface CompletedLesson {
  id: number;
  label: string;
}

export const ClassDetailsLessonTabScreen = ({ navigation }: any) => {
  const currentClass = useClassStore((s) => s.currentClass);
  const {sections, setSections} = useLessonPlanStore();
  const [tabRowWidth, setTabRowWidth] = useState(0);
  const [activeTabLayout, setActiveTabLayout] = useState({ x: 0, width: 0 });
  const [programHistory, setProgramHistory] = useState<ProgramHistoryItem[]>([]);


  useEffect(() => {
    if (!currentClass) return;

    const fetchPrograms = async () => {
      try {
        const history = await lessonPlanApi.getLessonPlanHistory(currentClass.id);
        const nextClassDate = getNextClassDate(currentClass.days_of_week, currentClass.start_time, currentClass.today_program_status);
        const nextProgram = await lessonPlanApi.getLessonPlanDate(currentClass.id, formatDateToYMD(nextClassDate?.date as Date));

        setProgramHistory(history);
        setSections(nextProgram?.program ?? null);
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


  const handleTabPress = (tab: ClassDetailsTab) => {
    if (tab === '수업진행') return;
    if (tab === '반정보') navigation?.navigate('ClassDetailsInfoTab');
    if (tab === '명단') navigation?.navigate('ClassDetailsMemberTab');
    if (tab === '리포트') navigation?.navigate('ClassDetailsReportTab');
  };

  const handleStartLesson = () => {

    navigation?.navigate('LessonPlanComplete');
  };

  const handleCreateLesson = () => {
    navigation?.navigate('LessonPlanCreate');
  }

  const handleLessonHistoryPress = (lesson: CompletedLesson) => {
    navigation?.navigate('ClassDetailsLessonHistory');
  };

  const handleTabRowLayout = (e: LayoutChangeEvent) => {
    setTabRowWidth(e.nativeEvent.layout.width);
  };

  const handleActiveTabLayout = (e: LayoutChangeEvent) => {
    setActiveTabLayout({ x: e.nativeEvent.layout.x, width: e.nativeEvent.layout.width });
  };

  const handleConfirmLesson = () => { };

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
          <Text className="text-title-sm text-ink mb-xxs">{printNextLesson()}</Text>
          <Text className="text-caption text-ink-secondary mt-xxs">
            {sections.length ? `총 ${calculateTotalDistance(sections)}m` : `수업안이 아직 확정되지 않았어요`}
          </Text>
        </Card>
        {sections.length ? (
          <Button
            label={"수업 진행하기"}
            onPress={handleStartLesson}
          />
        ) : (
          <Button
            label={"수업안 만들기"}
            onPress={handleCreateLesson}
          />
        )}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Text className="text-base font-bold text-ink mb-sm">종료된 수업</Text>

        {completedWeeks.length ? (
          <>
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
          </>
        ) : (
          <Text className="text-caption text-ink-secondary self-center my-lg">아직 종료된 수업이 없어요</Text>
        )}
        <View className="pb-xl" />
      </ScrollView>
    </ScreenLayout>
  );
};
