import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Button } from './button/Button';
import { FormField } from './form/FormField';
import { ConfirmModal } from './ConfirmModal';
import { useClassForm } from '../hooks/useClassForm';
import { useClassStore } from '../stores/useClassStore';
import { classroomApi } from '../api/classroom';
import { stringToList } from '../utils/parser';
import { AgeGroupType } from '../types/classroom';

type ClassInfoMode = 'view' | 'edit' | 'create';

interface ClassInfoFormProps {
  mode: ClassInfoMode;
  navigation: any;
}

const noop = () => {};

export const ClassInfoForm = ({ mode, navigation }: ClassInfoFormProps) => {
  const { currentClass, clearClass } = useClassStore();
  const isReadOnly = mode === 'view';
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // view 모드는 훅 없이 currentClass를 그대로 읽음
  const form = useClassForm(
    mode !== 'view'
      ? {
          classId: mode === 'edit' ? currentClass?.id : undefined,
          onSuccess: (classId: number) => {
            if (mode === 'create') {
              navigation?.navigate('ClassMember', { classId });
            } else {
              navigation?.canGoBack()
                ? navigation.goBack()
                : navigation?.navigate('ClassDetailsInfoTab', { classId });
            }
          },
        }
      : { classId: undefined } // view 모드에서는 실질적으로 미사용, 타입 맞추기용
  );

  // view 모드일 때는 currentClass를 폼과 동일한 shape으로 변환해서 사용
  const values = isReadOnly
    ? {
        name: currentClass?.name ?? '',
        days_of_week: stringToList(currentClass?.days_of_week ?? ''),
        start_time: currentClass?.start_time?.substring(0, 5) ?? '',
        end_time: currentClass?.end_time?.substring(0, 5) ?? '',
        capacity: String(currentClass?.capacity ?? ''),
        age_group: currentClass?.age_group ?? '',
        level: currentClass?.level ?? '',
        goals: stringToList(currentClass?.goals ?? ''),
        goal_etc: currentClass?.goal_etc ?? '',
      }
    : form.values;

  const errors = isReadOnly ? {} : form.errors;
  const setFieldValue = isReadOnly ? noop : form.setFieldValue;

  if (!currentClass && mode !== 'create') return null;

  const handleEdit = () => navigation?.navigate('ClassDetailsInfoEdit');
  const handleCancel = () => navigation?.goBack();

  const handleConfirmDelete = async () => {
    setIsDeleteModalOpen(false);

    try {
      if (currentClass)
      await classroomApi.deleteClass(currentClass.id);
      clearClass();
    } catch (error) {
      console.error('반 삭제 실패:', error);
    }
    navigation?.navigate('ClassList');
  };

  const fields = (
    <View className={mode === 'create' ? 'pt-md pb-xl' : 'pb-xl'}>
      {mode === 'view' && (
        <View className="items-end mb-sm">
          <Pressable onPress={handleEdit}>
            <Text className="text-primary text-sm font-medium">수정하기</Text>
          </Pressable>
        </View>
      )}

      {mode === 'create' && (
        <>
          <View className="mb-sm flex-auto flex-row gap-2">
            <View className="flex-1 h-1 rounded-full bg-primary" />
            <View className="flex-1 h-1 rounded-full bg-hairline" />
          </View>
          <Text className="text-label text-primary font-medium mb-md">1단계 · 반 정보</Text>
        </>
      )}

      <FormField>
        <FormField.Label label="반 이름" required />
        <FormField.TextInput
          placeholder="예: 화요일 저녁 초급반"
          value={values.name}
          editable={!isReadOnly}
          onChangeText={(text) => setFieldValue('name', text)}
        />
        {errors.name && <FormField.HelperText type="error" text={errors.name} />}
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
          value={values.days_of_week}
          onChange={isReadOnly ? noop : (val) => setFieldValue('days_of_week', val as string[])}
        />
        {errors.days_of_week && <FormField.HelperText type="error" text={errors.days_of_week} />}
      </FormField>

      <View className="flex-row w-full gap-sm">
        <FormField className="flex-auto">
          <FormField.Label label="시작 시각" required />
          {isReadOnly ? (
            <View className="h-14 justify-center bg-surface-muted border border-hairline-border-strong rounded-md px-md">
              <Text className="text-base text-ink">{values.start_time}</Text>
            </View>
          ) : (
            <FormField.Select
              value={values.start_time}
              onChange={(val) => setFieldValue('start_time', val as string)}
            />
          )}
        </FormField>
        <FormField className="flex-auto">
          <FormField.Label label="종료 시각" required />
          {isReadOnly ? (
            <View className="h-14 justify-center bg-surface-muted border border-hairline-border-strong rounded-md px-md">
              <Text className="text-base text-ink">{values.end_time}</Text>
            </View>
          ) : (
            <FormField.Select
              value={values.end_time}
              onChange={(val) => setFieldValue('end_time', val as string)}
            />
          )}
        </FormField>
      </View>
      {errors.start_time && <FormField.HelperText type="error" text={errors.start_time} />}
      {errors.end_time && <FormField.HelperText type="error" text={errors.end_time} />}

      {mode !== 'view' && (
        <FormField>
          <FormField.Label label="정원" required />
          <FormField.TextInput
            placeholder="예: 10 (최대 인원)"
            suffix="명"
            keyboardType="numeric"
            value={values.capacity}
            onChangeText={(text) => setFieldValue('capacity', text)}
          />
          {errors.capacity && <FormField.HelperText type="error" text={errors.capacity} />}
        </FormField>
      )}

      <FormField>
        <FormField.Label label="나이대" required />
        <FormField.ChipGroup
          variant="rounded-square"
          options={[
            { label: '어린이 (5~7세)', value: 'PRESCHOOL' },
            { label: '초등 (8~13세)', value: 'ELEMENTARY' },
            { label: '청소년 (14~19세)', value: 'TEEN' },
            { label: '성인 (20~59세)', value: 'ADULT' },
            { label: '시니어 (60세~)', value: 'SENIOR' },
          ]}
          value={values.age_group}
          onChange={isReadOnly ? noop : (val) => setFieldValue('age_group', val as AgeGroupType)}
        />
        {errors.age_group && <FormField.HelperText type="error" text={errors.age_group} />}
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
          value={values.level}
          onChange={isReadOnly ? noop : (val) => setFieldValue('level', val as string)}
        />
        {errors.level && <FormField.HelperText type="error" text={errors.level} />}
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
          value={values.goals}
          onChange={isReadOnly ? noop : (val) => setFieldValue('goals', val as string[])}
        />
        {errors.goals && <FormField.HelperText type="error" text={errors.goals} />}
        {values.goals.includes('ETC') && (
          <>
            <FormField.HelperText type="guide" text="'기타'를 선택하면 아래에 적어주세요" className="mt-xs" />
            <FormField.TextInput
              placeholder="예: 수중 재활, 다이빙 연습"
              editable={!isReadOnly}
              value={values.goal_etc}
              onChangeText={(text) => setFieldValue('goal_etc', text)}
            />
          </>
        )}
      </FormField>

      {mode === 'create' && (
        <Button label="다음 · 회원 등록" disabled={form.isSubmitting} onPress={form.handleSubmit} className="mt-md" />
      )}
    </View>
  );

  if (mode === 'edit') {
    return (
      <>
        {fields}
        <View>
          <View className="flex-row mb-sm">
            <View className="flex-1 mr-xs">
              <Button label="취소" onPress={handleCancel} variant="secondary" />
            </View>
            <View className="flex-1 ml-xs">
              <Button label="저장하기" onPress={form.handleSubmit} variant="primary" disabled={form.isSubmitting} />
            </View>
          </View>
          <Button label="반 삭제하기" onPress={() => setIsDeleteModalOpen(true)} variant="danger" />
        </View>
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
  }

  return fields;
};
