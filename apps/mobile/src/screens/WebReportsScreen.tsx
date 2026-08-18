import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface WeeklyLesson {
  dateLabel: string;
  note: string;
}

const WEEKLY_LESSONS: WeeklyLesson[] = [
  {
    dateLabel: '8월 4일 (화)',
    note: '자유형 호흡 타이밍에 맞춰 팔 스트로크 리듬을 잡는 연습을 했어요',
  },
  {
    dateLabel: '8월 6일 (목)',
    note: '배영 자세를 유지하며 발차기 추진력을 끌어올리는 데 집중했어요',
  },
];

const FOCUS_POINTS = [
  '호흡은 스트로크 3회마다 한 번으로 리듬 유지하기',
  '입수할 때 팔꿈치를 높게 유지하기',
  '발차기는 무릎이 아닌 고관절부터 시작하기',
  '몸통 롤링을 조금 더 크게 써보기',
  '턴 후 스트림라인 자세 2초 이상 유지하기',
];

export const WebReportsScreen = ({ route }: any) => {
  const {
    instructorName = '박지훈 강사',
    studentName = '김수영님',
    weekRangeLabel = '8월 1주차 (8/3~8/9)',
    weeklyDistanceM = 1200,
    totalMinutes = 100,
    totalKcal = 420,
    attendanceRate = 100,
    attendedCount = 2,
    totalCount = 2,
    lifetimeProgressPercent = 83,
    lifetimeDistanceM = 12400,
    nextMilestoneM = 15000,
    remainingToMilestoneM = 2600,
    aiSummary = '이번 주는 자유형 호흡과 배영 발차기를 중심으로 연습했어요. 호흡 타이밍이 안정되면서 스트로크 사이 리듬이 훨씬 자연스러워졌고, 물속에서 몸에 힘을 덜 주고도 앞으로 나아가는 감각을 익혔어요.',
  } = route?.params ?? {};

  const [rating, setRating] = useState(0);

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="bg-primary-pressed px-lg pt-lg pb-xl">
          <View className="flex-row items-start justify-between mb-lg">
            <View>
              <Text className="text-body-strong text-ink-on-primary mb-xxs">{instructorName}</Text>
              <Text className="text-caption text-ink-on-primary opacity-80">
                {studentName} · {weekRangeLabel}
              </Text>
            </View>
            <Text className="text-2xl">🌊</Text>
          </View>

          <Text className="text-display text-ink-on-primary">
            {weeklyDistanceM.toLocaleString()}
            <Text className="text-title-md"> m</Text>
          </Text>
          <Text className="text-caption text-ink-on-primary opacity-80 mb-lg">이번 주 헤엄친 거리</Text>

          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-title-md text-ink-on-primary">
                {totalMinutes}
                <Text className="text-caption"> 분</Text>
              </Text>
              <Text className="text-legal text-ink-on-primary opacity-70">총 운동시간</Text>
            </View>
            <View>
              <Text className="text-title-md text-ink-on-primary">
                약 {totalKcal}
                <Text className="text-caption"> kcal</Text>
              </Text>
              <Text className="text-legal text-ink-on-primary opacity-70">총 소비칼로리</Text>
            </View>
            <View className="w-20 h-20 rounded-full border-2 border-ink-on-primary items-center justify-center">
              <Text className="text-title-md text-ink-on-primary">{attendanceRate}%</Text>
              <Text className="text-legal text-ink-on-primary opacity-70">
                참여율 {attendedCount}/{totalCount}
              </Text>
            </View>
          </View>
        </View>

        <View className="px-lg -mt-md pb-xl">
          <View className="flex-row items-center bg-canvas-muted rounded-md p-md mb-lg">
            <View className="w-14 h-14 rounded-full border-4 border-primary items-center justify-center mr-md">
              <Text className="text-caption-strong text-primary">{lifetimeProgressPercent}%</Text>
            </View>
            <View className="flex-1">
              <Text className="text-caption text-ink-secondary">수영을 시작한 뒤 지금까지</Text>
              <Text className="text-title-md text-ink">{lifetimeDistanceM.toLocaleString()} m</Text>
              <Text className="text-legal text-ink-tertiary">
                다음 마일스톤 {nextMilestoneM.toLocaleString()}m까지 {remainingToMilestoneM.toLocaleString()}m
              </Text>
            </View>
          </View>

          <Text className="text-title-sm text-ink mb-md">이번 주 수업</Text>
          {WEEKLY_LESSONS.map((lesson) => (
            <View key={lesson.dateLabel} className="flex-row mb-md">
              <Text className="text-primary mr-xs">•</Text>
              <View className="flex-1">
                <Text className="text-body-strong text-primary mb-xxs">{lesson.dateLabel}</Text>
                <Text className="text-sm text-ink-secondary leading-5">{lesson.note}</Text>
              </View>
            </View>
          ))}

          <View className="bg-canvas-muted rounded-md p-md mt-md">
            <View className="flex-row items-center justify-between mb-sm">
              <Text className="text-body-strong text-ink">이번 주 프로그램</Text>
              <View className="bg-primary-subtle rounded-md px-xs py-0.5">
                <Text className="text-legal text-primary">AI가 정리했어요</Text>
              </View>
            </View>
            <Text className="text-sm text-ink-secondary leading-5 mb-md">{aiSummary}</Text>
            <View className="h-px bg-hairline mb-md" />
            <Text className="text-caption-strong text-ink mb-sm">앞으로 이런 점을 신경 써보세요</Text>
            {FOCUS_POINTS.map((point, index) => (
              <View key={point} className="flex-row items-start mb-xs">
                <View className="w-5 h-5 rounded-full bg-primary items-center justify-center mr-xs mt-0.5">
                  <Text className="text-legal text-ink-on-primary font-bold">{index + 1}</Text>
                </View>
                <Text className="flex-1 text-sm text-ink-secondary leading-5">{point}</Text>
              </View>
            ))}
          </View>

          <View className="items-center mt-xl">
            <Text className="text-body-strong text-ink mb-md">오늘 수업은 어떠셨어요?</Text>
            <View className="flex-row gap-sm mb-sm">
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} onPress={() => setRating(star)} hitSlop={8}>
                  <Text className={`text-2xl ${star <= rating ? 'text-primary' : 'text-hairline-border-strong'}`}>
                    {star <= rating ? '★' : '☆'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text className="text-legal text-ink-tertiary text-center">
              별을 누르면 보내는 사람 정보 없이{'\n'}익명으로 전달돼요
            </Text>
          </View>

          <Text className="text-caption-strong text-primary text-center mt-xl">Growdy</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
