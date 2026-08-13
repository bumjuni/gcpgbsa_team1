import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, LayoutChangeEvent } from 'react-native';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Button } from '../../components/button/Button';
import { Card } from '../../components/card/Card';

type ClassDetailsTab = '수업진행' | '반정보' | '명단' | '리포트';

const TABS: ClassDetailsTab[] = ['수업진행', '반정보', '명단', '리포트'];

interface CompletedLesson {
  id: string;
  label: string;
}

interface CompletedLessonWeek {
  weekLabel: string;
  lessons: CompletedLesson[];
}

const UPCOMING_LESSON = {
  dateLabel: '8월 11일 (화) 오후 7:00',
  totalDistanceM: 1150,
};

const COMPLETED_WEEKS: CompletedLessonWeek[] = [
  {
    weekLabel: '8월 1주차 (8/3~8/9)',
    lessons: [
      { id: '2026-08-06', label: '8월 6일 (목) 오후 7:00' },
      { id: '2026-08-04', label: '8월 4일 (화) 오후 7:00' },
    ],
  },
  {
    weekLabel: '7월 4주차 (7/27~8/2)',
    lessons: [
      { id: '2026-07-30', label: '7월 30일 (목) 오후 7:00' },
      { id: '2026-07-28', label: '7월 28일 (화) 오후 7:00' },
    ],
  },
];

export const ClassDetailsLessonTabScreen = ({ navigation, route }: any) => {
  const { className = '화요일 저녁 초급반', classId } = route?.params ?? {};
  const [tabRowWidth, setTabRowWidth] = useState(0);
  const [activeTabLayout, setActiveTabLayout] = useState({ x: 0, width: 0 });

  const handleTabPress = (tab: ClassDetailsTab) => {
    if (tab === '수업진행') return;
    if (tab === '반정보') navigation?.navigate('ClassDetailsInfoTab', { classId, className });
    if (tab === '명단') navigation?.navigate('ClassDetailsMemberTab', { classId, className });
    if (tab === '리포트') navigation?.navigate('ClassDetailsReportTab', { classId, className });
  };

  const handleStartLesson = () => {
    navigation?.navigate('LessonPlanComplete', { classId, className });
  };

  const handleLessonHistoryPress = (lesson: CompletedLesson) => {
    navigation?.navigate('ClassDetailsLessonHistory', { classId, lessonId: lesson.id, label: lesson.label });
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
    <ScreenLayout title={className} showBackButton scrollable={false}>
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
            총 {UPCOMING_LESSON.totalDistanceM.toLocaleString()}m
          </Text>
        </Card>
        <Button label="수업 진행하기" onPress={handleStartLesson} />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Text className="text-base font-bold text-ink mb-sm">종료된 수업</Text>
        {COMPLETED_WEEKS.map((week) => (
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
