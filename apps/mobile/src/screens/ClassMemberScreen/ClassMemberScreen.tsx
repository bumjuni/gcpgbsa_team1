import React, { useRef, useState } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { MemberRegisterForm } from './MemberRegisterForm';
import { MemberList } from './MemberList';
import { Button } from '../../components/button/Button';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Card } from '../../components/card/Card';
import { MemberFormValues } from '../../hooks/memberForm.schema'; // 추가
import { Member } from '../../types/member';
import { enrollmentApi } from '../../api/enrollment';

const MAX_MEMBERS = 50; // 사진 간 (0/50) vs (1/10) 불일치 - 확인 후 확정 필요

export const ClassMemberScreen = ({ navigation, route }: any) => {
  const classId = route?.params?.classId; // 이전 단계에서 이미 생성된 반의 id
  const [members, setMembers] = useState<Member[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(true); // 진입 시 첫 폼 기본 노출
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const isMemberLimitReached = members.length >= MAX_MEMBERS;

  const handleCompleteEntry = (formData: MemberFormValues) => { // MemberFormState -> MemberFormValues
    const newMember: Member = { id: `${Date.now()}-${Math.random()}`, ...formData };
    setMembers((prev) => [...prev, newMember]);
    setIsFormOpen(false);
  };

  const handleDeleteForm = () => {
    setIsFormOpen(false);
  };

  const handleDeleteMember = (id: string) => {
    setMembers((prev) => prev.filter((member) => member.id !== id));
  };

  const handleAddMember = () => {
    setIsFormOpen(true);
  };

  // 네트워크 오류 시 1회만 재시도
  const enrollWithRetry = async (member: Member) => {
    const payload = {
      class_id: classId,
      name: member.name,
      phone: member.phone || undefined,
      birth_year: member.birthYear ? Number(member.birthYear) : undefined,
      memo: member.notes || undefined,
    };
    try {
      await enrollmentApi.createEnrollment(payload);
    } catch {
      await enrollmentApi.createEnrollment(payload); // 재시도 1회
    }
  };

  const handleCreateClass = async () => {
    if (!classId) {
      console.error('classId가 없습니다. 이전 단계(반 생성)가 정상적으로 완료되었는지 확인해주세요.');
      return;
    }
    setIsSubmitting(true);
    try {
      for (const member of members) {
        try {
          await enrollWithRetry(member);
        } catch (err) {
          console.error(`${member.name} 회원 등록 실패 (재시도 후에도 실패):`, err);
        }
      }
      navigation?.navigate('ClassCreateComplete', { classId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenLayout
      title="회원 등록"
      showBackButton
      footer={<Button label="반 만들기" onPress={handleCreateClass} disabled={isSubmitting} />}
    >
      <ScrollView ref={scrollViewRef} className="pt-md pb-xl">
        <View className="mb-sm flex-auto flex-row gap-2">
          <View className="flex-1 h-1 rounded-full bg-primary" />
          <View className="flex-1 h-1 rounded-full bg-primary" />
        </View>
        <Text className="text-label text-primary font-medium mb-md">2단계 · 회원 등록</Text>

        <Card variant='notice' className="bg-primary-subtle rounded-md px-md py-sm mb-lg">
          <Text className="text-sm font-bold text-primary mb-xxs">지금 다 몰라도 괜찮아요</Text>
          <Text className="text-xs text-primary">회원 추가는 반을 만든 뒤에도 할 수 있어요</Text>
        </Card>

        {members.length > 0 && <MemberList members={members} onDelete={handleDeleteMember} />}

        {isFormOpen && (
          <View onLayout={() => scrollViewRef.current?.scrollToEnd({ animated: true })}>
            <MemberRegisterForm
              memberIndex={members.length + 1}
              onComplete={handleCompleteEntry}
              onDelete={handleDeleteForm}
            />
          </View>
        )}

        {!isFormOpen && (
          <>
            <Button
              label={`+ 회원 추가하기 (${members.length}/${MAX_MEMBERS})`}
              variant={isMemberLimitReached ? 'disabled' : 'secondary'}
              onPress={handleAddMember}
              disabled={isMemberLimitReached}
            />
            {isMemberLimitReached && (
              <Text className='text-label text-ink-tertiary self-center mt-sm'>
                최대 {MAX_MEMBERS}명까지 등록할 수 있어요
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </ScreenLayout>
  );
};
