import React, { useState, useTransition } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { Button } from '../components/Button';

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
        <View className="bg-surface-muted rounded-md px-md py-sm mb-lg">
          <Text className="text-base font-bold text-ink mb-xxs">
            {day} {timeOfDay} {className}
          </Text>
          <Text className="text-xs text-ink-teriary">
            인원 {memberCount}명 · {level}
          </Text>
        </View>

        <View className="mb-md">
          <FieldLabel label="사용 장비" />
          <Text className="text-xs text-ink-teriary mb-xs">여러 개 선택할 수 있어요</Text>
          <View className="flex-row flex-wrap">
            {EQUIPMENT_OPTIONS.map((item) => {
              const selected = formData.equipment.includes(item);
              return (
                <Pressable
                  key={item}
                  onPress={() => toggleEquipment(item)}
                  className={`px-sm py-xs rounded-full border mr-xs mb-xs ${
                    selected ? 'bg-primary border-primary' : 'bg-surface-muted border-surface-hairline'
                  }`}
                >
                  <Text className={`text-sm font-medium ${selected ? 'text-white' : 'text-ink'}`}>{item}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mb-md">
          <FieldLabel label="요청사항" />
          <Text className="text-xs text-ink-teriary mb-xs">
            다루고 싶은 기술이나 전달하고 싶은 점을 자유롭게 적어주세요
          </Text>
          <TextInput
            className="w-full bg-surface-muted border border-surface-hairline rounded-md px-md text-base text-ink h-32 pt-sm pb-sm"
            placeholder="예: 자유형 자세 교정 위주로 진행해주세요"
            placeholderTextColor="#8B9198"
            textAlignVertical="top"
            multiline
            value={formData.request}
            onChangeText={(val) => handleFieldChange('request', val)}
          />
        </View>
      </View>
    </ScreenLayout>
  );
};
