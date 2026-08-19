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
import { AppNavigator } from './src/navigation/AppNavigator';
import { Platform } from 'react-native';

// 웹(Web) 브라우저 URL 히스토리 및 라우팅 설정
const linking = {
  prefixes: ['http://localhost:8081', 'https://*.vercel.app', 'https://*.netlify.app'],
  config: {
    screens: {},
    /* 필요 시 화면별 URL 경로 지정 (예: screens: { Home: '', Details: 'details' }) */
  },
};

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
      // 웹 브라우저에서 스크롤 및 전체 화면 렌더링이 깨지지 않도록 style Fix
      <SafeAreaProvider style={{ flex: 1, backgroundColor: '#FFFFFF', minHeight: Platform.OS === 'web' ? '100vh' as any : undefined }}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <NavigationContainer linking={linking}>
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    );
  }
