import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, LayoutChangeEvent } from 'react-native';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Button } from '../../components/button/Button';
import { Card } from '../../components/card/Card';

type ClassDetailsTab = '수업진행' | '반정보' | '명단' | '리포트';

const TABS: ClassDetailsTab[] = ['수업진행', '반정보', '명단', '리포트'];

export const ClassDetailsLessonTabEmptyScreen = ({ navigation, route }: any) => {
  const {
    className = '화요일 저녁 초급반',
    classId,
    scheduleLabel = '매주 화, 목 오후 7:00',
  } = route?.params ?? {};
  const [tabRowWidth, setTabRowWidth] = useState(0);
  const [activeTabLayout, setActiveTabLayout] = useState({ x: 0, width: 0 });

  const handleTabPress = (tab: ClassDetailsTab) => {
    if (tab === '수업진행') return;
    if (tab === '반정보') navigation?.navigate('ClassDetailsInfoTab', { classId, className });
    if (tab === '명단') navigation?.navigate('ClassDetailsMemberTab', { classId, className });
    if (tab === '리포트') navigation?.navigate('ClassDetailsReportTab', { classId, className });
  };

  const handleCreateLessonPlan = () => {
    navigation?.navigate('LessonPlanCreate', { classId, className });
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
          <Text className="text-title-sm text-ink mb-xxs">{scheduleLabel}</Text>
          <Text className="text-caption text-ink-secondary">아직 수업안을 만들지 않았어요</Text>
        </Card>
        <Button label="수업안 만들기" onPress={handleCreateLessonPlan} />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Text className="text-base font-bold text-ink mb-sm">종료된 수업</Text>
        <Card variant="muted" className="items-center py-lg">
          <Text className="text-sm text-ink-secondary">아직 종료된 수업이 없어요</Text>
        </Card>
        <View className="pb-xl" />
      </ScrollView>
    </ScreenLayout>
  );
};
