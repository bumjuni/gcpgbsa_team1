import React, { useState, useTransition } from 'react';
import { View } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { Button } from '../components/button/Button';
import { Card } from '../components/card/Card';
import { FormField } from '../components/form/FormField';
import { ConfirmModal } from '../components/ConfirmModal';

interface MemberEditFormState {
  name: string;
  birthYear: string;
  phone: string;
  gender: string;
  notes: string;
}

export const ClassDetailsMemberEditScreen = ({ navigation, route }: any) => {
  const {
    classId,
    memberId,
    name = '김수영',
    birthYear = '2018',
    phone = '010-1234-5678',
    gender = 'M',
    notes = '물을 무서워해요',
  } = route?.params ?? {};

  const [formData, setFormData] = useState<MemberEditFormState>({
    name,
    birthYear: String(birthYear),
    phone,
    gender,
    notes,
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [, startTransition] = useTransition();

  const handleFieldChange = <K extends keyof MemberEditFormState>(key: K, value: string) => {
    startTransition(() => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    });
  };

  const handleCancel = () => {
    navigation?.goBack();
  };

  const handleSave = () => {
    navigation?.navigate('ClassDetailsMemberDetail', { classId, memberId, ...formData });
  };

  const handleConfirmDelete = () => {
    setIsDeleteModalOpen(false);
    navigation?.navigate('ClassDetailsMemberTab', { classId });
  };

  return (
    <>
      <ScreenLayout
        title="회원 상세"
        showBackButton
        footer={
          <View>
            <View className="flex-row mb-sm">
              <View className="flex-1 mr-xs">
                <Button label="취소" onPress={handleCancel} variant="secondary" />
              </View>
              <View className="flex-1 ml-xs">
                <Button label="저장하기" onPress={handleSave} variant="primary" />
              </View>
            </View>
            <Button label="회원 삭제하기" onPress={() => setIsDeleteModalOpen(true)} variant="danger" />
          </View>
        }
      >
        <Card className="p-md mt-md">
          <View className="flex-row gap-sm">
            <FormField className="flex-auto">
              <FormField.Label label="이름" />
              <FormField.TextInput
                placeholder="예: 김수영"
                value={formData.name}
                onChangeText={(text) => handleFieldChange('name', text)}
              />
            </FormField>
            <FormField className="flex-auto">
              <FormField.Label label="출생년도" />
              <FormField.TextInput
                placeholder="예: 1990"
                keyboardType="numeric"
                value={formData.birthYear}
                onChangeText={(text) => handleFieldChange('birthYear', text)}
              />
            </FormField>
          </View>

          <View className="flex-row gap-sm">
            <FormField className="flex-auto">
              <FormField.Label label="전화번호" />
              <FormField.TextInput
                placeholder="010-0000-0000"
                value={formData.phone}
                onChangeText={(text) => handleFieldChange('phone', text)}
              />
            </FormField>
            <FormField className="flex-auto">
              <FormField.Label label="성별" />
              <FormField.ChipGroup
                variant="rounded-square"
                options={[
                  { label: '남', value: 'M' },
                  { label: '여', value: 'F' },
                ]}
                value={formData.gender}
                onChange={(val) => handleFieldChange('gender', val as string)}
              />
            </FormField>
          </View>

          <FormField className="mb-0">
            <FormField.Label label="비고" />
            <FormField.TextInput
              placeholder="예: 통원치료 중, 자유형 호흡이 잘 안됨"
              value={formData.notes}
              onChangeText={(text) => handleFieldChange('notes', text)}
            />
          </FormField>
        </Card>
      </ScreenLayout>

      <ConfirmModal
        visible={isDeleteModalOpen}
        title="이 회원을 삭제할까요?"
        description={'삭제하면 명단에서 사라지고 되돌릴 수 없어요.\n지난 수업 기록은 남아있어요.'}
        confirmText="삭제하기"
        cancelText="취소"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </>
  );
};
