import React from 'react';
import { ScreenLayout } from '../components/ScreenLayout';
import { ClassInfoForm } from '../components/ClassInfoForm';

export const ClassRegisterScreen = ({ navigation }: any) => {
  return (
    <ScreenLayout title="반 정보 입력" showBackButton>
      <ClassInfoForm mode="create" navigation={navigation} />
    </ScreenLayout>
  );
};
