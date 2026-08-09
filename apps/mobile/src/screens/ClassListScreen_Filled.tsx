import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { Button } from '../components/button/Button';
import { Card } from '../components/card/Card';

interface TodayClass {
  id: string;
  className: string;
  statusLabel: string;
  statusType: 'confirmed' | 'inProgress';
  timeLabel: string;
  subLabel: string;
}

interface ClassSummary {
  id: string;
  className: string;
  planStatusLabel: string;
  planStatusType: 'done' | 'notStarted' | 'inProgress';
  infoLabel: string;
  nextClassLabel: string;
}

const TODAY_CLASSES: TodayClass[] = [
  {
    id: '1',
    className: '수요일 오전 성인반',
    statusLabel: '확정',
    statusType: 'confirmed',
    timeLabel: '오전 10:00',
    subLabel: '출석반 현황',
  },
  {
    id: '2',
    className: '수요일 저녁 어린이반',
    statusLabel: '진행중',
    statusType: 'inProgress',
    timeLabel: '오후 5:00',
    subLabel: '8/6 수업안 아직 안 만들었어요',
  },
];

const CLASS_LIST: ClassSummary[] = [
  {
    id: '1',
    className: '수요일 오전 성인반',
    planStatusLabel: '수업안 완료',
    planStatusType: 'done',
    infoLabel: '수업안 완료',
    nextClassLabel: '다음 8월 12일 (수) 오전 10:00',
  },
  {
    id: '2',
    className: '화요일 저녁 초급반',
    planStatusLabel: '수업안 작성전',
    planStatusType: 'notStarted',
    infoLabel: '8/10 · 초급',
    nextClassLabel: '다음 8월 12일 (수) 오후 7:00',
  },
  {
    id: '3',
    className: '목요일 오전 마스터즈반',
    planStatusLabel: '수업안 완료',
    planStatusType: 'done',
    infoLabel: '5/8명 · 마스터즈',
    nextClassLabel: '다음 8월 13일 (목) 오전 10:00',
  },
  {
    id: '4',
    className: '수요일 저녁 어린이반',
    planStatusLabel: '수업안 작성중',
    planStatusType: 'inProgress',
    infoLabel: '6/8명 · 어린이',
    nextClassLabel: '다음 8월 8일 (수) 오후 5:00',
  },
];

const todayStatusStyles: Record<TodayClass['statusType'], { badge: string; text: string }> = {
  confirmed: { badge: 'bg-status-presnet_subtle', text: 'text-status-present' },
  inProgress: { badge: 'bg-primary-subtle', text: 'text-primary' },
};

const planStatusStyles: Record<ClassSummary['planStatusType'], { badge: string; text: string }> = {
  done: { badge: 'bg-status-presnet_subtle', text: 'text-status-present' },
  notStarted: { badge: 'bg-surface-muted', text: 'text-ink-teriary' },
  inProgress: { badge: 'bg-primary-subtle', text: 'text-primary' },
};

export const ClassListScreen_Filled = ({ navigation }: any) => {
  const handleAddClass = () => {
    navigation?.navigate('ClassRegister');
  };

  const handleClassPress = (classId: string) => {
    navigation?.navigate('ClassDetail', { classId });
  };


  return (
    <ScreenLayout title="내 반 목록" footer={<Button label="반 등록하기" onPress={handleAddClass} />}>
      <View className="pt-md pb-xl">
        <Text className="text-lg font-bold text-ink mb-md">오늘의 수업 {TODAY_CLASSES.length}개</Text>

        {TODAY_CLASSES.map((item) => {
          const statusStyle = todayStatusStyles[item.statusType];
          return (
            <Card
              key={item.id}
              variant='default'
              onPress={() => handleClassPress(item.id)}
            >
              <View className="flex-row items-center justify-between mb-xxs">
                <Text className="text-title-sm text-ink">{item.className}</Text>
                <View className={`px-xs py-xxs rounded-sm ${statusStyle.badge}`}>
                  <Text className={`text-[10px] font-bold ${statusStyle.text}`}>{item.statusLabel}</Text>
                </View>
              </View>
              <Text className="text-label text-ink-teriary">
                {item.timeLabel} · {item.subLabel}
              </Text>
            </Card>
          );
        })}

        <Text className="text-lg font-bold text-ink mb-md">전체 반</Text>

        {CLASS_LIST.map((item) => {
          const statusStyle = planStatusStyles[item.planStatusType];
          return (
            <Card
              key={item.id}
              variant='default'
              onPress={() => handleClassPress(item.id)}
              className="border border-surface-hairline rounded-md px-md py-sm mb-md"
            >
              <View className="flex-row items-center justify-between mb-xxs">
                <Text className="text-base font-bold text-ink">{item.className}</Text>
                <View className={`px-xs py-xxs rounded-sm ${statusStyle.badge}`}>
                  <Text className={`text-[10px] font-bold ${statusStyle.text}`}>{item.planStatusLabel}</Text>
                </View>
              </View>
              <Text className="text-xs text-ink-teriary">
                {item.infoLabel} · {item.nextClassLabel}
              </Text>
            </Card>
          );
        })}
      </View>
    </ScreenLayout>
  );
};
