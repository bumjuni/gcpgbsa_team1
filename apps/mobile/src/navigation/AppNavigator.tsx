import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavStackParamList } from './types';

import { AppSplashScreen } from '../screens/AppSplashScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { ClassListScreen } from '../screens/ClassListScreen';
import { ClassRegisterScreen } from '../screens/ClassRegisterScreen';
import { ClassMemberScreen } from '../screens/ClassMemberScreen/ClassMemberScreen';
import { ClassCreateCompleteScreen } from '../screens/ClassCreateCompleteScreen';
import { LevelGuideScreen } from '../screens/LevelGuideScreen';
import { LessonPlanCreateScreen } from '../screens/LessonPlan/LessonPlanCreateScreen';
import { LessonPlanConfirmScreen } from '../screens/LessonPlan/LessonPlanConfirmScreen';
import { LessonPlanCompleteScreen } from '../screens/LessonPlan/LessonPlanCompleteScreen';
import { LessonPlanEditItemScreen } from '../screens/LessonPlan/LessonPlanEditItemScreen';
import { ClassDetailsLessonTabScreen } from '../screens/ClassDetail/ClassDetailsLessonTabScreen';
import { ClassDetailsLessonHistoryScreen } from '../screens/ClassDetail/ClassDetailsLessonHistoryScreen';
import { ClassDetailsInfoTabScreen } from '../screens/ClassDetail/ClassDetailsInfoTabScreen';
import { ClassDetailsInfoEditScreen } from '../screens/ClassDetail/ClassDetailsInfoEditScreen';
import { ClassDetailsMemberTabScreen } from '../screens/ClassDetail/ClassDetailsMemberTabScreen';
import { ClassDetailsMemberDetailScreen } from '../screens/ClassDetail/ClassDetailsMemberDetailScreen';
import { ClassDetailsMemberEditScreen } from '../screens/ClassDetail/ClassDetailsMemberEditScreen';
import { ClassDetailsReportTabScreen } from '../screens/ClassDetail/Report/ClassDetailsReportTabScreen';
import { ClassDetailsReportSendScreen } from '../screens/ClassDetail/Report/ClassDetailsReportSendScreen';
import { ClassDetailsReportHistoryScreen } from '../screens/ClassDetail/Report/ClassDetailsReportHistoryScreen';
import { WebReportsScreen } from '../screens/WebReportsScreen';
import { LessonPlanFeedbackScreen } from '../screens/LessonPlan/LessonPlanFeedbackScreen';

const Stack = createNativeStackNavigator<NavStackParamList>();

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="AppSplash"

      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen name="AppSplash" component={AppSplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ClassList" component={ClassListScreen} />
      <Stack.Screen name="ClassRegister" component={ClassRegisterScreen} />
      <Stack.Screen name="ClassMember" component={ClassMemberScreen} />
      <Stack.Screen name="ClassCreateComplete" component={ClassCreateCompleteScreen} />
      <Stack.Screen name="LevelGuide" component={LevelGuideScreen} />
      <Stack.Screen name="LessonPlanCreate" component={LessonPlanCreateScreen} />
      <Stack.Screen name="LessonPlanConfirm" component={LessonPlanConfirmScreen} />
      <Stack.Screen name="LessonPlanComplete" component={LessonPlanCompleteScreen} />
      <Stack.Screen name="LessonPlanEditItem" component={LessonPlanEditItemScreen} />
      <Stack.Screen name="LessonPlanFeedback" component={LessonPlanFeedbackScreen} />
      <Stack.Screen name="ClassDetailsLessonTab" component={ClassDetailsLessonTabScreen} />
      <Stack.Screen name="ClassDetailsLessonHistory" component={ClassDetailsLessonHistoryScreen} />
      <Stack.Screen name="ClassDetailsInfoTab" component={ClassDetailsInfoTabScreen} />
      <Stack.Screen name="ClassDetailsInfoEdit" component={ClassDetailsInfoEditScreen} />
      <Stack.Screen name="ClassDetailsMemberTab" component={ClassDetailsMemberTabScreen} />
      <Stack.Screen name="ClassDetailsMemberDetail" component={ClassDetailsMemberDetailScreen} />
      <Stack.Screen name="ClassDetailsMemberEdit" component={ClassDetailsMemberEditScreen} />
      <Stack.Screen name="ClassDetailsReportTab" component={ClassDetailsReportTabScreen} />
      <Stack.Screen name="ClassDetailsReportSend" component={ClassDetailsReportSendScreen} />
      <Stack.Screen name="ClassDetailsReportHistory" component={ClassDetailsReportHistoryScreen} />
      <Stack.Screen name="WebReports" component={WebReportsScreen} />
    </Stack.Navigator>
  );
};
