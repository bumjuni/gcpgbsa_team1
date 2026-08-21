// LessonPlanCreateScreen.tsx

import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Button } from '../../components/button/Button';
import { FormField } from '../../components/form/FormField';
import { Card } from '../../components/card/Card';
import { lessonPlanApi } from '../../api/lessonPlan';
import { useClassStore } from '../../stores/useClassStore';
import { formatDateToYMD, getNextClassDate } from '../../utils/classSchedule';
import { EquipmentValue } from '../../types/lessonPlan';
import { EQUIPMENT_OPTIONS } from '../../constants/lessonPlanLabels';
import { LEVEL_MAP } from '../../utils/classSchedule';
import { LessonPlanGeneratingScreen } from './LessonPlanGeneratingScreen'; // 분리된 컴포넌트 Import

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const currentClass = useClassStore((s) => s.currentClass);

  const handleRequestChange = (value: string) => {
    const truncated = value.slice(0, REQUEST_MAX_LENGTH);
    setFormData((prev) => ({ ...prev, request: truncated }));
  };

  const toggleEquipment = (item: EquipmentValue) => {
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
  };

  const handleSubmit = async () => {
    if (!currentClass) {
      setErrorMessage('반 정보를 찾을 수 없어요. 다시 시도해주세요.');
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);

    const nextClass = getNextClassDate(
      currentClass.days_of_week,
      currentClass?.start_time,
      currentClass?.end_time,
      null
    );

    if (!nextClass) {
      setErrorMessage('다음 수업일을 계산할 수 없어요.');
      setIsGenerating(false);
      return;
    }

    const requestPayload = {
      class_id: currentClass?.id,
      date: formatDateToYMD(nextClass?.date),
      equipment: formData.equipment.join(', '),
      request: formData.request,
    };

    try {
      const result = await lessonPlanApi.createLessonPlan(requestPayload);

      setIsGenerating(false);
      navigation?.navigate('LessonPlanConfirm', { result });
    } catch (error) {
      console.error(error);
      setIsGenerating(false);
      setErrorMessage('수업안을 만드는 데 문제가 생겼어요. 다시 시도해주세요.');
    }
  };

  // 로딩/생성 상태일 때 분리한 컴포넌트 렌더링
  if (isGenerating) {
    return <LessonPlanGeneratingScreen />;
  }

  if (!currentClass) return null;

  return (
    <ScreenLayout
      title="수업안 만들기"
      showBackButton
      footer={<Button label="수업안 생성하기" onPress={handleSubmit} />}
    >
      <View className="pt-md pb-xl">
        <Card variant="muted" className="mb-lg">
          <View className="flex-row items-center justify-between mb-xxs">
            <Text className="text-title-sm text-ink">{currentClass?.name}</Text>
          </View>
          <Text className="text-caption text-ink-secondary mt-1">
            인원 {currentClass?.student_count || 0}명 · {LEVEL_MAP[currentClass?.level]}
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
          <FormField.HelperText
            type="guide"
            text="다루고 싶은 기술이나 전달하고 싶은 점을 자유롭게 적어주세요"
          />
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
