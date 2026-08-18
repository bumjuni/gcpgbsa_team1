import React, { useState, useTransition } from 'react';
import { View } from 'react-native';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Button } from '../../components/button/Button';
import { Card } from '../../components/card/Card';
import { FormField } from '../../components/form/FormField';
import { ConfirmModal } from '../../components/ConfirmModal';
import { enrollmentApi, EnrollmentCreate, EnrollmentDetail, EnrollmentStudent } from '../../api/enrollment';
import { studentApi } from '../../api/student';

interface MemberEditFormState {
  name: string;
  birthYear: string;
  phone: string;
  gender: string;
  notes: string;
}

interface RouteParams {
  student?: EnrollmentStudent;
  enrollment?: EnrollmentDetail;
}

export const ClassDetailsMemberEditScreen = ({ navigation, route }: any) => {
  const { student, enrollment } = route?.params ?? {} as RouteParams;

  const [formData, setFormData] = useState<MemberEditFormState>({
    name: student.name,
    birthYear: String(student.birth_year),
    phone: student.phone ?? "",
    gender: student.gender ?? "",
    notes: enrollment.memo ?? "",
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [, startTransition] = useTransition();

  const handleFieldChange = <K extends keyof MemberEditFormState>(key: K, value: string) => {
    startTransition(() => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    });
  };

  const currentYear = new Date().getFullYear();
  const age = currentYear - Number(formData.birthYear);
  const canSave =
    formData.name.trim().length > 0 &&
    /^01[0-9]-\d{3,4}-\d{4}$/.test(formData.phone) &&
    /^\d{4}$/.test(formData.birthYear) &&
    age >= 0 &&
    age <= 19 &&
    Boolean(formData.gender);

  const handleCancel = () => {
    navigation?.goBack();
  };

  const handleSave = async () => {
    try {
      let enrollmentResult;
      if (enrollment.memo !== formData.notes) {
        const payload: EnrollmentDetail = {
          ...enrollment,
          memo: formData.notes
        }
        enrollmentResult = await enrollmentApi.updateEnrollment(enrollment.id, payload);
      }

      const isStudentChanged =
            student.name !== formData.name ||
            student.gender !== formData.gender ||
            student.phone !== formData.phone ||
            student.birth_year !== formData.birthYear;

      if (isStudentChanged) {
        const payload: EnrollmentStudent = {
          ...student,
          name: formData.name,
          gender: formData.gender,
          phone: formData.phone,
          birth_year: formData.birthYear,
        };
        await studentApi.updateStudent(student.id, payload);
      }

      navigation?.navigate('ClassDetailsMemberDetail', {
            studentId: student.id,
            enrollment: enrollmentResult ?? enrollment,
      });
    } catch (error) {
        console.error('수정 중 오류 발생:', error);
    }
  };

  const handleConfirmDelete = () => {
    setIsDeleteModalOpen(false);
    enrollmentApi.deleteEnrollment(enrollment.id);
    navigation?.navigate('ClassDetailsMemberTab');
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
                <Button label="저장하기" onPress={handleSave} variant="primary" disabled={!canSave} />
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
