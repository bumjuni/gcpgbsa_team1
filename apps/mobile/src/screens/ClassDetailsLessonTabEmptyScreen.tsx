import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { Button } from '../components/button/Button';
import { Card } from '../components/card/Card';

type ClassDetailsTab = '수업진행' | '반정보' | '명단' | '리포트';

const TABS: ClassDetailsTab[] = ['수업진행', '반정보', '명단', '리포트'];

export const ClassDetailsLessonTabEmptyScreen = ({ navigation, route }: any) => {
  const {
    className = '화요일 저녁 초급반',
    classId,
    scheduleLabel = '매주 화, 목 오후 7:00',
  } = route?.params ?? {};

  const handleTabPress = (tab: ClassDetailsTab) => {
    if (tab === '수업진행') return;
    if (tab === '반정보') navigation?.navigate('ClassDetailsInfoTab', { classId, className });
    if (tab === '명단') navigation?.navigate('ClassDetailsMemberTab', { classId, className });
  };

  const handleCreateLessonPlan = () => {
    navigation?.navigate('LessonPlanCreate', { classId, className });
  };

  return (
    <ScreenLayout title={className} showBackButton>
      <View className="flex-row border-b border-hairline mb-lg">
        {TABS.map((tab) => {
          const active = tab === '수업진행';
          return (
            <Pressable key={tab} onPress={() => handleTabPress(tab)} className="mr-lg pb-sm">
              <Text className={`text-body-strong ${active ? 'text-primary' : 'text-ink-secondary'}`}>
                {tab}
              </Text>
              {active && <View className="h-0.5 bg-primary mt-xs" />}
            </Pressable>
          );
        })}
      </View>

      <View className="pb-xl">
        <Text className="text-base font-bold text-ink mb-sm">진행 예정 수업</Text>
        <Card variant="default" className="px-md py-md mb-lg">
          <Text className="text-title-sm text-ink mb-xxs">{scheduleLabel}</Text>
          <Text className="text-caption text-ink-secondary">아직 수업안을 만들지 않았어요</Text>
        </Card>
        <Button label="수업안 만들기" onPress={handleCreateLessonPlan} className="mb-lg" />

        <Text className="text-base font-bold text-ink mb-sm">종료된 수업</Text>
        <Card variant="muted" className="items-center py-lg">
          <Text className="text-sm text-ink-secondary">아직 종료된 수업이 없어요</Text>
        </Card>
      </View>
    </ScreenLayout>
  );
};
