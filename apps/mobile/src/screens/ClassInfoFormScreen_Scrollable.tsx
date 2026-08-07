import React, { useState, useTransition } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { FormField } from '../components/FormField';
import { Button } from '../components/Button';
import { Card } from '../components/card/Card';

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

export const ClassInfoFormScreen_Scrollable = ({ navigation }: any) => {
  const [formData, setFormData] = useState<ClassInfoFormState>(initialFormState);
  const [, startTransition] = useTransition();

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

        {/*progress bar*/}
        <View className="mb-sm flex-auto flex-row gap-2">
          <View className="flex-1 h-1 rounded-full bg-primary" />
          <View className="flex-1 h-1 rounded-full bg-hairline" />
        </View>
        <Text className="text-label text-primary font-medium mb-md">1단계 · 반 정보</Text>

        <FormField
          label="반 이름"
          badgeType="required"
          placeholder="예: 초급반"
          value={formData.name}
          onChangeText={(val) => handleFieldChange('name', val)}
        />

        <View className="mb-md">
          <FieldLabel label="요일" required />
          <View className="flex-row justify-between">
            {DAYS.map((day) => {
              const selected = formData.days.includes(day);
              return (
                <Pressable
                  key={day}
                  onPress={() => toggleDay(day)}
                  className={`w-10 h-10 rounded-full items-center justify-center border ${
                    selected ? 'bg-primary border-primary' : 'bg-surface-muted border-surface-hairline'
                  }`}
                >
                  <Text className={`text-sm font-bold ${selected ? 'text-white' : 'text-ink'}`}>{day}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mb-md">
          <FieldLabel label="수업 시간대" required />
          <View className="flex-row">
            <View className="flex-1 mr-xs">
              <Text className="mb-xxs">
                <Text className="text-sm font-semibold text-ink">시작 시각</Text>
                <Text className="text-xs text-ink-teriary"> · 필수</Text>
              </Text>
              <Pressable
                onPress={handleCycleStartTime}
                className="h-14 px-md rounded-md border border-surface-hairline bg-surface-muted flex-row items-center justify-between"
              >
                <Text className="text-base text-ink">{formData.startTime}</Text>
                <Text className="text-ink-teriary">⌄</Text>
              </Pressable>
            </View>
            <View className="flex-1 ml-xs">
              <Text className="mb-xxs">
                <Text className="text-sm font-semibold text-ink">수업 길이</Text>
                <Text className="text-xs text-ink-teriary"> · 필수</Text>
              </Text>
              <Pressable
                onPress={handleCycleDuration}
                className="h-14 px-md rounded-md border border-surface-hairline bg-surface-muted flex-row items-center justify-between"
              >
                <Text className="text-base text-ink">{formData.duration}분</Text>
                <Text className="text-ink-teriary">⌄</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View className="mb-md">
          <Text className="mb-xs">
            <Text className="text-base font-bold text-ink">정원</Text>
            <Text className="text-xs text-ink-teriary"> · 필수 · 최대 인원</Text>
          </Text>
          <View className="h-14 px-md rounded-md border border-surface-hairline bg-surface-muted flex-row items-center justify-between">
            <TextInput
              className="flex-1 text-base text-ink"
              placeholder="예: 10"
              placeholderTextColor="#8B9198"
              keyboardType="number-pad"
              value={formData.capacity}
              onChangeText={(val) => handleFieldChange('capacity', val)}
            />
            <Text className="text-base text-ink-teriary ml-xs">명</Text>
          </View>
        </View>

        <FormField
          label="장소"
          badgeType="optional"
          placeholder="예: A"
          value={formData.location}
          onChangeText={(val) => handleFieldChange('location', val)}
        />

        <View className="mb-md">
          <FieldLabel label="나이대" />
          <View className="flex-row flex-wrap">
            {AGE_GROUPS.map(({ key, desc }) => {
              const selected = formData.ageGroup === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => handleFieldChange('ageGroup', key)}
                  className={`px-sm py-xs rounded-full border mr-xs mb-xs ${
                    selected ? 'bg-primary border-primary' : 'bg-surface-muted border-surface-hairline'
                  }`}
                >
                  <Text className={`text-sm font-medium ${selected ? 'text-white' : 'text-ink'}`}>
                    {key} {desc}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mb-md">
          <View className="flex-row items-center justify-between mb-xs">
            <FieldLabel label="수준" required />
            <Text className="text-xs text-primary font-medium">레벨 별로 안내 보기</Text>
          </View>
          {LEVELS.map(({ key, desc }) => {
            const selected = formData.level === key;
            return (
              <Card
                key={key}
                variant='default'
                onPress={() => handleFieldChange('level', key)}
                className={`flex-row items-center px-md py-sm rounded-md border mb-xs ${
                  selected ? 'bg-primary-subtle border-primary' : 'bg-surface-muted border-surface-hairline'
                }`}
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 ${
                    selected ? 'border-primary bg-primary' : 'border-surface-hairline'
                  }`}
                />
                <View>
                  <Text className="text-base font-bold text-ink">{key}</Text>
                  <Text className="text-xs text-ink-teriary">{desc}</Text>
                </View>
              </Card>
            );
          })}
        </View>

        <View className="mb-md">
          <FieldLabel label="특성 목표" required />
          <View className="flex-row flex-wrap">
            {GOALS.map((goal) => {
              const selected = formData.goals.includes(goal);
              return (
                <Pressable
                  key={goal}
                  onPress={() => toggleGoal(goal)}
                  className={`px-sm py-xs rounded-full border mr-xs mb-xs ${
                    selected ? 'bg-primary border-primary' : 'bg-surface-muted border-surface-hairline'
                  }`}
                >
                  <Text className={`text-sm font-medium ${selected ? 'text-white' : 'text-ink'}`}>{goal}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Button label="다음 · 회원 등록" onPress={handleNext} disabled={!isFormValid} className="mt-md" />
      </View>
    </ScreenLayout>
  );
};
