// LessonPlanCreateScreen.tsx

import React, { useState, useTransition } from 'react';
import { View, Text } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { Button } from '../components/button/Button';
import { FormField } from '../components/form/FormField';
import { Card } from '../components/card/Card';
import { lessonPlanApi } from '../api/lessonPlan';
import { useClassStore } from '../stores/useClassStore';
import { formatDateToYMD, getNextClassDate } from '../utils/classSchedule';
import { mapLLMCurriculumResponse } from '../types/lessonPlan';

// ── 장비 enum: 서버 RequestBody의 equipment 값과 1:1 대응 ──
// 'NONE'은 다른 장비와 함께 선택할 수 없다 (배타 선택)
type EquipmentValue = 'FINS' | 'BOARD' | 'PADDLE' | 'PULLBUOY' | 'NONE';

const EQUIPMENT_OPTIONS: { label: string; value: EquipmentValue }[] = [
  { label: '오리발', value: 'FINS' },
  { label: '킥판', value: 'BOARD' },
  { label: '패들', value: 'PADDLE' },
  { label: '풀부이', value: 'PULLBUOY' },
  { label: '없음', value: 'NONE' },
];

const REQUEST_MAX_LENGTH = 200;

interface LessonPlanFormState {
  equipment: EquipmentValue[];
  request: string;
}

const initialFormState: LessonPlanFormState = Object.freeze({
  equipment: [],
  request: '',
});

export const LessonPlanCreateScreen = ({ navigation }: any) => {

  const [formData, setFormData] = useState<LessonPlanFormState>(initialFormState);
  const [, startTransition] = useTransition();
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const currentClass = useClassStore((s) => s.currentClass);

  const handleRequestChange = (value: string) => {
    // maxLength로도 막지만, 붙여넣기 등으로 초과 입력되는 경우를 대비해 이중 방어
    const truncated = value.slice(0, REQUEST_MAX_LENGTH);
    startTransition(() => {
      setFormData((prev) => ({ ...prev, request: truncated }));
    });
  };

  // 장비 토글: 'NONE'을 켜면 나머지 전체 해제, 다른 장비를 켜면 'NONE' 자동 해제 (양방향 배타)
  const toggleEquipment = (item: EquipmentValue) => {
    startTransition(() => {
      setFormData((prev) => {
        const isSelected = prev.equipment.includes(item);

        if (item === 'NONE') {
          return { ...prev, equipment: isSelected ? [] : ['NONE'] };
        }

        const withoutNone = prev.equipment.filter((e) => e !== 'NONE');
        const nextEquipment = isSelected
          ? withoutNone.filter((e) => e !== item)
          : [...withoutNone, item];

        return { ...prev, equipment: nextEquipment };
      });
    });
  };

  const handleSubmit = async () => {
    if (!currentClass) {
      setErrorMessage('반 정보를 찾을 수 없어요. 다시 시도해주세요.');
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);

    // LessonPlanCreate 스키마에 맞춘 페이로드.
    // class_name/days_of_week/start_time 등 반 상세 정보는 서버가 DB에서 직접 조립한다.
    const nextClass = getNextClassDate(currentClass.days_of_week, currentClass?.start_time, null);

    if (!nextClass) {
      setErrorMessage('다음 수업일을 계산할 수 없어요.');
      return;
    }

    const requestPayload = {
      class_id: currentClass?.id,
      date: formatDateToYMD(nextClass?.date), // 'YYYY-MM-DD'
      equipment: formData.equipment.join(', '), // 예: "FINS, PULLBUOY"
      request: formData.request,
    };

    try {
      // const result = mapLLMCurriculumResponse(await lessonPlanApi.createLessonPlan(requestPayload));
      const result = await lessonPlanApi.createLessonPlan(requestPayload);

      setIsGenerating(false);
      navigation?.navigate('LessonPlanConfirm', { result });
    } catch (error) {
      console.error(error)
      setIsGenerating(false);
      setErrorMessage('수업안을 만드는 데 문제가 생겼어요. 다시 시도해주세요.');
    }
  };

  if (isGenerating) {
    return <LessonPlanGeneratingView />;
  }

  return (
    <ScreenLayout title="수업안 만들기" showBackButton footer={<Button label="수업안 생성하기" onPress={handleSubmit} />}>
      <View className="pt-md pb-xl">

        <Card variant="muted" className="mb-lg">
          <View className="flex-row items-center justify-between mb-xxs">
            <Text className="text-title-sm text-ink">
              {currentClass?.name}
            </Text>
          </View>
          <Text className="text-caption text-ink-secondary mt-1">
            인원 {currentClass?.student_count || 0}명 · {currentClass?.level}
          </Text>
        </Card>

        {errorMessage ? (
          <Text className="text-caption text-status-danger mb-md">{errorMessage}</Text>
        ) : null}

        {/* 사용 장비 (선택) */}
        <FormField>
          <FormField.Label label="사용 장비" required={false} />
          <FormField.HelperText type="guide" text="여러 개 선택할 수 있어요" />
          <FormField.ChipGroup
            multiple
            options={EQUIPMENT_OPTIONS}
            value={formData.equipment}
            onChange={(next: EquipmentValue[]) => {
              // ChipGroup이 배열 전체를 넘겨주는 구현이라면 마지막으로 바뀐 항목을 찾아 토글 로직을 태운다.
              const added = next.find((v) => !formData.equipment.includes(v));
              const removed = formData.equipment.find((v) => !next.includes(v));
              const changed = added ?? removed;
              if (changed) toggleEquipment(changed as EquipmentValue);
            }}
          />
        </FormField>

        {/* 요청사항 (선택) */}
        <FormField>
          <FormField.Label label="요청사항" required={false} />
          <FormField.HelperText type="guide" text="다루고 싶은 기술이나 전달하고 싶은 점을 자유롭게 적어주세요" />
          <FormField.TextInput
            multiline
            maxLength={REQUEST_MAX_LENGTH}
            placeholder="예: 자유형 자세 교정 위주로 진행해주세요"
            value={formData.request}
            onChangeText={handleRequestChange}
          />
        </FormField>

      </View>
    </ScreenLayout>
  );
};

const generatingDotStyle = 'w-3 h-3 rounded-full mx-xxs';

const LessonPlanGeneratingView = () => (
  <View className="flex-1 justify-center items-center">
    <View className="w-20 h-20 rounded-full bg-primary-subtle items-center justify-center mb-md">
      <View className="flex-row items-center">
        <View className={`${generatingDotStyle} bg-primary`} />
        <View className={`${generatingDotStyle} bg-white`} />
        <View className={`${generatingDotStyle} bg-white`} />
      </View>
    </View>
    <Text className="text-sm text-ink-teriary text-center">
      반 정보에 맞춰 수업안을 만들고 있어요
    </Text>
  </View>
);
