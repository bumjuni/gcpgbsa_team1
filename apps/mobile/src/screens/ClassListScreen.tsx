import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { Button } from '../components/button/Button';
import { classroomApi, SwimClass } from '../api/classroom';
import { Card } from '../components/card/Card';
import { Badge } from '../components/badge/Badge';

export const ClassListScreen = ({ navigation }: any) => {
  const [classes, setClasses] = useState<SwimClass[]>([]);

  const fetchClasses = async () => {
      try {
        const data = await classroomApi.getClasses(1);
        setClasses(data);
        console.log(data);
      } catch (err: any) {
        console.error(err);
      }
    };

    useEffect(() => {
      fetchClasses();
    }, []);

    const handleClassPress = (classId: number) => {
      navigation?.navigate('ClassDetail', { classId });
    };

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
      {classes.length > 0 ? (
        classes.map((item: SwimClass) => (
          // const statusStyle = planStatusStyles[item.planStatusType];
            <Card
              key={item.id}
              variant='default'
              onPress={() => handleClassPress(item.id)}
              className="px-md py-sm mb-md"
            >
              <View className="flex-row items-center justify-between mb-xxs">
                <Text className="text-title-sm text-ink">
                  {item.name}
                </Text>
                <Badge variant='primary' text={`${item.status}`} />
              </View>
              <Text className="text-xs text-ink-teriary">
                {item.capacity} / {item.age_groups} · {item.duration_min}
              </Text>
            </Card>
        ))
      ) : (
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
      )}
    </ScreenLayout>
  );
};
