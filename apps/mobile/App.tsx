/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import './global.css';
import { StatusBar, useColorScheme, View} from 'react-native';
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
  /* 1. 최외각 바깥 래퍼: 웹 화면 전체를 배경 #FFFFFF로 채우고 중앙 정렬 */
    <View
      className="flex-1 bg-white items-center justify-center"
      style={{
        width: '100%',
        minHeight: Platform.OS === 'web' ? ('100vh' as any) : '100%',
      }}
    >
      {/* 2. 중앙 모바일 프레임 컨테이너: 너비 최대 430px 제한, 그림자(Shadow) 및 테두리 효과 적용 */}
      <View
        className="w-full max-w-[430px] flex-1 bg-white"
        style={
          Platform.OS === 'web'
            ? ({
                boxShadow: '0 0 20px rgba(0, 0, 0, 0.08)', // 웹에서 양옆 흰 배경과 모바일 영역 구분감을 주는 미세한 그림자
                height: '100vh',
              } as any)
            : { flex: 1 }
        }
      >
      <SafeAreaProvider style={{ flex: 1, backgroundColor: '#FFFFFF', minHeight: Platform.OS === 'web' ? '100vh' as any : undefined }}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <NavigationContainer linking={linking}>
          <AppNavigator />
        </NavigationContainer>
        </SafeAreaProvider>
      </View>
    </View>
    );
  }
