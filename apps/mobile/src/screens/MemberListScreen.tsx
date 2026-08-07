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

const initialMembers: Member[] = [{ id: '1', name: '김수영', age: 8, level: '초급' }];

export const MemberListScreen = ({ navigation }: any) => {
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
        <View className="h-1 rounded-full bg-surface-muted mb-md overflow-hidden">
          <View className="h-1 w-4/5 rounded-full bg-primary" />
        </View>

        <Text className="text-sm text-ink-teriary font-medium mb-md">2단계 · 회원 등록</Text>

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
      </View>
    </ScreenLayout>
  );
};
