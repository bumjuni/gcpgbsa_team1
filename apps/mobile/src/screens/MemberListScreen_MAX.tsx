import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { Button } from '../components/Button';

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

export const MemberListScreen_MAX = ({ navigation }: any) => {
  const [members, setMembers] = useState<Member[]>(initialMembers);

  const handleDeleteMember = (id: string) => {
    setMembers((prev) => prev.filter((member) => member.id !== id));
  };

  const handleAddMember = () => {
    navigation?.navigate('MemberRegister');
  };

  const handleCreateClass = () => {
    navigation?.navigate('ClassCreateComplete', { members });
  };

  const isMemberLimitReached = members.length >= MAX_MEMBERS;

  return (
    <ScreenLayout title="회원 등록" showBackButton footer={<Button label="반 만들기" onPress={handleCreateClass} />}>
      <View className="pt-md pb-xl">

        {/*progress bar*/}
        <View className="mb-sm flex-auto flex-row gap-2">
          <View className="flex-1 h-1 rounded-full bg-primary" />
          <View className="flex-1 h-1 rounded-full bg-primary" />
        </View>
        <Text className="text-label text-primary font-medium mb-md">2단계 · 회원 등록</Text>

        <View className="bg-primary-subtle rounded-md px-md py-sm mb-lg">
          <Text className="text-sm font-bold text-primary mb-xxs">지금 다 몰라도 괜찮아요</Text>
          <Text className="text-xs text-primary">회원 추가는 반을 만든 뒤에도 할 수 있어요</Text>
        </View>

        {members.map((member, index) => (
          <View
            key={member.id}
            className="flex-row items-center justify-between border border-surface-hairline rounded-md px-md py-sm mb-md"
          >
            <View className="flex-row items-center flex-1">
              <View className="w-6 h-6 rounded-full bg-status-presnet_subtle items-center justify-center mr-xs">
                <Text className="text-xs font-bold text-status-present">✓</Text>
              </View>
              <View>
                <Text className="text-base font-bold text-ink">
                  회원 {index + 1} · {member.name}
                </Text>
                <Text className="text-xs text-ink-teriary">
                  {member.age}세 · {member.level}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => handleDeleteMember(member.id)}
              hitSlop={8}
              className="bg-status-danger_subtle rounded-sm px-xs py-xxs"
            >
              <Text className="text-xs font-bold text-status-danger">삭제</Text>
            </Pressable>
          </View>
        ))}

        <Pressable
          onPress={handleAddMember}
          disabled={isMemberLimitReached}
          className={`h-14 rounded-md border items-center justify-center ${
            isMemberLimitReached ? 'border-surface-strong bg-surface-muted' : 'border-primary bg-surface-canvas'
          }`}
        >
          <Text className={`text-sm font-bold ${isMemberLimitReached ? 'text-ink-teriary' : 'text-primary'}`}>
            + 회원 추가하기 ({members.length}/{MAX_MEMBERS})
          </Text>
        </Pressable>

        {isMemberLimitReached && (
          <Text className="text-xs text-ink-teriary text-center mt-xs">최대 10명까지 등록할 수 있어요</Text>
        )}
      </View>
    </ScreenLayout>
  );
};
