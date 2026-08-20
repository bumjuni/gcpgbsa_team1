import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { Button } from '../components/button/Button';
import { FormFieldTextInput } from '../components/form/inputs/TextInput';
import { FormFieldHelperText } from '../components/form/FormFieldHelperText';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/useAuthStore';
import { validateEmail } from '../utils/authValidation';

export const LoginScreen = ({ navigation }: any) => {
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setFormError(undefined);

    const nextEmailError = validateEmail(email);
    const nextPasswordError = !password ? '비밀번호를 입력해주세요' : undefined;
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError || nextPasswordError) return;

    setIsSubmitting(true);
    try {
      const result = await authApi.login({ email, password });
      await setAuth(result.access_token, result.instructor);
      navigation?.reset({ index: 0, routes: [{ name: 'ClassList' }] });
    } catch (err: any) {
      const message = err?.response?.data?.detail;
      setFormError(typeof message === 'string' ? message : '이메일 또는 비밀번호가 일치하지 않아요');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenLayout
      title="로그인"
      showBackButton
      footer={
        <View>
          <Button label="로그인" onPress={handleSubmit} disabled={isSubmitting} loading={isSubmitting} />
          <Pressable onPress={() => navigation?.navigate('Signup')} hitSlop={8} className="py-md items-center">
            <Text className="text-body text-ink-tertiary">아직 계정이 없으신가요? <Text className="text-primary font-medium">가입하기</Text></Text>
          </Pressable>
        </View>
      }
    >
      <View className="pt-lg">
        <Text className="text-title font-bold text-ink text-center mb-xl">growdy 로그인</Text>

        <Text className="text-base font-bold text-ink mb-xs">이메일</Text>
        <FormFieldTextInput
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            setEmailError(undefined);
            setFormError(undefined);
          }}
          placeholder="example@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        {emailError && <FormFieldHelperText text={emailError} type="error" />}

        <Text className="text-base font-bold text-ink mb-xs mt-md">비밀번호</Text>
        <FormFieldTextInput
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            setPasswordError(undefined);
            setFormError(undefined);
          }}
          placeholder="비밀번호 입력"
          secureTextEntry
        />
        {passwordError && <FormFieldHelperText text={passwordError} type="error" />}

        {formError && <FormFieldHelperText text={formError} type="error" />}
      </View>
    </ScreenLayout>
  );
};
