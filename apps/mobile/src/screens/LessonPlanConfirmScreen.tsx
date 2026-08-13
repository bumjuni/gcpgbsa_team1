import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { Button } from '../components/button/Button';
import { Card } from '../components/card/Card';

interface LessonSetItem {
  title: string;
  set: number;
  distance_m: number;
  detail: string;
}

interface LessonSection {
  title: string;
  items: LessonSetItem[];
}


const getSectionTotalMeters = (section: LessonSection): number =>
  section.items.reduce(
    (sum, item) => sum + item.distance_m * item.set,
    0
  );

// "4×25m" -> { count: 4, intervalDistance: 25 }, "100m" -> { count: 1, intervalDistance: 100 }
const parseCountAndDistance = (distance: string): { count: number; intervalDistance: number } => {
  const match = distance.match(/^(\d+)(?:[×x](\d+))?m$/);
  if (!match) return { count: 1, intervalDistance: 0 };
  const [, first, second] = match;
  return second
    ? { count: Number(first), intervalDistance: Number(second) }
    : { count: 1, intervalDistance: Number(first) };
};

export const LessonPlanConfirmScreen = ({ navigation, route }: any) => {
  const result = {
    id: 1,
    class_id: 1,
    created_at: "2026-08-13T13:15:08",
    date: "2026-08-13",
    equipment: "PADDLE",
    request: "",
    session_summary: {
      total_min: 60,
      total_distance_m: 650,
      focus_point:
        "자유형의 기본 자세와 스트로크 효율성을 높이고, 배영의 몸통 회전 감각을 익힙니다.",
    },
    program: {
      pre_set: [
        {
          title: "WARM UP FREE",
          set: 4,
          distance_m: 25,
          duration_min: 5,
          detail: "가볍게 자유형으로 몸을 풀며 호흡 리듬을 맞춥니다.",
        },
        {
          title: "KICK DRILL",
          set: 4,
          distance_m: 25,
          duration_min: 5,
          detail: "킥판을 잡고 발차기로 하체 근력과 리듬감을 깨웁니다.",
        },
        {
          title: "EASY BACK",
          set: 3,
          distance_m: 25,
          duration_min: 4,
          detail: "편안한 배영으로 몸통 회전 감각을 미리 익힙니다.",
        },
      ],
      main_set: [
        {
          title: "SHORT PADDLE",
          set: 4,
          distance_m: 25,
          duration_min: 10,
          detail:
            "패들을 손목 가까이 잡고 자유형을 하며 팔꿈치를 높게 유지하는 얼리 버티컬 포암 자세를 연습합니다.",
        },
        {
          title: "1 STROKE + 6 KICKS",
          set: 4,
          distance_m: 25,
          duration_min: 8,
          detail:
            "배영 한 스트로크 후 6번 킥을 차며 옆으로 길게 자세를 유지하고 몸통 회전을 느낍니다.",
        },
        {
          title: "1 BACK + 1 FREE",
          set: 3,
          distance_m: 25,
          duration_min: 8,
          detail:
            "한 팔로 배영과 자유형 스트로크를 번갈아 하며 팔꿈치를 구부리는 동작과 몸통 회전을 연습합니다.",
        },
        {
          title: "GLIDE AWAY",
          set: 3,
          distance_m: 25,
          duration_min: 8,
          detail:
            "평영 스트로크 수를 세면서 매 랩마다 스트로크 수를 줄여 효율적인 글라이드와 추진력을 만듭니다.",
        },
        {
          title: "888 DRILL",
          set: 2,
          distance_m: 25,
          duration_min: 8,
          detail:
            "접영 한 팔, 다른 팔, 양 팔 순서로 스트로크하며 팔 동작과 웨이브의 연결감을 익힙니다.",
        },
      ],
      post_set: [
        {
          title: "COOL DOWN FREE",
          set: 2,
          distance_m: 25,
          duration_min: 3,
          detail: "가벼운 자유형으로 심박수를 서서히 낮춥니다.",
        },
        {
          title: "STRETCH SWIM",
          set: 2,
          distance_m: 25,
          duration_min: 3,
          detail: "천천히 스트로크하며 어깨와 몸통을 이완시킵니다.",
        },
      ],
    },
  };
  // const { result } = route?.params ?? {};
  const [sections, setSections] = useState<LessonSection[]>([
    { title: 'Pre-Set', items: result.program.pre_set },
    { title: 'Main-Set', items: result.program.main_set },
    { title: 'Post-Set', items: result.program.post_set },
  ]);

  useEffect(() => {
    const edited = route?.params?.editedItem;
    if (!edited) return;

    setSections((prev) =>
      prev.map((section) =>
        section.title !== edited.sectionTitle
          ? section
          : {
              ...section,
              items: section.items.map((it, i) =>
                i !== edited.itemIndex
                  ? it
                  : {
                      name: edited.name,
                      description: edited.description,
                      distance:
                        edited.count === 1
                          ? `${edited.intervalDistance}m`
                          : `${edited.count}×${edited.intervalDistance}m`,
                    }
              ),
            }
      )
    );
    navigation?.setParams({ editedItem: undefined });
  }, [route?.params?.editedItem]);

  const handleRetry = () => {
    navigation?.goBack();
  };

  const handleConfirm = () => {
    navigation?.navigate('ClassListFilled');
  };

  const handleEditItem = (sectionTitle: string, itemIndex: number, item: LessonSetItem) => {
    const { count, intervalDistance } = parseCountAndDistance(item.distance);
    navigation?.navigate('LessonPlanEditItem', {
      sectionTitle,
      itemIndex,
      name: item.name,
      description: item.description,
      count,
      intervalDistance,
    });
  };

  return (
    <ScreenLayout
      title="수업안 확인"
      showBackButton
      footer={
        <View className="flex-row">
          <View className="flex-1 mr-xs">
            <Button label="다시 만들기" onPress={handleRetry} variant="secondary" />
          </View>
          <View className="flex-auto ml-xs">
            <Button label="수업안 확정하기" onPress={handleConfirm} variant="primary" />
          </View>
        </View>
      }
    >
      <View className="pt-md pb-xl">
        <Card variant="muted" className="items-center pt-md">
          <Text className="text-caption text-ink-secondary">총 운동량</Text>
          <Text className="text-metric text-ink my-sm">{result.session_summary.total_distance_m}m</Text>
          <Text className="text-legal text-ink-tertiary">Pre-Set · Main-Set · Post-Set 거리를 더한 값이에요</Text>
        </Card>

        <Text className="text-caption font-bold text-ink my-sm">수업 구성</Text>


        {sections.map((section: LessonSection) => (
          <View key={section.title} className="mb-lg">

            <Card>
              <Card.Header className="flex-row items-center justify-between mb-xs"
                title={section.title}
                rightElement={
                  <View className="bg-canvas px-md py-xs rounded-full">
                    <Text className="text-caption-strong text-ink">{`${getSectionTotalMeters(section)}m`}</Text>
                  </View>
                }
              />
              {section.items.map((item: LessonSetItem, index) =>
                <Card.Item
                  key={`${section.title}-${index}`}
                  title={item.title}
                  description={item.detail}
                  rightElement={
                    <View className="items-end flex-col justify-between">
                      <Text className="text-label text-ink-tertiary">{item.distance_m}m</Text>
                      <Pressable onPress={() => handleEditItem(section.title, index, item)} hitSlop={8}>
                        <Text className="text-caption text-primary font-medium">수정</Text>
                      </Pressable>
                    </View>
                  }
                  isLast={(index === section.items.length) ? true : false}
                />
              )}
            </Card>


          </View>
        ))}
      </View>
    </ScreenLayout>
  );
};
