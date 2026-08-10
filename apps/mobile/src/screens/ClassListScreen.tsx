import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { Button } from '../components/button/Button';
import { classroomApi, SwimClass } from '../api/classroom';

export const ClassListScreen = ({ navigation }: any) => {
  const [classes, setClasses] = useState<SwimClass[]>([]);

  const fetchClasses = async () => {
      try {
        const data = await classroomApi.getClasses(1);
        setClasses(data);
        console.log(classes);
      } catch (err: any) {
        console.error(err);
      }
    };

    useEffect(() => {
      fetchClasses();
    }, []);

  return (
    <ScreenLayout
      title="내 반 목록"
      footer={
        <Button
          label="반 등록하기"
          onPress={() => navigation?.navigate('ClassRegister')}
        />
      }
    >
      <View className="flex-1 justify-center items-center py-xxl">
        <View className="w-xxl h-xxl bg-canvas-muted rounded-full justify-center items-center mb-md">
          <Text className="text-2xl text-ink-teriary">☰</Text>
        </View>
        <Text className="text-body font-bold text-ink mb-xs">
          아직 등록한 반이 없어요
        </Text>
        <Text className="text-sm text-ink-secondary text-center">
          반을 등록하면 수업안을 만들 수 있어요
        </Text>
      </View>
    </ScreenLayout>
  );
};
