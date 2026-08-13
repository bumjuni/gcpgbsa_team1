import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavStackParamList } from './types';

import { ClassListScreen } from '../screens/ClassListScreen';
import { ClassRegisterScreen } from '../screens/ClassRegisterScreen';
import { ClassMemberScreen } from '../screens/ClassMemberScreen/ClassMemberScreen';
import { ClassCreateCompleteScreen } from '../screens/ClassCreateCompleteScreen';
import { LevelGuideScreen } from '../screens/LevelGuideScreen';
import { LessonPlanCreateScreen } from '../screens/LessonPlanCreateScreen';
import { LessonPlanConfirmScreen } from '../screens/LessonPlanConfirmScreen';
import { LessonPlanCompleteScreen } from '../screens/LessonPlanCompleteScreen';
import { LessonPlanEditItemScreen } from '../screens/LessonPlanEditItemScreen';
import { ClassListScreen_Filled } from '../screens/ClassListScreen_Filled';
import { ClassDetailsLessonTabScreen } from '../screens/ClassDetailsLessonTabScreen';
import { ClassDetailsLessonTabScrollTestScreen } from '../screens/ClassDetailsLessonTabScrollTestScreen';
import { ClassDetailsLessonTabDraftScreen } from '../screens/ClassDetailsLessonTabDraftScreen';
import { ClassDetailsLessonTabEmptyScreen } from '../screens/ClassDetailsLessonTabEmptyScreen';
import { ClassDetailsLessonHistoryScreen } from '../screens/ClassDetailsLessonHistoryScreen';
import { ClassDetailsInfoTabScreen } from '../screens/ClassDetailsInfoTabScreen';
import { ClassDetailsInfoEditScreen } from '../screens/ClassDetailsInfoEditScreen';
import { ClassDetailsMemberTabScreen } from '../screens/ClassDetailsMemberTabScreen';
import { ClassDetailsMemberDetailScreen } from '../screens/ClassDetailsMemberDetailScreen';
import { ClassDetailsMemberEditScreen } from '../screens/ClassDetailsMemberEditScreen';

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
      <Stack.Screen name="LessonPlanConfirm" component={LessonPlanConfirmScreen} />
      <Stack.Screen name="LessonPlanComplete" component={LessonPlanCompleteScreen} />
      <Stack.Screen name="LessonPlanEditItem" component={LessonPlanEditItemScreen} />
      <Stack.Screen name="ClassListFilled" component={ClassListScreen_Filled} />
      <Stack.Screen name="ClassDetailsLessonTab" component={ClassDetailsLessonTabScreen} />
      <Stack.Screen name="ClassDetailsLessonTabScrollTest" component={ClassDetailsLessonTabScrollTestScreen} />
      <Stack.Screen name="ClassDetailsLessonTabDraft" component={ClassDetailsLessonTabDraftScreen} />
      <Stack.Screen name="ClassDetailsLessonTabEmpty" component={ClassDetailsLessonTabEmptyScreen} />
      <Stack.Screen name="ClassDetailsLessonHistory" component={ClassDetailsLessonHistoryScreen} />
      <Stack.Screen name="ClassDetailsInfoTab" component={ClassDetailsInfoTabScreen} />
      <Stack.Screen name="ClassDetailsInfoEdit" component={ClassDetailsInfoEditScreen} />
      <Stack.Screen name="ClassDetailsMemberTab" component={ClassDetailsMemberTabScreen} />
      <Stack.Screen name="ClassDetailsMemberDetail" component={ClassDetailsMemberDetailScreen} />
      <Stack.Screen name="ClassDetailsMemberEdit" component={ClassDetailsMemberEditScreen} />
    </Stack.Navigator>
  );
};
