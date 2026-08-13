import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
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

export const ClassDetailsReportSendScreen = ({ navigation, route }: any) => {
  const {
    classId,
    className = '화요일 저녁 초급반',
    weekLabel = '8월 1주차',
    range = '8/3~8/9',
    lessonCount = 2,
  } = route?.params ?? {};

  const [includedIds, setIncludedIds] = useState<string[]>(MEMBERS.map((m) => m.id));

  const toggleIncluded = (id: string) => {
    setIncludedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  // TODO: 리포트 실제 내용을 보여주는 미리보기 화면 미제작 — 목업 받으면 연결 필요
  const handlePreviewPress = () => {};

  const handleSend = () => {
    navigation?.navigate('ClassDetailsReportSendLoading', {
      classId,
      className,
      weekLabel,
      range,
      targetCount: includedIds.length,
    });
  };

  return (
    <ScreenLayout
      title={`${weekLabel} 리포트`}
      showBackButton
      footer={
        <Pressable onPress={handleSend} className="bg-primary rounded-md py-4 items-center justify-center">
          <Text className="text-ink-on-primary text-button">{includedIds.length}명에게 보내기</Text>
        </Pressable>
      }
    >
      <View className="pt-md pb-xl">
        <Card onPress={handlePreviewPress} className="flex-row items-center justify-between px-md py-md mb-lg">
          <View>
            <Text className="text-body-strong text-ink mb-xxs">리포트 미리보기</Text>
            <Text className="text-caption text-ink-secondary">
              {weekLabel} ({range}) · {lessonCount}개 수업
            </Text>
          </View>
          <Text className="text-ink-tertiary">›</Text>
        </Card>

        <Text className="text-base font-bold text-ink mb-sm">발송 대상 ({includedIds.length}명)</Text>
        {MEMBERS.map((member) => {
          const included = includedIds.includes(member.id);
          return (
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
              <Pressable
                onPress={() => toggleIncluded(member.id)}
                className={`w-7 h-7 rounded-md border items-center justify-center ${
                  included ? 'bg-primary border-primary' : 'border-hairline-border-strong'
                }`}
              >
                {included && <Text className="text-white text-xs font-bold">✓</Text>}
              </Pressable>
            </Card>
          );
        })}
      </View>
    </ScreenLayout>
  );
};
