import React, { useState, useTransition } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ScreenLayout } from '../../components/ScreenLayout';
import { FormField } from '../../components/form/FormField';
import { Button } from '../../components/button/Button';
import { useLessonPlanStore } from '../../stores/useLessonPlanStore';
import { LessonPlanSetKey } from '../../types/lessonPlan';

interface LessonSetItemFormState {
  name: string;
  description: string;
  count: number;
  intervalDistance: number;
}

const COUNT_MIN = 1;
const COUNT_MAX = 10;
const COUNT_STEP = 1;

const DISTANCE_MIN = 25;
const DISTANCE_MAX = 400;
const DISTANCE_STEP = 25;

export const LessonPlanEditItemScreen = ({ navigation, route }: any) => {
  const { setKey: rawSetKey, itemIndex = 0 } = route?.params ?? {};
  const setKey = (rawSetKey ?? 'main_set') as LessonPlanSetKey; // type 에러 방지용 코드..

  const item = useLessonPlanStore((s) => s.lessonPlan?.program[setKey]?.[itemIndex]);
  const updateItem = useLessonPlanStore((s) => s.updateItem);

  const [formData, setFormData] = useState<LessonSetItemFormState>(() => ({
    name: item?.title ?? '',
    description: item?.detail ?? '',
    count: item?.set ?? COUNT_MIN,
    intervalDistance: item?.distance_m ?? DISTANCE_MIN,
  }));

  if (!item) return null;

  const handleFieldChange = <K extends keyof LessonSetItemFormState>(
    key: K,
    value: LessonSetItemFormState[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleDecreaseCount = () => {
    handleFieldChange('count', Math.max(COUNT_MIN, formData.count - COUNT_STEP));
  };

  const handleIncreaseCount = () => {
    handleFieldChange('count', Math.min(COUNT_MAX, formData.count + COUNT_STEP));
  };

  const handleDecreaseDistance = () => {
    handleFieldChange(
      'intervalDistance',
      Math.max(DISTANCE_MIN, formData.intervalDistance - DISTANCE_STEP)
    );
  };

  const handleIncreaseDistance = () => {
    handleFieldChange(
      'intervalDistance',
      Math.min(DISTANCE_MAX, formData.intervalDistance + DISTANCE_STEP)
    );
  };

  const totalDistance = formData.count * formData.intervalDistance;

  const handleSave = () => {
    updateItem(setKey, itemIndex, {
        ...item,
        title: formData.name,
        detail: formData.description,
        set: formData.count,
        distance_m: formData.intervalDistance,
      });
      navigation?.goBack();
    };


  return (
    <ScreenLayout
      title="항목 수정"
      showBackButton
      footer={<Button label="저장" onPress={handleSave} />}
    >
      <View className="pt-md pb-xl">
        <Text className="text-label text-primary font-medium mb-sm">
          {setKey} · 항목 {itemIndex + 1}
        </Text>
        <View className="h-px bg-hairline mb-md" />

        <FormField>
          <FormField.Label label="기술명" />
          <FormField.TextInput
            placeholder="예: 자유형 킥"
            value={formData.name}
            onChangeText={(val) => handleFieldChange('name', val)}
          />
        </FormField>

        <FormField>
          <FormField.Label label="세부 설명" />
          <FormField.TextInput
            multiline
            placeholder="예: 강도 점점 높이며 마지막은 대쉬"
            value={formData.description}
            onChangeText={(val) => handleFieldChange('description', val)}
          />
        </FormField>

        <FormField>
          <FormField.Label label="구성 (개수 × 구간 거리)" />
          <View className="flex-row items-end gap-sm">
            <Stepper
              label="개수"
              displayValue={`${formData.count}개`}
              onDecrease={handleDecreaseCount}
              onIncrease={handleIncreaseCount}
              disableDecrease={formData.count <= COUNT_MIN}
              disableIncrease={formData.count >= COUNT_MAX}
            />
            <Text className="text-lg font-bold text-ink-tertiary mb-sm">×</Text>
            <Stepper
              label="구간 거리"
              displayValue={`${formData.intervalDistance} m`}
              onDecrease={handleDecreaseDistance}
              onIncrease={handleIncreaseDistance}
              disableDecrease={formData.intervalDistance <= DISTANCE_MIN}
              disableIncrease={formData.intervalDistance >= DISTANCE_MAX}
            />
          </View>
          <Text className="text-base font-bold text-primary mt-sm">
            = 합계 {totalDistance}m
          </Text>
          <FormField.HelperText
            type="guide"
            text="메인 세트 소계와 총 운동량에 자동 반영돼요"
          />
        </FormField>
      </View>
    </ScreenLayout>
  );
};

interface StepperProps {
  label: string;
  displayValue: string;
  onDecrease: () => void;
  onIncrease: () => void;
  disableDecrease?: boolean;
  disableIncrease?: boolean;
}

const Stepper = ({
  label,
  displayValue,
  onDecrease,
  onIncrease,
  disableDecrease = false,
  disableIncrease = false,
}: StepperProps) => (
  <View className="flex-1">
    <Text className="text-sm text-ink-secondary mb-xs">{label}</Text>
    <View className="flex-row items-center gap-xs">
      <Pressable
        onPress={onDecrease}
        disabled={disableDecrease}
        className={`w-10 h-10 rounded-md border border-primary items-center justify-center ${
          disableDecrease ? 'opacity-40' : ''
        }`}
      >
        <Text className="text-lg font-bold text-primary">-</Text>
      </Pressable>
      <View className="flex-1 items-center">
        <Text className="text-base font-bold text-ink">{displayValue}</Text>
      </View>
      <Pressable
        onPress={onIncrease}
        disabled={disableIncrease}
        className={`w-10 h-10 rounded-md border border-primary items-center justify-center ${
          disableIncrease ? 'opacity-40' : ''
        }`}
      >
        <Text className="text-lg font-bold text-primary">+</Text>
      </Pressable>
    </View>
  </View>
);
