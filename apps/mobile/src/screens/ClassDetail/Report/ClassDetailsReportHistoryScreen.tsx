import React from 'react';
import { View, Text } from 'react-native';
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

const STAR_COUNT = 5;

export const ClassDetailsReportHistoryScreen = ({ route }: any) => {
  const {
    weekLabel = '7월 2주차',
    range = '7/13~7/19',
    lessonCount = 2,
    responseCount = 4,
    averageRating = 4.3,
  } = route?.params ?? {};

  const filledStars = Math.round(averageRating);

  // TODO: 리포트 실제 내용을 보여주는 미리보기 화면 미제작 — 목업 받으면 연결 필요
  const handlePreviewPress = () => {};

  return (
    <ScreenLayout title={`${weekLabel} 리포트`} showBackButton>
      <View className="pt-md pb-xl">
        <Card onPress={handlePreviewPress} className="flex-row items-center justify-between px-md py-md mb-lg">
          <View>
            <Text className="text-body-strong text-ink mb-xxs">보낸 리포트 확인하기</Text>
            <Text className="text-caption text-ink-secondary">
              {weekLabel} ({range}) · {lessonCount}개 수업
            </Text>
          </View>
          <Text className="text-ink-tertiary">›</Text>
        </Card>

        <Card variant="default" className="px-md py-md mb-lg">
          <Text className="text-body-strong text-ink mb-xxs">수강생들의 별점이에요</Text>
          <Text className="text-caption text-ink-tertiary mb-sm">{responseCount}명 응답</Text>
          <View className="flex-row items-center">
            {Array.from({ length: STAR_COUNT }).map((_, index) => (
              <Text
                key={index}
                className={`text-lg mr-0.5 ${index < filledStars ? 'text-primary' : 'text-hairline-border-strong'}`}
              >
                ★
              </Text>
            ))}
            <Text className="text-body-strong text-ink ml-xs">{averageRating.toFixed(1)}</Text>
          </View>
        </Card>

        <Text className="text-base font-bold text-ink mb-sm">보낸 명단 ({MEMBERS.length}명)</Text>
        {MEMBERS.map((member) => (
          <Card key={member.id} className="flex-row items-center px-md py-sm mb-md">
            <View className="w-xl h-xl rounded-full bg-status-present-subtle items-center justify-center mr-sm">
              <Text className="text-sm font-bold text-status-present">✓</Text>
            </View>
            <View>
              <Text className="text-body-strong text-ink">{member.name}</Text>
              <Text className="text-caption text-ink-secondary mt-0.5">
                {member.genderLabel} · {member.age}세
              </Text>
            </View>
          </Card>
        ))}
      </View>
    </ScreenLayout>
  );
};
