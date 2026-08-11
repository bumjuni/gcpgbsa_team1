import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavStackParamList } from './types';

import { ClassListScreen } from '../screens/ClassListScreen';
import { ClassRegisterScreen } from '../screens/ClassRegisterScreen';
import { ClassMemberScreen } from '../screens/ClassMemberScreen/ClassMemberScreen';
import { ClassCreateCompleteScreen } from '../screens/ClassCreateCompleteScreen';
import { LevelGuideScreen } from '../screens/LevelGuideScreen';
import { LessonPlanCreateScreen } from '../screens/LessonPlanCreateScreen';
import { LessonPlanGeneratingScreen } from '../screens/LessonPlanGeneratingScreen';
import { LessonPlanConfirmScreen } from '../screens/LessonPlanConfirmScreen';
import { LessonPlanCompleteScreen } from '../screens/LessonPlanCompleteScreen';

const Stack = createNativeStackNavigator<NavStackParamList>();

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="ClassList"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen name="ClassList" component={ClassListScreen} />
      <Stack.Screen name="ClassRegister" component={ClassRegisterScreen} />
      <Stack.Screen name="ClassMember" component={ClassMemberScreen} />
      <Stack.Screen name="ClassCreateComplete" component={ClassCreateCompleteScreen} />
      <Stack.Screen name="LevelGuide" component={LevelGuideScreen} />
      <Stack.Screen name="LessonPlanCreate" component={LessonPlanCreateScreen} />
      <Stack.Screen name="LessonPlanGenerating" component={LessonPlanGeneratingScreen} />
      <Stack.Screen name="LessonPlanConfirm" component={LessonPlanConfirmScreen} />
      <Stack.Screen name="LessonPlanComplete" component={LessonPlanCompleteScreen} />
    </Stack.Navigator>
  );
};
