import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useClassStore } from '../stores/useClassStore';
import { enrollmentApi } from '../api/enrollment';
import { reportApi, WeeklyReportResponse } from '../api/report';
import { formatDateToYMD } from '../utils/classSchedule';

const formatWeekLabel = (weekStart: string, weekEnd: string): string => {
  const [, startMonth, startDay] = weekStart.split('-').map(Number);
  const [, endMonth, endDay] = weekEnd.split('-').map(Number);
  const weekOfMonth = Math.ceil(startDay / 7);
  return `${startMonth}월 ${weekOfMonth}주차 (${startMonth}/${startDay}~${endMonth}/${endDay})`;
};

export const WebReportsScreen = () => {
  const currentClass = useClassStore((s) => s.currentClass);

  const [report, setReport] = useState<WeeklyReportResponse | null>(null);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [reportDate, setReportDate] = useState<string>('');
  const [rating, setRating] = useState(0);

  useEffect(() => {
    const fetchReport = async () => {
      if (!currentClass) return;
      try {
        const enrollments = await enrollmentApi.getEnrollments(currentClass.id);
        const firstStudentId = enrollments[0]?.student.id;
        if (!firstStudentId) return;

        const date = formatDateToYMD(new Date());
        const result = await reportApi.getWeeklyReport(currentClass.id, firstStudentId, date);

        setStudentId(firstStudentId);
        setReportDate(date);
        setReport(result);
        setRating(result.rating ?? 0);
      } catch (error) {
        console.error('웹 리포트 조회 실패:', error);
      }
    };
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentClass?.id]);

  const handleRate = async (star: number) => {
    setRating(star);
    if (!currentClass || !studentId || !reportDate) return;
    try {
      await reportApi.submitRating(currentClass.id, studentId, reportDate, star);
    } catch (error) {
      console.error('별점 제출 실패:', error);
    }
  };

  if (!report) return null;

  const weekRangeLabel = formatWeekLabel(report.week_start, report.week_end);

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="bg-primary-pressed px-lg pt-lg pb-xl">
          <View className="flex-row items-start justify-between mb-lg">
            <Text className="text-caption text-ink-on-primary opacity-80">{weekRangeLabel}</Text>
            <Text className="text-2xl">🌊</Text>
          </View>

          <Text className="text-display text-ink-on-primary">
            {report.week_distance_m.toLocaleString()}
            <Text className="text-title-md"> m</Text>
          </Text>
          <Text className="text-caption text-ink-on-primary opacity-80 mb-lg">이번 주 헤엄친 거리</Text>

          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-title-md text-ink-on-primary">
                {report.week_duration_min}
                <Text className="text-caption"> 분</Text>
              </Text>
              <Text className="text-legal text-ink-on-primary opacity-70">총 운동시간</Text>
            </View>
            <View>
              <Text className="text-title-md text-ink-on-primary">
                약 {report.week_calorie_kcal}
                <Text className="text-caption"> kcal</Text>
              </Text>
              <Text className="text-legal text-ink-on-primary opacity-70">총 소비칼로리</Text>
              <Text className="text-legal text-ink-on-primary opacity-70">{report.calorie_caption}</Text>
            </View>
          </View>
        </View>

        <View className="px-lg -mt-md pb-xl">
          <View className="flex-row items-center bg-canvas-muted rounded-md p-md mb-lg">
            <View className="flex-1">
              <Text className="text-caption text-ink-secondary">수영을 시작한 뒤 지금까지</Text>
              <Text className="text-title-md text-ink">{report.cumulative_distance_m.toLocaleString()} m</Text>
            </View>
          </View>

          {report.session_focus_list.length > 0 && (
            <>
              <Text className="text-title-sm text-ink mb-md">이번 주 수업</Text>
              {report.session_focus_list.map((lesson) => (
                <View key={lesson.date} className="flex-row mb-md">
                  <Text className="text-primary mr-xs">•</Text>
                  <View className="flex-1">
                    <Text className="text-body-strong text-primary mb-xxs">{lesson.date}</Text>
                    <Text className="text-sm text-ink-secondary leading-5">{lesson.note}</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {report.apply_tip && report.key_points && (
            <View className="bg-canvas-muted rounded-md p-md mt-md">
              <View className="flex-row items-center justify-between mb-sm">
                <Text className="text-body-strong text-ink">이번 주 프로그램</Text>
                <View className="bg-primary-subtle rounded-md px-xs py-0.5">
                  <Text className="text-legal text-primary">AI가 정리했어요</Text>
                </View>
              </View>
              <Text className="text-sm text-ink-secondary leading-5 mb-md">{report.apply_tip}</Text>
              <View className="h-px bg-hairline mb-md" />
              <Text className="text-caption-strong text-ink mb-sm">앞으로 이런 점을 신경 써보세요</Text>
              {report.key_points.map((point, index) => (
                <View key={point} className="flex-row items-start mb-xs">
                  <View className="w-5 h-5 rounded-full bg-primary items-center justify-center mr-xs mt-0.5">
                    <Text className="text-legal text-ink-on-primary font-bold">{index + 1}</Text>
                  </View>
                  <Text className="flex-1 text-sm text-ink-secondary leading-5">{point}</Text>
                </View>
              ))}
            </View>
          )}

          <View className="items-center mt-xl">
            <Text className="text-body-strong text-ink mb-md">오늘 수업은 어떠셨어요?</Text>
            <View className="flex-row gap-sm mb-sm">
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} onPress={() => handleRate(star)} hitSlop={8}>
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
