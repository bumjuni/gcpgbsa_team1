import React, { useState, useTransition } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { FormField } from '../components/FormField';
import { Button } from '../components/Button';

interface MemberFormState {
  name: string;
  birthYear: string;
  phone: string;
  notes: string;
}

const initialFormState: MemberFormState = Object.freeze({
  name: '',
  birthYear: '',
  phone: '',
  notes: '',
});

export const MemberRegisterScreen = ({ navigation }: any) => {
  const [formData, setFormData] = useState<MemberFormState>(initialFormState);
  const [isEntryComplete, setIsEntryComplete] = useState(false);
  const [, startTransition] = useTransition();

  const handleFieldChange = <K extends keyof MemberFormState>(key: K, value: MemberFormState[K]) => {
    startTransition(() => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    });
  };

  const handleDeleteMember = () => {
    startTransition(() => {
      setFormData(initialFormState);
      setIsEntryComplete(false);
    });
  };

  const handleCompleteEntry = () => {
    setIsEntryComplete(true);
  };

  const handleCreateClass = () => {
    navigation?.navigate('ClassCreateComplete', { members: [formData] });
  };

  const isEntryValid =
    formData.name.trim().length > 0 &&
    formData.birthYear.trim().length > 0 &&
    formData.phone.trim().length > 0;

  return (
    <ScreenLayout title="회원 등록" showBackButton footer={<Button label="반 만들기" onPress={handleCreateClass} />}>
      <View className="pt-md pb-xl">
        <View className="h-1 rounded-full bg-surface-muted mb-md overflow-hidden">
          <View className="h-1 w-4/5 rounded-full bg-primary" />
        </View>

        <Text className="text-sm text-ink-teriary font-medium mb-md">2단계 · 회원 등록</Text>

        <View className="bg-primary-subtle rounded-md px-md py-sm mb-lg">
          <Text className="text-sm font-bold text-primary mb-xxs">지금 다 몰라도 괜찮아요</Text>
          <Text className="text-xs text-primary">회원 추가는 반을 만든 뒤에도 할 수 있어요</Text>
        </View>

        <View className="border border-surface-hairline rounded-md p-md mb-md">
          <View className="flex-row items-center justify-between mb-md">
            <Text className="text-base font-bold text-ink">회원 1</Text>
            <Pressable onPress={handleDeleteMember} hitSlop={8}>
              <Text className="text-xs font-bold text-status-danger">삭제</Text>
            </Pressable>
          </View>

          <View className="flex-row">
            <View className="flex-1 mr-xs">
              <FormField
                label="이름"
                badgeType="required"
                placeholder="예: 김수영"
                value={formData.name}
                onChangeText={(val) => handleFieldChange('name', val)}
              />
            </View>
            <View className="flex-1 ml-xs">
              <FormField
                label="출생년도"
                badgeType="required"
                placeholder="예: 1990"
                keyboardType="number-pad"
                value={formData.birthYear}
                onChangeText={(val) => handleFieldChange('birthYear', val)}
              />
            </View>
          </View>

          <FormField
            label="전화번호"
            badgeType="required"
            placeholder="010-0000-0000"
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={(val) => handleFieldChange('phone', val)}
          />

          <FormField
            label="비고"
            badgeType="optional"
            placeholder="예: 통원치료 중, 자유형 호흡이 잘 안됨"
            multiline
            value={formData.notes}
            onChangeText={(val) => handleFieldChange('notes', val)}
          />

          <Button
            label={isEntryComplete ? '입력 완료됨' : '입력 완료'}
            variant="secondary"
            onPress={handleCompleteEntry}
            disabled={isEntryComplete || !isEntryValid}
          />
        </View>
      </View>
    </ScreenLayout>
  );
};
