import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ScreenLayout } from '../../../components/ScreenLayout';
import { Card } from '../../../components/card/Card';

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
  const [isSending, setIsSending] = useState(false);

  const toggleIncluded = (id: string) => {
    setIncludedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  // TODO: 리포트 실제 내용을 보여주는 미리보기 화면 미제작 — 목업 받으면 연결 필요
  const handlePreviewPress = () => {};

  const handleSend = () => {
    setIsSending(true);
  };

  useEffect(() => {
    if (!isSending) return;
    // TODO: 임시 타이머. 실제 리포트 발송 API 연동 시 응답 완료 시점으로 교체 필요
    const timer = setTimeout(() => {
      navigation?.navigate('WebReports', { classId, className, weekRangeLabel: weekLabel });
    }, 2000);
    return () => clearTimeout(timer);
  }, [isSending, navigation, classId, className, weekLabel]);

  return (
    <ScreenLayout
      title={`${weekLabel} 리포트`}
      showBackButton
      footer={
        isSending ? (
          <View className="bg-primary rounded-md py-4 items-center justify-center">
            <Text className="text-ink-on-primary text-button">{includedIds.length}명에게 보내기</Text>
          </View>
        ) : (
          <Pressable onPress={handleSend} className="bg-primary rounded-md py-4 items-center justify-center">
            <Text className="text-ink-on-primary text-button">{includedIds.length}명에게 보내기</Text>
          </Pressable>
        )
      }
    >
      <View className="pt-md pb-xl">
        {/*베타테스트 제외 기능 안내*/}
        <Card variant="notice" className="bg-status-danger-subtle flex-row items-center justify-between px-md py-md mb-lg">
          <View>
            <Text className="text-body-strong text-status-danger mb-xxs">ⓘ 베타테스트에서는 제외된 기능이예요.</Text>
            <Text className="text-caption text-ink-secondary">     화면은 이해를 돕기 위한 샘플 데이터예요.</Text>
          </View>
        </Card>

        {isSending ? (
          <Card variant="muted" className="flex-row items-center justify-between px-md py-md mb-lg">
            <View>
              <Text className="text-body-strong text-ink mb-xxs">리포트를 만들고 있어요</Text>
              <Text className="text-caption text-ink-secondary">잠시만 기다려 주세요</Text>
            </View>
            <Text className="text-xl">🌙</Text>
          </Card>
        ) : (
          <Card
            variant="notice"
            onPress={handlePreviewPress}
            className="flex-row items-center justify-between px-md py-md mb-lg"
          >
            <View>
              <Text className="text-body-strong text-ink mb-xxs">리포트 미리보기</Text>
              <Text className="text-caption text-ink-secondary">
                {weekLabel} ({range}) · {lessonCount}개 수업
              </Text>
            </View>
            <Text className="text-ink-tertiary">›</Text>
          </Card>
        )}

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
              {isSending ? (
                <View className="w-7 h-7 rounded-md border items-center justify-center bg-primary border-primary">
                  <Text className="text-white text-xs font-bold">✓</Text>
                </View>
              ) : (
                <Pressable
                  onPress={() => toggleIncluded(member.id)}
                  className={`w-7 h-7 rounded-md border items-center justify-center ${
                    included ? 'bg-primary border-primary' : 'border-hairline-border-strong'
                  }`}
                >
                  {included && <Text className="text-white text-xs font-bold">✓</Text>}
                </Pressable>
              )}
            </Card>
          );
        })}
      </View>
    </ScreenLayout>
  );
};
