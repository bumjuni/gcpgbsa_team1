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
import { ClassListScreen } from './src/screens/ClassListScreen';
import { ClassListScreen_Filled } from './src/screens/ClassListScreen_Filled';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ClassRegisterScreen } from './src/screens/ClassRegisterScreen';

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const Stack = createNativeStackNavigator();

  return (
    <SafeAreaProvider style={{flex: 1, backgroundColor: '#FFFFFF'}}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <NavigationContainer>
        <Stack.Navigator
            initialRouteName="ClassList"
          screenOptions={{
            headerShown: false,
            contentStyle: {backgroundColor: '#FFFFFF'}
            }}>
          <Stack.Screen
            name="ClassList"
            component={ClassListScreen}
          />
          <Stack.Screen
            name="ClassRegister"
            component={ClassRegisterScreen}
            />
          </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>

  );
}
