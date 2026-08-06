import React, { useState, useTransition } from 'react';
import { View } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { FormField } from '../components/FormField';
import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';

interface ClassFormState {
  count: string;
  ageGroup: string;
  level: string;
  goal: string;
  notes: string;
}

const initialFormState: ClassFormState = Object.freeze({
  count: '',
  ageGroup: '',
  level: '',
  goal: '',
  notes: '',
});

export const ClassRegisterScreen = ({ navigation }: any) => {
  const [formData, setFormData] = useState<ClassFormState>(initialFormState);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, startTransition] = useTransition();

  const handleFieldChange = <K extends keyof ClassFormState>(key: K, value: string) => {
    startTransition(() => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    });
  };

  const handleSubmit = () => {
    setIsModalOpen(true);
  };

  const handleConfirmSubmit = () => {
    setIsModalOpen(false);
    navigation?.goBack();
  };

  return (
    <>
      <ScreenLayout
        title="새 반 등록"
        showBackButton
        footer={
          <Button
            label="반 등록 완료"
            onPress={handleSubmit}
          />
        }
      >
        <View className="pt-md pb-xl">
          <FormField
            label="인원"
            badgeType="required"
            placeholder="예: 8명"
            value={formData.count}
            onChangeText={(val) => handleFieldChange('count', val)}
          />
          <FormField
            label="나이대"
            badgeType="required"
            placeholder="예: 7~9세"
            value={formData.ageGroup}
            onChangeText={(val) => handleFieldChange('ageGroup', val)}
          />
          <FormField
            label="수준"
            badgeType="required"
            placeholder="신규 / 초급 / 중급 / 상급 / 마스터즈 (안내 보기 →)"
            value={formData.level}
            onChangeText={(val) => handleFieldChange('level', val)}
          />
          <FormField
            label="특성 (수업목표)"
            badgeType="required"
            placeholder="예: 완영 목표, 자세 교정, 체력 증진"
            value={formData.goal}
            onChangeText={(val) => handleFieldChange('goal', val)}
          />
          <FormField
            label="개인별 정보 및 특성"
            badgeType="optional"
            placeholder="예: 부상·주의사항 등 (선택 입력)"
            multiline
            value={formData.notes}
            onChangeText={(val) => handleFieldChange('notes', val)}
          />
        </View>
      </ScreenLayout>

      <ConfirmModal
        visible={isModalOpen}
        title="수업이 끝났나요?"
        description={`종료하면 출석한 7명에게 오늘 수업 내용이 기록돼요.\n확정 후에는 출석을 바꾸올 수 없어요.`}
        confirmText="종료하기"
        cancelText="아직 안끝났나요"
        onConfirm={handleConfirmSubmit}
        onCancel={() => setIsModalOpen(false)}
      />
    </>
  );
};
