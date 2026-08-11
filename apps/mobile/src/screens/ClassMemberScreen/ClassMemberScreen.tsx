import React, { useState, useTransition } from 'react';
import { View, Text } from 'react-native';
import { MemberRegisterForm } from './MemberRegisterForm';
import { MemberList } from './MemberList';
import { Button } from '../../components/button/Button';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Card } from '../../components/card/Card';

export interface Member {
  id: string;
  name: string;
  age: number;
  level: string;
}

const MAX_MEMBERS = 10;

const initialMembers: Member[] = [
  { id: '1', name: '김수영', age: 8, level: '초급' },
  { id: '2', name: '이도윤', age: 9, level: '초급' },
  { id: '3', name: '박서준', age: 7, level: '입문' },
  { id: '4', name: '최유하', age: 10, level: '중급' },
  { id: '5', name: '정하은', age: 8, level: '초급' },
  { id: '6', name: '강민준', age: 9, level: '초급' },
  { id: '7', name: '조서연', age: 6, level: '입문' },
  { id: '8', name: '윤지호', age: 11, level: '중급' },
  { id: '9', name: '임채원', age: 8, level: '초급' },
  { id: '10', name: '한지우', age: 7, level: '초급' },
];

export const ClassMemberScreen = ({ navigation }: any) => {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [, startTransition] = useTransition();

  const isMemberLimitReached = members.length >= MAX_MEMBERS;

  const handleFieldChange = <K extends keyof MemberFormState>(key: K, value: MemberFormState[K]) => {
    startTransition(() => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    });
  };

  // const handleDeleteMember = () => {
  //   startTransition(() => {
  //     setFormData(initialFormState);
  //     setIsEntryComplete(false);
  //   });
  // };

  const handleDeleteMember = (id: string) => {
    setMembers((prev) => prev.filter((member) => member.id !== id));
  };

  const handleCreateClass = () => {
    navigation?.navigate('ClassCreateComplete', { members: [formData] });
  };

  return (
    <ScreenLayout
      title="회원 등록"
      showBackButton
      footer={
        <Button label="반 만들기" onPress={() => navigation?.navigate('ClassCreateComplete')} />
      }>
      <View className="pt-md pb-xl">

        {/* progress bar */}
        <View className="mb-sm flex-auto flex-row gap-2">
          <View className="flex-1 h-1 rounded-full bg-primary" />
          <View className="flex-1 h-1 rounded-full bg-primary" />
        </View>
        <Text className="text-label text-primary font-medium mb-md">2단계 · 회원 등록</Text>

        {/* card */}
        <Card variant='notice' className="bg-primary-subtle rounded-md px-md py-sm mb-lg">
          <Text className="text-sm font-bold text-primary mb-xxs">지금 다 몰라도 괜찮아요</Text>
          <Text className="text-xs text-primary">회원 추가는 반을 만든 뒤에도 할 수 있어요</Text>
        </Card>

        {members.length ? (
          <MemberList members={members} onDelete={() => handleDeleteMember} />
        ) : (
          <MemberRegisterForm />
        )}

        <Button
          label={`+ 회원 추가하기 (${members.length}/${MAX_MEMBERS})`}
          variant={isMemberLimitReached ? 'disabled' : 'secondary'}
          onPress={() => { }}
          disabled={isMemberLimitReached}
        />
        {isMemberLimitReached &&
          <Text className='text-label text-ink-tertiary self-center mt-sm'>
            최대 10명까지 등록할 수 있어요
          </Text>
        }
      </View>
    </ScreenLayout>
  );
};
