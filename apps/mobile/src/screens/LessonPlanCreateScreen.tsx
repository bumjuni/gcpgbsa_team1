import React, { useState, useTransition } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { Button } from '../components/Button';
import { FormField } from '../components/form/FormField';
import { Card } from '../components/card/Card';

interface LessonPlanFormState {
  equipment: string[];
  request: string;
}

const initialFormState: LessonPlanFormState = Object.freeze({
  equipment: [],
  request: '',
});

const EQUIPMENT_OPTIONS = ['오리발', '킥판', '패들', '보드', '없음'];

const FieldLabel = ({ label, required = false }: { label: string; required?: boolean }) => (
  <View className="flex-row items-center mb-xs">
    <Text className="text-base font-bold text-ink mr-xs">{label}</Text>
    <View className={`px-xs py-xxs rounded-sm ${required ? 'bg-status-danger' : 'bg-ink-teriary'}`}>
      <Text className="text-[10px] font-bold text-ink-on_primary">{required ? '필수' : '선택'}</Text>
    </View>
  </View>
);

export const LessonPlanCreateScreen = ({ navigation, route }: any) => {
  const {
    day = '화요일',
    timeOfDay = '저녁',
    className = '초급반',
    memberCount = 8,
    level = '초급',
  } = route?.params ?? {};

  const [formData, setFormData] = useState<LessonPlanFormState>(initialFormState);
  const [, startTransition] = useTransition();
  const [equipment, setEquipment] = useState<string[]>([]);

  const handleFieldChange = <K extends keyof LessonPlanFormState>(key: K, value: LessonPlanFormState[K]) => {
    startTransition(() => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    });
  };

  const toggleEquipment = (item: string) => {
    startTransition(() => {
      setFormData((prev) => ({
        ...prev,
        equipment: prev.equipment.includes(item)
          ? prev.equipment.filter((e) => e !== item)
          : [...prev.equipment, item],
      }));
    });
  };

  const handleSubmit = () => {
    navigation?.navigate('LessonPlanComplete', { day, timeOfDay, className, memberCount, level, ...formData });
  };

  return (
    <ScreenLayout title="수업안 만들기" showBackButton footer={<Button label="수업안 생성하기" onPress={handleSubmit} />}>
      <View className="pt-md pb-xl">

        <Card
          variant='muted'
          className='mb-lg'
        >
          <View className="flex-row items-center justify-between mb-xxs">
            <Text className="text-title-sm text-ink">화요일 저녁 초급반</Text>
          </View>
          <Text className="text-caption text-ink-secondary mt-1">
            인원 8명 · 초급
          </Text>
        </Card>

        {/* 사용 장비 */}
        <FormField>
          <FormField.Label label='사용 장비' />
          <FormField.HelperText type='guide' text='여러 개 선택할 수 있어요' />
          <FormField.ChipGroup
            variant='pill'
            multiple
            options={[
              { label: '오리발', value: 'PRESCHOOL' },
              { label: '킥판', value: 'ELEMENTARY' },
              { label: '패들', value: 'TEEN' },
              { label: '보드', value: 'ADULT' },
              { label: '없음', value: 'SENIOR' },
            ]}
            value={equipment}
            onChange={setEquipment}
            />
        </FormField>

        <FormField>
          <FormField.Label label="요청사항" />
          <FormField.HelperText type='guide' text='다루고 싶은 기술이나 전달하고 싶은 점을 자유롭게 적어주세요' />
          <FormField.TextInput multiline placeholder='예: 자유형 자세 교정 위주로 진행해주세요' />
        </FormField>

      </View>
    </ScreenLayout>
  );
};
