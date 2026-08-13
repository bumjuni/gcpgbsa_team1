import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { Button } from '../components/button/Button';
import { FormField } from '../components/form/FormField';
import { useRegisterClassForm } from '../hooks/useRegisterClassForm';
import { AgeGroupType } from '../types/classroom';


export const ClassRegisterScreen = ({ navigation }: any) => {
  const { values, errors, isSubmitting, setFieldValue, handleSubmit } = useRegisterClassForm({
    onSuccess: (classId: number) => navigation?.navigate('ClassMember', { classId })
  });

  return (
    <ScreenLayout title="반 정보 입력" showBackButton>
      <View className="pt-md pb-xl">

        {/* progress bar */}
        <View className="mb-sm flex-auto flex-row gap-2">
          <View className="flex-1 h-1 rounded-full bg-primary" />
          <View className="flex-1 h-1 rounded-full bg-hairline" />
        </View>
        <Text className="text-label text-primary font-medium mb-md">1단계 · 반 정보</Text>

        {/* 반 이름 */}
        <FormField>
          <FormField.Label label="반 이름" required />
          <FormField.TextInput
            placeholder="예: 화요일 저녁 초급반"
            value={values.name}
            onChangeText={(text) => setFieldValue('name', text)}
          />
        </FormField>

        {/* 수업 요일 */}
        <FormField>
          <FormField.Label label='수업 요일' required />
          <FormField.HelperText type='guide' text='여러 개 선택할 수 있어요' />
          <FormField.ChipGroup
            variant='rounded-square'
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
            onChange={(val) => setFieldValue('days_of_week', val as string[])}
          />
          {errors.days_of_week && <FormField.HelperText type="error" text={errors.days_of_week} />}
        </FormField>

        {/* 시작 시각 */}
        <View className='flex-row w-full gap-sm'>
          <FormField className='flex-auto'>
            <FormField.Label label="시작 시각" required />
            <FormField.Select
              value={values.start_time}
              onChange={(val) => setFieldValue('start_time', val as string)}
            />
          </FormField>

          {/* 종료 시각 */}
          <FormField className='flex-auto'>
            <FormField.Label label="종료 시각" required />
            <FormField.Select
              value={values.end_time}
              onChange={(val) => setFieldValue('end_time', val as string)}
            />
          </FormField>
        </View>
        {errors.start_time && <FormField.HelperText type="error" text={errors.start_time} />}
        {errors.end_time && <FormField.HelperText type="error" text={errors.end_time} />}


        {/* 정원 */}
        <FormField>
          <FormField.Label label="정원" required />
          <FormField.TextInput
            placeholder="예: 10 (최대 인원)"
            suffix="명"
            keyboardType="numeric"
            value={String(values.capacity)}
            onChangeText={(text) => setFieldValue('capacity', text)}
          />
        </FormField>

        {/* 나이대 */}
        <FormField>
          <FormField.Label label='나이대' required />
          <FormField.HelperText type='guide' text='여러 개 선택할 수 있어요' />
          <FormField.ChipGroup
            variant='rounded-square'
            options={[
              { label: '어린이 (5-7세)', value: 'PRESCHOOL' },
              { label: '초등 (8-13세)', value: 'ELEMENTARY' },
              { label: '청소년 (14-19세)', value: 'TEEN' },
              { label: '성인 (20-59세)', value: 'ADULT' },
              { label: '시니어 (60세~)', value: 'SENIOR' },
            ]}
            value={values.age_group}
            onChange={(val) => setFieldValue('age_group', val as AgeGroupType)}
            />
        </FormField>

        {/* 수준 */}
        <FormField>
          <FormField.Label
            label="수준"
            required
            rightAction={
              <TouchableOpacity onPress={() => navigation?.navigate('LevelGuide')}>
                <Text className="text-primary text-sm font-medium">레벨 설명 보기 ›</Text>
              </TouchableOpacity>
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
            onChange={(val) => setFieldValue('level', val as string)}
          />
        </FormField>

        {/* 특성 */}
        <FormField>
          <FormField.Label label='특성(수업목표)' required />
          <FormField.HelperText type='guide' text='여러 개 선택할 수 있어요' />
          <FormField.ChipGroup
            variant='rounded-square'
            multiple
            options={[
              { label: '완영 목표', value: 'COMPLETE_SWIM' },
              { label: '자세 교정', value: 'POSTURE_CORRECTION' },
              { label: '체력 증진', value: 'FITNESS_IMPROVEMENT' },
              { label: '기초 적응', value: 'BASIC_ADAPTATION' },
              { label: '기타', value: 'ETC' },
            ]}
            value={values.goals}
            onChange={(val) => setFieldValue('goals', val as string[])}
            />
        </FormField>

        <Button label="다음 · 회원 등록"
          disabled={isSubmitting}
          onPress={handleSubmit}
          className="mt-md"
        />

      </View>
    </ScreenLayout>
  );
};
