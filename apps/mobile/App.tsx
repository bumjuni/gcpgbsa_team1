/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import './global.css';
import { NewAppScreen } from '@react-native/new-app-screen';
import { StatusBar, useColorScheme, View, Text } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Button } from './src/components/Button';
import { Header } from './src/components/Header';
import { NavigationContainer } from '@react-navigation/native';
import { ScreenLayout } from './src/components/ScreenLayout';
import { FormField } from './src/components/FormField';
import { ConfirmModal } from './src/components/ConfirmModal';

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <NavigationContainer>
      <ConfirmModal visible title='test' description='test-description' confirmText='OK' cancelText='cancel' onConfirm={() => { }} onCancel={() => { }} />
      <SafeAreaProvider style={{flex: 1}}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <ScreenLayout title='test-page'>
          <View style={{ flex: 1, padding: 100 }}>
            <Button label='Button' />
            <FormField label='test' />
          </View>
          {/*<AppContent />*/}
        </ScreenLayout>
        </SafeAreaProvider>
    </NavigationContainer>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <View>
      <NewAppScreen
        templateFileName="App.tsx"
        safeAreaInsets={safeAreaInsets}
      />
    </View>
  );
}
