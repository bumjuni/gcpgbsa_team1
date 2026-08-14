import React, { useState, useTransition } from 'react';
import { View, Text, Pressable, LayoutChangeEvent } from 'react-native';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Button } from '../../components/button/Button';
import { Card } from '../../components/card/Card';
import { FormField } from '../../components/form/FormField';
import { useClassStore } from '../../stores/useClassStore';

type ClassDetailsTab = '수업진행' | '반정보' | '명단' | '리포트';

const TABS: ClassDetailsTab[] = ['수업진행', '반정보', '명단', '리포트'];

const MAX_MEMBERS = 10;

interface ClassMemberSummary {
  id: string;
  name: string;
  genderLabel: string;
  age: number;
}

const MEMBERS: ClassMemberSummary[] = [
  { id: '1', name: '김수영', genderLabel: '남', age: 8 },
  { id: '2', name: '이도윤', genderLabel: '여', age: 9 },
  { id: '3', name: '박서준', genderLabel: '남', age: 7 },
  { id: '4', name: '최윤아', genderLabel: '여', age: 10 },
  { id: '5', name: '정하은', genderLabel: '남', age: 8 },
  { id: '6', name: '강민준', genderLabel: '여', age: 9 },
  { id: '7', name: '조서연', genderLabel: '남', age: 6 },
  { id: '8', name: '윤지호', genderLabel: '여', age: 11 },
];

interface NewMemberFormState {
  name: string;
  birthYear: string;
  phone: string;
  gender: string;
  notes: string;
}

const INITIAL_FORM_STATE: NewMemberFormState = {
  name: '',
  birthYear: '',
  phone: '',
  gender: '',
  notes: '',
};

export const ClassDetailsMemberTabScreen = ({ navigation }: any) => {
  const { currentClass } = useClassStore();
  const [tabRowWidth, setTabRowWidth] = useState(0);
  const [activeTabLayout, setActiveTabLayout] = useState({ x: 0, width: 0 });
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [formData, setFormData] = useState<NewMemberFormState>(INITIAL_FORM_STATE);
  const [, startTransition] = useTransition();

  const handleTabPress = (tab: ClassDetailsTab) => {
    if (tab === '명단') return;
    if (tab === '수업진행') navigation?.navigate('ClassDetailsLessonTab', { classId, className });
    if (tab === '반정보') navigation?.navigate('ClassDetailsInfoTab', { classId, className });
    if (tab === '리포트') navigation?.navigate('ClassDetailsReportTab', { classId, className });
  };

  const handleMemberPress = (member: ClassMemberSummary) => {
    navigation?.navigate('ClassDetailsMemberDetail', { classId, memberId: member.id });
  };

  const handleFieldChange = <K extends keyof NewMemberFormState>(key: K, value: string) => {
    startTransition(() => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    });
  };

  const handleSubmitNewMember = () => {
    // TODO: enrollmentApi.createEnrollment 연동 필요
    setIsAddingMember(false);
    setFormData(INITIAL_FORM_STATE);
  };

  const isMemberLimitReached = MEMBERS.length >= MAX_MEMBERS;

  const handleTabRowLayout = (e: LayoutChangeEvent) => {
    setTabRowWidth(e.nativeEvent.layout.width);
  };

  const handleActiveTabLayout = (e: LayoutChangeEvent) => {
    setActiveTabLayout({ x: e.nativeEvent.layout.x, width: e.nativeEvent.layout.width });
  };

  const indicatorWidth = tabRowWidth * 0.25;
  const indicatorLeft = activeTabLayout.x + activeTabLayout.width / 2 - indicatorWidth / 2;

  return (
    <ScreenLayout title={className} showBackButton>
      <View
        className="relative -mx-md px-md pt-md flex-row justify-between border-b border-hairline mb-md"
        onLayout={handleTabRowLayout}
      >
        {TABS.map((tab) => {
          const active = tab === '명단';
          return (
            <Pressable
              key={tab}
              onPress={() => handleTabPress(tab)}
              onLayout={active ? handleActiveTabLayout : undefined}
              className="items-center pb-md"
              hitSlop={{ top: 10, bottom: 10 }}
            >
              <Text className={`text-body-strong ${active ? 'text-primary' : 'text-ink-secondary'}`}>
                {tab}
              </Text>
            </Pressable>
          );
        })}
        {tabRowWidth > 0 && (
          <View
            className="h-1 bg-primary absolute bottom-0"
            style={{ width: indicatorWidth, left: indicatorLeft }}
          />
        )}
      </View>

      <View className="pb-xl">
        <Text className="text-base font-bold text-ink mb-sm">현재 인원 {MEMBERS.length}명</Text>

        {MEMBERS.map((member) => (
          <Card
            key={member.id}
            onPress={() => handleMemberPress(member)}
            className="flex-row items-center justify-between px-md py-sm mb-md"
          >
            <View className="flex-row items-center flex-1">
              <View className="w-xl h-xl rounded-full bg-status-present-subtle items-center justify-center mr-sm">
                <Text className="text-sm font-bold text-status-present">✓</Text>
              </View>
              <View>
                <Text className="text-body-strong text-ink">{member.name}</Text>
                <Text className="text-caption text-ink-secondary mt-0.5">
                  {member.genderLabel} · {member.age}세
                </Text>
              </View>
            </View>
            <Text className="text-ink-tertiary">›</Text>
          </Card>
        ))}

        {isAddingMember ? (
          <Card className="p-md">
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

            <FormField>
              <FormField.Label label="비고" />
              <FormField.TextInput
                placeholder="예: 통원치료 중, 자유형 호흡이 잘 안됨"
                value={formData.notes}
                onChangeText={(text) => handleFieldChange('notes', text)}
              />
            </FormField>

            <Button label="추가하기" variant="secondary" onPress={handleSubmitNewMember} />
          </Card>
        ) : (
          <Button
            label={`+ 회원 추가하기 (${MEMBERS.length}/${MAX_MEMBERS})`}
            variant={isMemberLimitReached ? 'disabled' : 'secondary'}
            onPress={() => setIsAddingMember(true)}
            disabled={isMemberLimitReached}
          />
        )}
      </View>
    </ScreenLayout>
  );
};
