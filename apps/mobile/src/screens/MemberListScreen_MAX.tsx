import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { Button } from '../components/button/Button';


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
