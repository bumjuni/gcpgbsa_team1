import React, { useState, useTransition } from 'react';
import { View, Text } from 'react-native';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Button } from '../../components/button/Button';
import { Card } from '../../components/card/Card';
import { ConfirmModal } from '../../components/ConfirmModal';

interface LessonSetItem {
  name: string;
  description: string;
}

interface LessonSection {
  title: string;
  items: LessonSetItem[];
}

const DEFAULT_SECTIONS: LessonSection[] = [
  {
    title: 'Pre-Set',
    items: [
      { name: '100m 자유형', description: '멈추지 않고 편하게' },
      { name: '100m 배영', description: '편하게' },
    ],
  },
  {
    title: 'Main-Set',
    items: [
      { name: '4×25m 자유형 킥', description: '강도 점점 높이며 마지막은 대쉬' },
      { name: '2×100m 자유형 풀', description: '풀부이 끼고' },
      { name: '피라미드 25·50·75·75·50·25m 자유형', description: '자신있는 영법으로' },
      { name: '4×25m 접영 (90%)', description: '파워풀하게' },
    ],
  },
  {
    title: 'Post-Set',
    items: [{ name: '100m 자유형', description: '천천히' }],
  },
];

export const LessonPlanCompleteScreen = ({ navigation, route }: any) => {
  const {
    date = '8월 11일 (화)',
    time = '오후 7:00',
    totalDistance = 1000,
    sections = DEFAULT_SECTIONS,
  } = route?.params ?? {};

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [, startTransition] = useTransition();

  const toggleItem = (key: string) => {
    startTransition(() => {
      setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
    });
  };

  const handleFinishClass = () => {
    setIsFinishModalOpen(true);
  };

  const handleConfirmFinish = () => {
    setIsFinishModalOpen(false);
    navigation?.navigate('ClassListFilled');
  };

  return (
    <>
      <ScreenLayout
        title="수업 진행"
        showBackButton
        footer={<Button label="수업 종료하기" onPress={handleFinishClass} />}
      >
        <View className="pt-md pb-xl">
          <Text className="text-base font-bold text-ink mb-xxs">
            {date} {time} · 총 {totalDistance.toLocaleString()}m
          </Text>
          <Text className="text-caption text-ink-tertiary mb-lg">
            *실제로 진행한 수업에 체크하시면 돼요
          </Text>

          {sections.map((section: LessonSection) => (
            <View key={section.title} className="mb-lg">
              <Card>
                <Card.Header title={section.title} />
                {section.items.map((item, index) => {
                  const key = `${section.title}-${index}`;
                  const checked = Boolean(checkedItems[key]);
                  return (
                    <Card.Item
                      key={key}
                      title={item.name}
                      description={item.description}
                      isLast={index === section.items.length - 1}
                      onPress={() => toggleItem(key)}
                      leftElement={
                        <View
                          className={`w-6 h-6 rounded-sm border items-center justify-center ${
                            checked ? 'bg-primary border-primary' : 'border-hairline-border-strong'
                          }`}
                        >
                          {checked && <Text className="text-white text-xs font-bold">✓</Text>}
                        </View>
                      }
                    />
                  );
                })}
              </Card>
            </View>
          ))}
        </View>
      </ScreenLayout>

      <ConfirmModal
        visible={isFinishModalOpen}
        title="수업이 끝나셨나요?"
        description="종료하면 오늘 수업 내용이 확정돼요. 확정 후에는 출석을 바꿀 수 없어요."
        confirmText="종료하기"
        cancelText="아직 안끝났어요"
        onConfirm={handleConfirmFinish}
        onCancel={() => setIsFinishModalOpen(false)}
      />
    </>
  );
};
