import React from 'react';
import { ScreenLayout } from '../../components/ScreenLayout';
import { ClassInfoForm } from '../../components/ClassInfoForm';

export const ClassDetailsInfoEditScreen = ({ navigation }: any) => {
  return (
    <ScreenLayout title="반정보 수정" showBackButton>
      <ClassInfoForm mode="edit" navigation={navigation} />
    </ScreenLayout>
  );
};
