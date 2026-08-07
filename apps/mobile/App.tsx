/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import './global.css';
import { StatusBar, useColorScheme} from 'react-native';
import {
  SafeAreaProvider
} from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { LessonPlanConfirmScreen } from './src/screens/LessonPlanConfirmScreen';
import { ClassCreateCompleteScreen } from './src/screens/ClassCreateCompleteScreen';
import { ClassInfoFormScreen_Scrollable } from './src/screens/ClassInfoFormScreen_Scrollable';
import { ClassListScreen } from './src/screens/ClassListScreen';
import { ClassListScreen_Filled } from './src/screens/ClassListScreen_Filled';
import { MemberRegisterScreen } from './src/screens/MemberRegisterScreen';
import { MemberListScreen } from './src/screens/MemberListScreen';
import { MemberListScreen_MAX } from './src/screens/MemberListScreen_MAX';
import { ClassRegisterScreen } from './src/screens/ClassRegisterScreen';

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <NavigationContainer>
      <SafeAreaProvider style={{flex: 1}}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <ClassInfoFormScreen_Scrollable />
      </SafeAreaProvider>
    </NavigationContainer>
  );
}
