import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, LayoutChangeEvent } from 'react-native';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Button } from '../../components/button/Button';
import { Card } from '../../components/card/Card';
import { FormField } from '../../components/form/FormField';
import { useClassStore } from '../../stores/useClassStore';
import { enrollmentApi, EnrollmentResponse } from '../../api/enrollment';
import { useFocusEffect } from '@react-navigation/native';
import { GenderType } from '../../types/member';
import { GENDER_MAP } from '../../utils/classSchedule';

type ClassDetailsTab = '수업진행' | '반정보' | '명단' | '리포트';

const TABS: ClassDetailsTab[] = ['수업진행', '반정보', '명단', '리포트'];

const MAX_MEMBERS = 50;

interface NewMemberFormState {
  name: string;
  birth_year: string;
  phone: string;
  gender: string;
  notes: string;
}

const INITIAL_FORM_STATE: NewMemberFormState = {
  name: '',
  birth_year: '',
  phone: '',
  gender: '',
  notes: '',
};

export const ClassDetailsMemberTabScreen = ({ navigation }: any) => {
  const { currentClass, updateClass } = useClassStore();
  const [tabRowWidth, setTabRowWidth] = useState(0);
  const [activeTabLayout, setActiveTabLayout] = useState({ x: 0, width: 0 });
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [formData, setFormData] = useState<NewMemberFormState>(INITIAL_FORM_STATE);

  const [enrollment, setEnrollments] = useState<EnrollmentResponse[]>([]);

  const fetchEnrollments = async () => {
    try {
      if (!currentClass) return;
        const data = await enrollmentApi.getEnrollments(currentClass.id);
        setEnrollments(data);
      } catch (err: any) {
        console.error(err);
      }
    };

    // 2. useEffect 대신 useFocusEffect와 useCallback 사용
    useFocusEffect(
      useCallback(() => {
        fetchEnrollments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])
    );

  if (!currentClass) return null;

  const handleTabPress = (tab: ClassDetailsTab) => {
    if (tab === '명단') return;
    if (tab === '수업진행') navigation?.navigate('ClassDetailsLessonTab');
    if (tab === '반정보') navigation?.navigate('ClassDetailsInfoTab');
    if (tab === '리포트') navigation?.navigate('ClassDetailsReportTab');
  };

  const handleMemberPress = (studentId: number) => {
    const target = enrollment.find((e) => e.student.id === studentId);
    if (!target) return;
    navigation?.navigate('ClassDetailsMemberDetail', { studentId, enrollment: target.enrollment });
  };

  const handleFieldChange = <K extends keyof NewMemberFormState>(key: K, value: string) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmitNewMember = async () => {
     if (!currentClass) {
       console.error('classId가 없습니다. 이전 단계(반 생성)가 정상적으로 완료되었는지 확인해주세요.');
       return;
     }
    try {
       setIsAddingMember(true)
       const response = await enrollmentApi.createEnrollment({
         class_id: currentClass.id,
         name: formData.name,
         gender: formData.gender ? formData.gender as GenderType : undefined,
         phone: formData.phone,
         birth_year: formData.birth_year ? Number(formData.birth_year) : undefined,
         memo: formData.notes,
       });
       console.log("ClassDetailsMemberTabScreen: ",response)
       setEnrollments((prev) => [
         ...prev,
         response,
       ]);
       updateClass({ student_count: (currentClass.student_count ?? 0) + 1 });
     } catch (err) {
       console.error(`${formData.name} 회원 등록 실패`, err);
     } finally {
       setIsAddingMember(false);
       setFormData(INITIAL_FORM_STATE);
     }
   };


  const isMemberLimitReached = enrollment.length >= MAX_MEMBERS;

  const handleTabRowLayout = (e: LayoutChangeEvent) => {
    setTabRowWidth(e.nativeEvent.layout.width);
  };

  const handleActiveTabLayout = (e: LayoutChangeEvent) => {
    setActiveTabLayout({ x: e.nativeEvent.layout.x, width: e.nativeEvent.layout.width });
  };

  const indicatorWidth = tabRowWidth * 0.25;
  const indicatorLeft = activeTabLayout.x + activeTabLayout.width / 2 - indicatorWidth / 2;

  return (
    <ScreenLayout title={currentClass.name} showBackButton>
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
        <Text className="text-base font-bold text-ink mb-sm">현재 인원 {enrollment.length}명</Text>

        {enrollment.map((item) => (
          <Card
            key={item.student.id}
            onPress={() => handleMemberPress(item.student.id)}
            className="flex-row items-center justify-between px-md py-sm mb-md"
          >
            <View className="flex-row items-center flex-1">
              <View className="w-xl h-xl rounded-full bg-status-present-subtle items-center justify-center mr-sm">
                <Text className="text-sm font-bold text-status-present">✓</Text>
              </View>
              <View>
                <Text className="text-body-strong text-ink">{item.student.name}</Text>
                <Text className="text-caption text-ink-secondary mt-0.5">
                  {GENDER_MAP[item.student.gender]} · {new Date().getFullYear() - Number(item.student.birth_year)}세
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
                  value={formData.birth_year}
                  onChangeText={(text) => handleFieldChange('birth_year', text)}
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
                    { label: '남', value: 'MALE' },
                    { label: '여', value: 'FEMALE' },
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
              label={`+ 회원 추가하기`}
            // label={`+ 회원 추가하기 (${MEMBERS.length}/${MAX_MEMBERS})`}
            variant={isMemberLimitReached ? 'disabled' : 'secondary'}
            onPress={() => setIsAddingMember(true)}
            disabled={isMemberLimitReached}
          />
        )}
      </View>
    </ScreenLayout>
  );
};
