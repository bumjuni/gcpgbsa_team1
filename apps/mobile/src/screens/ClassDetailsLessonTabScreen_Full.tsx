import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, LayoutChangeEvent } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { Button } from '../components/button/Button';
import { Card } from '../components/card/Card';

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

// Max dummy — 8월~5월 스크롤 테스트용 데이터(02-B2/02-B3 max dummy 프로토타입과 같은 용도)
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
  {
    weekLabel: '7월 3주차 (7/20~7/26)',
    lessons: [
      { id: '2026-07-23', label: '7월 23일 (목) 오후 7:00' },
      { id: '2026-07-21', label: '7월 21일 (화) 오후 7:00' },
    ],
  },
  {
    weekLabel: '7월 2주차 (7/13~7/19)',
    lessons: [
      { id: '2026-07-16', label: '7월 16일 (목) 오후 7:00' },
      { id: '2026-07-14', label: '7월 14일 (화) 오후 7:00' },
    ],
  },
  {
    weekLabel: '7월 1주차 (7/6~7/12)',
    lessons: [
      { id: '2026-07-09', label: '7월 9일 (목) 오후 7:00' },
      { id: '2026-07-07', label: '7월 7일 (화) 오후 7:00' },
    ],
  },
  {
    weekLabel: '6월 5주차 (6/29~7/5)',
    lessons: [
      { id: '2026-07-02', label: '7월 2일 (목) 오후 7:00' },
      { id: '2026-06-30', label: '6월 30일 (화) 오후 7:00' },
    ],
  },
  {
    weekLabel: '6월 4주차 (6/22~6/28)',
    lessons: [
      { id: '2026-06-25', label: '6월 25일 (목) 오후 7:00' },
      { id: '2026-06-23', label: '6월 23일 (화) 오후 7:00' },
    ],
  },
  {
    weekLabel: '6월 3주차 (6/15~6/21)',
    lessons: [
      { id: '2026-06-18', label: '6월 18일 (목) 오후 7:00' },
      { id: '2026-06-16', label: '6월 16일 (화) 오후 7:00' },
    ],
  },
  {
    weekLabel: '6월 2주차 (6/8~6/14)',
    lessons: [
      { id: '2026-06-11', label: '6월 11일 (목) 오후 7:00' },
      { id: '2026-06-09', label: '6월 9일 (화) 오후 7:00' },
    ],
  },
  {
    weekLabel: '6월 1주차 (6/1~6/7)',
    lessons: [
      { id: '2026-06-04', label: '6월 4일 (목) 오후 7:00' },
      { id: '2026-06-02', label: '6월 2일 (화) 오후 7:00' },
    ],
  },
  {
    weekLabel: '5월 4주차 (5/25~5/31)',
    lessons: [
      { id: '2026-05-28', label: '5월 28일 (목) 오후 7:00' },
      { id: '2026-05-26', label: '5월 26일 (화) 오후 7:00' },
    ],
  },
  {
    weekLabel: '5월 3주차 (5/18~5/24)',
    lessons: [
      { id: '2026-05-21', label: '5월 21일 (목) 오후 7:00' },
      { id: '2026-05-19', label: '5월 19일 (화) 오후 7:00' },
    ],
  },
];

export const ClassDetailsLessonTabScreen_Full = ({ navigation, route }: any) => {
  const { className = '화요일 저녁 초급반', classId } = route?.params ?? {};
  const [tabRowWidth, setTabRowWidth] = useState(0);
  const [activeTabLayout, setActiveTabLayout] = useState({ x: 0, width: 0 });

  const handleTabPress = (tab: ClassDetailsTab) => {
    if (tab === '수업진행') return;
    if (tab === '반정보') navigation?.navigate('ClassDetailsInfoTab', { classId, className });
    if (tab === '명단') navigation?.navigate('ClassDetailsMemberTab', { classId, className });
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
            <Text className="text-label text-ink-tertiary mb-xs">{week.weekLabel}</Text>
            <Card>
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
