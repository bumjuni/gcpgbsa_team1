import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { Card } from '../components/card/Card';

interface ReportMember {
  id: string;
  name: string;
  genderLabel: string;
  age: number;
}

const MEMBERS: ReportMember[] = [
  { id: '1', name: '김수영', genderLabel: '남', age: 8 },
  { id: '2', name: '이도윤', genderLabel: '여', age: 9 },
  { id: '3', name: '박서준', genderLabel: '남', age: 7 },
  { id: '4', name: '최윤아', genderLabel: '여', age: 10 },
  { id: '5', name: '정하은', genderLabel: '남', age: 8 },
  { id: '6', name: '강민준', genderLabel: '여', age: 9 },
  { id: '7', name: '조서연', genderLabel: '남', age: 6 },
  { id: '8', name: '윤지호', genderLabel: '여', age: 11 },
];

export const ClassDetailsReportSendLoadingScreen = ({ navigation, route }: any) => {
  const {
    classId,
    className = '화요일 저녁 초급반',
    weekLabel = '8월 1주차',
    targetCount = MEMBERS.length,
  } = route?.params ?? {};

  useEffect(() => {
    // TODO: 임시 타이머. 실제 리포트 발송 API 연동 시 응답 완료 시점으로 교체 필요
    const timer = setTimeout(() => {
      navigation?.navigate('WebReports', { classId, className, weekRangeLabel: weekLabel });
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigation, classId, className, weekLabel]);

  return (
    <ScreenLayout
      title={`${weekLabel} 리포트`}
      showBackButton
      footer={
        <View className="bg-primary rounded-md py-4 items-center justify-center">
          <Text className="text-ink-on-primary text-button">{targetCount}명에게 보내기</Text>
        </View>
      }
    >
      <View className="pt-md pb-xl">
        <Card variant="muted" className="flex-row items-center justify-between px-md py-md mb-lg">
          <View>
            <Text className="text-body-strong text-ink mb-xxs">리포트를 만들고 있어요</Text>
            <Text className="text-caption text-ink-secondary">잠시만 기다려 주세요</Text>
          </View>
          <Text className="text-xl">🌙</Text>
        </Card>

        <Text className="text-base font-bold text-ink mb-sm">발송 대상 ({targetCount}명)</Text>
        {MEMBERS.map((member) => (
          <Card key={member.id} className="flex-row items-center justify-between px-md py-sm mb-md">
            <View className="flex-row items-center flex-1">
              <View className="w-xl h-xl rounded-full bg-status-present-subtle items-center justify-center mr-sm">
                <Text className="text-sm font-bold text-status-present">✓</Text>
              </View>
              <View>
                <Text className="text-body-strong text-ink">{member.name}</Text>
                <Text className="text-caption text-ink-secondary mt-0.5">
                  {member.genderLabel} · {member.age}세
                </Text>
              </View>
            </View>
            <View className="w-7 h-7 rounded-md border items-center justify-center bg-primary border-primary">
              <Text className="text-white text-xs font-bold">✓</Text>
            </View>
          </Card>
        ))}
      </View>
    </ScreenLayout>
  );
};
