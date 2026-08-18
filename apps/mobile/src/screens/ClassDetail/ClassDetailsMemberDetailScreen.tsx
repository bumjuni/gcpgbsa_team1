import React, { useCallback, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Card } from '../../components/card/Card';
import { FormField } from '../../components/form/FormField';
import { EnrollmentStudent } from '../../api/enrollment';
import { useFocusEffect } from '@react-navigation/native';
import { studentApi } from '../../api/student';

const ReadOnlyBox = ({ value }: { value: string }) => (
  <View className="h-14 justify-center bg-surface-muted border border-hairline-border-strong rounded-md px-md">
    <Text className="text-base text-ink">{value}</Text>
  </View>
);

export const ClassDetailsMemberDetailScreen = ({ navigation, route }: any) => {
  const { studentId, enrollmentMemo } = route?.params ?? {};
  const [student, setStudent] = useState<EnrollmentStudent>();

  const fetchStudentDetail = async () => {
      try {
        const data = await studentApi.getStudentDetail(studentId);
        setStudent(data);
      } catch (err: any) {
        console.error(err);
      }
    };

    useFocusEffect(
      useCallback(() => {
        fetchStudentDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])
    );



  const handleEdit = () => {
    navigation?.navigate('ClassDetailsMemberEdit', {student, enrollmentMemo});
  };

  if (!student) return null;

  return (
    <ScreenLayout title="회원 상세" showBackButton>
      <View className="items-end pt-md mb-sm">
        <Pressable onPress={handleEdit}>
          <Text className="text-primary text-sm font-medium">수정하기</Text>
        </Pressable>
      </View>

      <Card className="p-md pb-xl">
        <View className="flex-row gap-sm">
          <FormField className="flex-auto">
            <FormField.Label label="이름" />
            <ReadOnlyBox value={student.name} />
          </FormField>
          <FormField className="flex-auto">
            <FormField.Label label="출생년도" />
            <ReadOnlyBox value={String(student.birth_year)} />
          </FormField>
        </View>

        <View className="flex-row gap-sm">
          <FormField className="flex-auto">
            <FormField.Label label="전화번호" />
            <ReadOnlyBox value={student.phone as string} />
          </FormField>
          <FormField className="flex-auto">
            <FormField.Label label="성별" />
            <View className="flex-row gap-xs">
              {[
                { label: '남', value: 'M' },
                { label: '여', value: 'F' },
              ].map((opt) => (
                <View
                  key={opt.value}
                  className={`items-center justify-center border px-sm py-sm rounded-md ${
                    student.gender === opt.value
                      ? 'bg-primary-subtle border-primary'
                      : 'border-hairline-border-strong'
                  }`}
                >
                  <Text
                    className={`text-base ${student.gender === opt.value ? 'text-primary font-bold' : 'text-ink'}`}
                  >
                    {opt.label}
                  </Text>
                </View>
              ))}
            </View>
          </FormField>
        </View>

        <FormField className="mb-0">
          <FormField.Label label="비고" />
          <ReadOnlyBox value={enrollmentMemo} />
        </FormField>
      </Card>
    </ScreenLayout>
  );
};
