import React, { useState, useTransition } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { Button } from '../components/button/Button';
import { FormField } from '../components/form/FormField';

interface ClassInfoFormState {
  name: string;
  days: string[];
  startTime: string;
  duration: number;
  location: string;
  ageGroup: string;
  level: string;
  goals: string[];
  capacity: string;
}

const initialFormState: ClassInfoFormState = Object.freeze({
  name: '',
  days: [],
  startTime: '오전 7:00',
  duration: 5,
  location: '',
  ageGroup: '',
  level: '',
  goals: [],
  capacity: '',
});

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

const TIME_OPTIONS = [
  '오전 6:00', '오전 7:00', '오전 8:00', '오전 9:00', '오전 10:00', '오전 11:00',
  '오후 12:00', '오후 1:00', '오후 2:00', '오후 3:00', '오후 4:00', '오후 5:00',
  '오후 6:00', '오후 7:00', '오후 8:00', '오후 9:00',
];

const DURATION_OPTIONS = Array.from({ length: 16 }, (_, i) => (i + 1) * 5); // 5 ~ 80분, 5분 단위 (임시)

const AGE_GROUPS = [
  { key: '유아', desc: '(4-7세)' },
  { key: '초등', desc: '(8-13세)' },
  { key: '청소년', desc: '(14-19세)' },
  { key: '성인', desc: '(20-39세)' },
  { key: '시니어', desc: '(40세~)' },
];

const LEVELS = [
  { key: '신규', desc: '등록 첫달' },
  { key: '초급', desc: '기초 배우기' },
  { key: '중급', desc: '턴 동작 가능' },
  { key: '상급', desc: '강습 가능한 수준' },
  { key: '마스터즈', desc: '경기 준비반' },
];

const GOALS = ['완영 목표', '자세 교정', '체력 증진', '기초 적용', '기타'];

const FieldLabel = ({ label, required = false }: { label: string; required?: boolean }) => (
  <View className="flex-row items-center mb-xs">
    <Text className="text-base font-bold text-ink mr-xs">{label}</Text>
    <View className={`px-xs py-xxs rounded-sm ${required ? 'bg-status-danger' : 'bg-ink-teriary'}`}>
      <Text className="text-[10px] font-bold text-ink-on_primary">{required ? '필수' : '선택'}</Text>
    </View>
  </View>
);

export const ClassRegisterScreen = ({ navigation }: any) => {
  const [formData, setFormData] = useState<ClassInfoFormState>(initialFormState);
  const [, startTransition] = useTransition();
  const [days, setDays] = useState<string[]>(['Thu']);
  const [level, setLevel] = useState<string>('');
  const [startTime, setStartTime] = useState<string | number>('');

  const handleFieldChange = <K extends keyof ClassInfoFormState>(key: K, value: ClassInfoFormState[K]) => {
    startTransition(() => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    });
  };

  const toggleDay = (day: string) => {
    startTransition(() => {
      setFormData((prev) => ({
        ...prev,
        days: prev.days.includes(day) ? prev.days.filter((d) => d !== day) : [...prev.days, day],
      }));
    });
  };

  const toggleGoal = (goal: string) => {
    startTransition(() => {
      setFormData((prev) => ({
        ...prev,
        goals: prev.goals.includes(goal) ? prev.goals.filter((g) => g !== goal) : [...prev.goals, goal],
      }));
    });
  };

  const handleCycleStartTime = () => {
    const nextIndex = (TIME_OPTIONS.indexOf(formData.startTime) + 1) % TIME_OPTIONS.length;
    handleFieldChange('startTime', TIME_OPTIONS[nextIndex]);
  };

  const handleCycleDuration = () => {
    const nextIndex = (DURATION_OPTIONS.indexOf(formData.duration) + 1) % DURATION_OPTIONS.length;
    handleFieldChange('duration', DURATION_OPTIONS[nextIndex]);
  };

  const handleNext = () => {
    navigation?.navigate('ClassDetailForm', formData);
  };

  const handleOpenLevelDesc = () => {

  }

  const isFormValid =
    formData.name.trim().length > 0 &&
    formData.days.length > 0 &&
    Boolean(formData.startTime) &&
    formData.level.length > 0 &&
    formData.goals.length > 0 &&
    formData.capacity.trim().length > 0;

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
          <FormField.TextInput placeholder="예: 화요일 저녁 초급반" />
        </FormField>

        {/* 수업 요일 */}
        <FormField>
          <FormField.Label label='수업 요일' required />
          <FormField.HelperText type='guide' text='여러 개 선택할 수 있어요' />
          <FormField.ChipGroup
            variant='circle'
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
            value={days}
            onChange={setDays}
            />
        </FormField>

        {/* 시작 시각 */}
        <View className='flex-row w-full gap-sm'>
          <FormField className='flex-auto'>
            <FormField.Label label="시작 시각" required />
            <FormField.Select
              value={startTime}
              placeholder='오후 7:00'
              onPress={() => console.log('Open Time Picker Modal')}
            />
          </FormField>
          <FormField className='flex-auto'>
            <FormField.Label label="수업 길이" required />
            <FormField.Select
              value={startTime}
              placeholder='50분'
              onPress={() => console.log('Open Time Picker Modal')}
            />
          </FormField>
        </View>

        {/* 정원 */}
        <FormField>
          <FormField.Label label="정원" required />
          <FormField.TextInput placeholder="예: 10 (최대 인원)" suffix="명" keyboardType="numeric" />
        </FormField>

        {/* 나이대 */}
        <FormField>
          <FormField.Label label='나이대' required />
          <FormField.HelperText type='guide' text='여러 개 선택할 수 있어요' />
          <FormField.ChipGroup
            variant='pill'
            multiple
            options={[
              { label: '어린이 (5-7세)', value: 'PRESCHOOL' },
              { label: '초등 (8-13세)', value: 'ELEMENTARY' },
              { label: '청소년 (14-19세)', value: 'TEEN' },
              { label: '성인 (20-59세)', value: 'ADULT' },
              { label: '시니어 (60세~)', value: 'SENIOR' },
            ]}
            value={days}
            onChange={setDays}
            />
        </FormField>

        {/* 수준 */}
        <FormField>
          <FormField.Label
            label="수준"
            required
            rightAction={
              <TouchableOpacity onPress={() => {}}>
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
            value={level}
            onChange={setLevel}
          />
        </FormField>

        {/* 특성 */}
        <FormField>
          <FormField.Label label='특성(수업목표)' required />
          <FormField.HelperText type='guide' text='여러 개 선택할 수 있어요' />
          <FormField.ChipGroup
            variant='pill'
            multiple
            options={[
              { label: '완영 목표', value: 'PRESCHOOL' },
              { label: '자세 교정', value: 'ELEMENTARY' },
              { label: '체력 증진', value: 'TEEN' },
              { label: '기초 적응', value: 'ADULT' },
              { label: '기타', value: 'SENIOR' },
            ]}
            value={days}
            onChange={setDays}
            />
        </FormField>

        <Button label="다음 · 회원 등록"
          // disabled={!isFormValid}
          onPress={() => navigation?.navigate('ClassMember')}
          className="mt-md"
        />

      </View>
    </ScreenLayout>
  );
};
