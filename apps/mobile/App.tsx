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
import { ClassCreateCompleteScreen } from './src/screens/ClassCreateCompleteScreen';
import { ScreenLayout } from './src/components/ScreenLayout';
import { FormField } from './src/components/FormField';
import { ConfirmModal } from './src/components/ConfirmModal';

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <NavigationContainer>
      <SafeAreaProvider style={{flex: 1}}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <ClassCreateCompleteScreen />
      </SafeAreaProvider>
    </NavigationContainer>
  );
}
