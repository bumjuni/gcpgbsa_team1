import React, { useState, useTransition } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { Button } from '../components/button/Button';
import { Card } from '../components/card/Card';
import { FormField } from '../components/form/FormField';
import { Badge } from '../components/badge/Badge';

interface MemberFormState {
  name: string;
  birthYear: string;
  phone: string;
  notes: string;
}

const initialFormState: MemberFormState = Object.freeze({
  name: '',
  birthYear: '',
  phone: '',
  notes: '',
});

interface Member {
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

export const MemberRegisterScreen = ({ navigation }: any) => {
  const [formData, setFormData] = useState<MemberFormState>(initialFormState);
  const [isEntryComplete, setIsEntryComplete] = useState(false);
  const [, startTransition] = useTransition();
  const [members, setMembers] = useState<Member[]>(initialMembers);


  const handleFieldChange = <K extends keyof MemberFormState>(key: K, value: MemberFormState[K]) => {
    startTransition(() => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    });
  };

  const handleDeleteMember = () => {
    startTransition(() => {
      setFormData(initialFormState);
      setIsEntryComplete(false);
    });
  };

  const handleCompleteEntry = () => {
    setIsEntryComplete(true);
  };

  const handleCreateClass = () => {
    navigation?.navigate('ClassCreateComplete', { members: [formData] });
  };

  const isEntryValid =
    formData.name.trim().length > 0 &&
    formData.birthYear.trim().length > 0 &&
    formData.phone.trim().length > 0;

  return (
    <ScreenLayout title="회원 등록" showBackButton footer={<Button label="반 만들기" onPress={handleCreateClass} />}>
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
          {/* member list */}
          {members.map((member, index) => (
            <Card
              key={member.id}
              className="flex-row items-center justify-between border border-surface-hairline rounded-md px-md py-sm mb-md"
            >
              {/* 회원정보 */}
              <View className='align-middle flex-row py-xxs'>
                <View className="w-xl h-xl rounded-full bg-status-present-subtle items-center justify-center mr-xs">
                  <Text className="text-sm font-bold text-status-present">✓</Text>
                </View>
                <View className='gap-xxs'>
                  <Text className="text-button-sm">
                    회원 {index + 1} · {member.name}
                  </Text>
                  <Text className="text-label text-ink-secondary">
                    {member.age}세 · {member.level}
                    </Text>
                </View>
              </View>

              {/* delete button */}
              <Badge variant='danger' onPress={() => handleDeleteMember(member.id)} text='삭제' />
            </Card>
          ))}

        ) : (

          {/* member register form */}
          <Card className="p-md mb-md">
            <View className="flex-row items-center justify-between mb-md">
              <Text className="text-base font-bold text-ink">회원 1</Text>
              <Badge variant='danger' onPress={handleDeleteMember} text='삭제' />
            </View>

            <View className="flex-row gap-sm">
                <FormField className='flex-auto'>
                  <FormField.Label label="이름"/>
                  <FormField.TextInput placeholder='예: 김수영' />
                </FormField>

                <FormField className='flex-auto'>
                  <FormField.Label label="출생년도"/>
                  <FormField.TextInput placeholder='1990' keyboardType='numeric'/>
              </FormField>
            </View>
            <FormField>
              <FormField.Label label='전화번호'/>
              <FormField.TextInput placeholder='010-0000-0000' />
            </FormField>

            <FormField>
              <FormField.Label label='비고'/>
              <FormField.TextInput placeholder='예: 통원치료 중, 자유형 호흡이 잘 안됨' />
            </FormField>

            <Button
              label={isEntryComplete ? '입력 완료됨' : '입력 완료'}
              variant="secondary"
              onPress={handleCompleteEntry}
              disabled={isEntryComplete || !isEntryValid}
            />
          </Card>
        )}
      </View>
    </ScreenLayout>
  );
};
