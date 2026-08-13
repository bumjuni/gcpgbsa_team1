import React, { useState, useTransition } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { Button } from '../components/button/Button';
import { FormField } from '../components/form/FormField';
import { ConfirmModal } from '../components/ConfirmModal';

interface ClassInfoEditFormState {
  name: string;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  ageGroups: string[];
  level: string;
  goals: string[];
  goalsEtc: string;
}

export const ClassDetailsInfoEditScreen = ({ navigation, route }: any) => {
  const { classId, className = '화요일 저녁 초급반' } = route?.params ?? {};

  const [formData, setFormData] = useState<ClassInfoEditFormState>({
    name: className,
    daysOfWeek: ['Tue', 'Thu'],
    startTime: '오후 7:00',
    endTime: '오후 7:50',
    ageGroups: ['ADULT'],
    level: 'ELEMENTARY',
    goals: ['BASIC_ADAPTATION'],
    goalsEtc: '',
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [, startTransition] = useTransition();

  const handleFieldChange = <K extends keyof ClassInfoEditFormState>(
    key: K,
    value: ClassInfoEditFormState[K]
  ) => {
    startTransition(() => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    });
  };

  const canSave =
    formData.name.trim().length > 0 &&
    formData.daysOfWeek.length >= 1 &&
    Boolean(formData.startTime) &&
    Boolean(formData.endTime) &&
    formData.ageGroups.length >= 1 &&
    Boolean(formData.level) &&
    formData.goals.length >= 1;

  const handleCancel = () => {
    navigation?.goBack();
  };

  const handleSave = () => {
    navigation?.navigate('ClassDetailsInfoTab', { classId, className: formData.name });
  };

  const handleConfirmDelete = () => {
    setIsDeleteModalOpen(false);
    navigation?.navigate('ClassListFilled', { deletedClassId: classId });
  };

  const showGoalsEtcInput = formData.goals.includes('ETC');

  return (
    <>
    <ScreenLayout
      title="반정보 수정"
      showBackButton
      footer={
        <View>
          <View className="flex-row mb-sm">
            <View className="flex-1 mr-xs">
              <Button label="취소" onPress={handleCancel} variant="secondary" />
            </View>
            <View className="flex-1 ml-xs">
              <Button label="저장하기" onPress={handleSave} variant="primary" disabled={!canSave} />
            </View>
          </View>
          <Button label="반 삭제하기" onPress={() => setIsDeleteModalOpen(true)} variant="danger" />
        </View>
      }
    >
      <View className="pt-md pb-xl">
        <FormField>
          <FormField.Label label="반 이름" required />
          <FormField.TextInput
            placeholder="예: 화요일 저녁 초급반"
            value={formData.name}
            onChangeText={(text) => handleFieldChange('name', text)}
          />
        </FormField>

        <FormField>
          <FormField.Label label="수업 요일" required />
          <FormField.HelperText type="guide" text="여러 개 선택할 수 있어요" />
          <FormField.ChipGroup
            variant="rounded-square"
            multiple
            options={[
              { label: '월', value: 'Mon' },
              { label: '화', value: 'Tue' },
              { label: '수', value: 'Wed' },
              { label: '목', value: 'Thu' },
              { label: '금', value: 'Fri' },
              { label: '토', value: 'Sat' },
              { label: '일', value: 'Sun' },
            ]}
            value={formData.daysOfWeek}
            onChange={(val) => handleFieldChange('daysOfWeek', val as string[])}
          />
        </FormField>

        <View className="flex-row w-full gap-sm">
          <FormField className="flex-auto">
            <FormField.Label label="시작 시각" required />
            <FormField.Select
              value={formData.startTime}
              onChange={(val) => handleFieldChange('startTime', val as string)}
            />
          </FormField>
          <FormField className="flex-auto">
            <FormField.Label label="종료 시각" required />
            <FormField.Select
              value={formData.endTime}
              onChange={(val) => handleFieldChange('endTime', val as string)}
            />
          </FormField>
        </View>

        <FormField>
          <FormField.Label label="나이대" required />
          <FormField.HelperText type="guide" text="여러 개 선택할 수 있어요" />
          <FormField.ChipGroup
            variant="rounded-square"
            multiple
            options={[
              { label: '어린이 (5-7세)', value: 'PRESCHOOL' },
              { label: '초등 (8-13세)', value: 'ELEMENTARY' },
              { label: '청소년 (14-19세)', value: 'TEEN' },
              { label: '성인 (20-59세)', value: 'ADULT' },
              { label: '시니어 (60세~)', value: 'SENIOR' },
            ]}
            value={formData.ageGroups}
            onChange={(val) => handleFieldChange('ageGroups', val as string[])}
          />
        </FormField>

        <FormField>
          <FormField.Label
            label="수준"
            required
            rightAction={
              <Pressable onPress={() => navigation?.navigate('LevelGuide')}>
                <Text className="text-primary text-sm font-medium">레벨 설명 보기 ›</Text>
              </Pressable>
            }
          />
          <FormField.CardGroup
            options={[
              { label: '신규', description: '1개월 미만', value: 'BEGINNER' },
              { label: '초급', description: '자유형 · 배영 가능', value: 'ELEMENTARY' },
              { label: '중급', description: '평영 가능', value: 'INTERMEDIATE' },
              { label: '상급', description: '접영 · 배영 가능', value: 'ADVANCED' },
              { label: '마스터즈', description: '접영까지 숙달', value: 'MASTER' },
            ]}
            value={formData.level}
            onChange={(val) => handleFieldChange('level', val as string)}
          />
        </FormField>

        <FormField>
          <FormField.Label label="특성(수업목표)" required />
          <FormField.HelperText type="guide" text="여러 개 선택할 수 있어요" />
          <FormField.ChipGroup
            variant="rounded-square"
            multiple
            options={[
              { label: '완영 목표', value: 'COMPLETE_SWIM' },
              { label: '자세 교정', value: 'POSTURE_CORRECTION' },
              { label: '체력 증진', value: 'FITNESS_IMPROVEMENT' },
              { label: '기초 적응', value: 'BASIC_ADAPTATION' },
              { label: '기타', value: 'ETC' },
            ]}
            value={formData.goals}
            onChange={(val) => handleFieldChange('goals', val as string[])}
          />
          {showGoalsEtcInput && (
            <>
              <FormField.HelperText type="guide" text="'기타'를 선택하면 아래에 적어주세요" className="mt-xs" />
              <FormField.TextInput
                placeholder="예: 수중 재활, 다이빙 연습"
                value={formData.goalsEtc}
                onChangeText={(text) => handleFieldChange('goalsEtc', text)}
              />
            </>
          )}
        </FormField>
      </View>
    </ScreenLayout>

    <ConfirmModal
      visible={isDeleteModalOpen}
      title="이 반을 삭제할까요?"
      description={'삭제하면 홈 목록에서 사라져요.\n회원·수업 기록은 남지만 이 반으로는 다시 볼 수 없어요.'}
      confirmText="삭제하기"
      cancelText="취소"
      onConfirm={handleConfirmDelete}
      onCancel={() => setIsDeleteModalOpen(false)}
    />
    </>
  );
};
