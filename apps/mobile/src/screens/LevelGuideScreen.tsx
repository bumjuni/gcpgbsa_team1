import React from 'react';
import { Modal, View, Text, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { Button } from '../components/button/Button';
import { Card } from '../components/card/Card';
import { Badge } from '../components/badge/Badge';

interface StrokeItem {
  label: string;
  achieved: boolean;
}

interface LevelGuideItem {
  key: string;
  description: string;
  strokes: StrokeItem[];
}

const LEVEL_GUIDES: LevelGuideItem[] = [
  {
    key: '신규',
    description: '등록한 지 1개월이 안 됐어요',
    strokes: [
      { label: '자유형', achieved: false },
      { label: '배영', achieved: false },
      { label: '평영', achieved: false },
      { label: '접영', achieved: false },
    ],
  },
  {
    key: '초급',
    description: '자유형과 배영을 할 수 있어요',
    strokes: [
      { label: '자유형', achieved: true },
      { label: '배영', achieved: true },
      { label: '평영', achieved: false },
      { label: '접영', achieved: false },
    ],
  },
  {
    key: '중급',
    description: '초급 실력에 평영까지 할 수 있어요',
    strokes: [
      { label: '자유형', achieved: true },
      { label: '배영', achieved: true },
      { label: '평영', achieved: true },
      { label: '접영', achieved: false },
    ],
  },
  {
    key: '상급',
    description: '네 가지 영법을 모두 할 수 있어요',
    strokes: [
      { label: '자유형', achieved: true },
      { label: '배영', achieved: true },
      { label: '평영', achieved: true },
      { label: '접영', achieved: true },
    ],
  },
  {
    key: '마스터즈',
    description: '네 가지 영법을 능숙하게 구사해요',
    strokes: [
      { label: '자유형', achieved: true },
      { label: '배영', achieved: true },
      { label: '평영', achieved: true },
      { label: '접영', achieved: true },
    ],
  },
];

export const LevelGuideScreen = ({ navigation }: any) => {
  const handleConfirm = () => {
    navigation?.goBack();
  };

  return (
    <Modal transparent visible animationType="slide" onRequestClose={handleConfirm}>
      <TouchableWithoutFeedback onPress={handleConfirm}>
        <View className="flex-1 bg-ink/60 justify-end">
          <TouchableWithoutFeedback>
            <View className="bg-canvas rounded-t-2xl pt-sm" style={{ maxHeight: '88%' }}>
              <View className="w-10 h-1 rounded-full bg-hairline-border-strong self-center mb-md" />

              <View className="px-md">
                <Text className="text-title-lg font-bold text-ink mb-xxs">수준 안내</Text>
                <Text className="text-sm text-ink-secondary mb-md">
                  반의 평균 실력에 가장 가까운 단계를 선택해주세요
                </Text>
              </View>

              <ScrollView
                className="px-md"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 24 }}
              >
                {LEVEL_GUIDES.map((level) => (
                  <Card key={level.key} variant="default" className="px-md py-sm mb-sm">
                    <Text className="text-base font-bold text-ink mb-xxs">{level.key}</Text>
                    <Text className="text-sm text-ink-secondary mb-xs">{level.description}</Text>
                    <View className="flex-row flex-wrap gap-xs">
                      {level.strokes.map((stroke) => (
                        <Badge
                          key={stroke.label}
                          variant={stroke.achieved ? 'primary' : 'default'}
                          text={stroke.label}
                          className={
                            stroke.achieved
                              ? 'border border-primary'
                              : 'border border-hairline-border-strong'
                          }
                        />
                      ))}
                    </View>
                  </Card>
                ))}

                <Button label="확인했어요" onPress={handleConfirm} />
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
