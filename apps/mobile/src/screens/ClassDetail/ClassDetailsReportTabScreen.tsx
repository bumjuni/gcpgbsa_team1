import React, { useState } from 'react';
import { View, Text, Pressable, LayoutChangeEvent } from 'react-native';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Card } from '../../components/card/Card';

type ClassDetailsTab = '수업진행' | '반정보' | '명단' | '리포트';

const TABS: ClassDetailsTab[] = ['수업진행', '반정보', '명단', '리포트'];

interface PendingReport {
  id: string;
  weekLabel: string;
  range: string;
  targetCount: number;
}

interface CompletedReport {
  id: string;
  weekLabel: string;
  range: string;
  statusText: string;
  hasFeedback: boolean;
}

const PENDING_REPORTS: PendingReport[] = [
  { id: '2026-w32', weekLabel: '8월 1주차', range: '8/3~8/9', targetCount: 8 },
  { id: '2026-w30', weekLabel: '7월 3주차', range: '7/20~7/26', targetCount: 8 },
];

const COMPLETED_REPORTS: CompletedReport[] = [
  {
    id: '2026-w31',
    weekLabel: '7월 4주차',
    range: '7/27~8/2',
    statusText: '8월 2일에 8명에게 보냈어요',
    hasFeedback: false,
  },
  {
    id: '2026-w29',
    weekLabel: '7월 2주차',
    range: '7/13~7/19',
    statusText: '수강생 피드백이 1건 도착했어요.',
    hasFeedback: true,
  },
];

export const ClassDetailsReportTabScreen = ({ navigation, route }: any) => {
  const { classId, className = '화요일 저녁 초급반' } = route?.params ?? {};
  const [tabRowWidth, setTabRowWidth] = useState(0);
  const [activeTabLayout, setActiveTabLayout] = useState({ x: 0, width: 0 });

  const handleTabPress = (tab: ClassDetailsTab) => {
    if (tab === '리포트') return;
    if (tab === '수업진행') navigation?.navigate('ClassDetailsLessonTab', { classId, className });
    if (tab === '반정보') navigation?.navigate('ClassDetailsInfoTab', { classId, className });
    if (tab === '명단') navigation?.navigate('ClassDetailsMemberTab', { classId, className });
  };

  const handleSendReport = (report: PendingReport) => {
    navigation?.navigate('ClassDetailsReportSend', {
      classId,
      className,
      weekLabel: report.weekLabel,
      range: report.range,
      targetCount: report.targetCount,
    });
  };

  const handleViewHistory = (report: CompletedReport) => {
    navigation?.navigate('ClassDetailsReportHistory', {
      classId,
      className,
      weekLabel: report.weekLabel,
      range: report.range,
    });
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
    <ScreenLayout title={className} showBackButton>
      <View
        className="relative -mx-md px-md pt-md flex-row justify-between border-b border-hairline mb-md"
        onLayout={handleTabRowLayout}
      >
        {TABS.map((tab) => {
          const active = tab === '리포트';
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

      <View className="pb-xl">
        <View className="flex-row items-start bg-primary-subtle rounded-md px-md py-sm mb-lg">
          <Text className="text-primary mr-xs">ⓘ</Text>
          <Text className="flex-1 text-caption text-primary">
            한 주의 수업을 모두 종료해야 리포트를 보낼 수 있어요.
          </Text>
        </View>

        <Text className="text-base font-bold text-ink mb-sm">발송 대기중인 리포트</Text>
        {PENDING_REPORTS.map((report) => (
          <Card
            key={report.id}
            variant="default"
            className="border border-primary px-md py-md mb-md flex-row items-center justify-between"
          >
            <View>
              <Text className="text-title-sm text-ink mb-xxs">
                {report.weekLabel} ({report.range})
              </Text>
              <Text className="text-caption text-ink-secondary">대상 {report.targetCount}명</Text>
            </View>
            <Pressable onPress={() => handleSendReport(report)} className="bg-primary rounded-md px-md py-sm">
              <Text className="text-ink-on-primary text-button-sm">발송하기</Text>
            </Pressable>
          </Card>
        ))}

        <Text className="text-base font-bold text-ink mb-sm mt-lg">발송 완료된 리포트</Text>
        {COMPLETED_REPORTS.map((report) => (
          <Card key={report.id} onPress={() => handleViewHistory(report)} className="relative px-md py-md mb-md">
            {report.hasFeedback && (
              <View className="absolute top-3 right-3 w-2 h-2 rounded-full bg-status-present" />
            )}
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-sm">
                <Text className="text-title-sm text-ink mb-xxs">
                  {report.weekLabel} ({report.range})
                </Text>
                <Text className={`text-caption ${report.hasFeedback ? 'text-status-present' : 'text-ink-secondary'}`}>
                  {report.statusText}
                </Text>
              </View>
              <Text className="text-caption text-ink-tertiary">발송완료 ›</Text>
            </View>
          </Card>
        ))}
      </View>
    </ScreenLayout>
  );
};
