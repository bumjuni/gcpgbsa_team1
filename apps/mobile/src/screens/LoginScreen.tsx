import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Button } from '../components/button/Button';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/useAuthStore';
import { KAKAO_CONFIG } from '../api/env';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://kauth.kakao.com/oauth/authorize',
};

export const LoginScreen = ({ navigation }: any) => {
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'growdy', path: 'auth/kakao' });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: KAKAO_CONFIG.CLIENT_ID,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
    },
    discovery
  );

  useEffect(() => {
    if (response?.type !== 'success' || !response.params.code) return;

    (async () => {
      setIsSubmitting(true);
      try {
        const tokenResponse = await authApi.kakaoLogin(response.params.code, redirectUri);
        await setAuth(tokenResponse.access_token, tokenResponse.instructor);
        navigation.reset({ index: 0, routes: [{ name: 'ClassList' }] });
      } catch (err) {
        console.error(err);
        // TODO: 로그인 실패 시 사용자에게 에러 안내 (토스트/스낵바) 추가 필요
      } finally {
        setIsSubmitting(false);
      }
    })();
  }, [response, redirectUri, setAuth, navigation]);

  return (
    <SafeAreaView className="flex-1 bg-white items-center justify-center px-lg">
      <View className="items-center mb-xl">
        <Text className="text-title-lg mb-xxs">growdy</Text>
        <Text className="text-caption text-ink-secondary">수영강사를 위한 단 하나뿐인 버디!</Text>
      </View>
      <Button
        label="카카오로 시작하기"
        disabled={!request || isSubmitting}
        loading={isSubmitting}
        onPress={() => promptAsync()}
      />
    </SafeAreaView>
  );
};
