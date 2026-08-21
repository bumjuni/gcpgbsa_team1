import React, { useState } from 'react';
import { Alert, Modal, Pressable, Text, TouchableWithoutFeedback, View } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { Button } from '../components/button/Button';
import { FormFieldTextInput } from '../components/form/inputs/TextInput';
import { FormFieldHelperText } from '../components/form/FormFieldHelperText';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/useAuthStore';
import { formatPhoneNumber } from '../utils/phone';
import {
  DUPLICATE_EMAIL_MESSAGE,
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordConfirm,
  validatePhone,
} from '../utils/authValidation';
import { SignupFieldErrors } from '../types/auth';

// 서비스 이용약관/개인정보 처리방침 내용은 아직 확정되지 않아 임시 문구로 대체함
const TERMS_PLACEHOLDER = '서비스 이용약관 내용은 준비 중이에요. 확정되는 대로 업데이트할게요.';
const PRIVACY_PLACEHOLDER = '개인정보 수집·이용 내용은 준비 중이에요. 확정되는 대로 업데이트할게요.';

interface CheckboxRowProps {
  checked: boolean;
  onToggle: () => void;
  label: string;
  requiredLabel?: '필수' | '선택';
  onViewPress?: () => void;
  emphasize?: boolean;
}

const CheckboxRow = ({ checked, onToggle, label, requiredLabel, onViewPress, emphasize }: CheckboxRowProps) => (
  <View className="flex-row items-center py-xs">
    <Pressable onPress={onToggle} hitSlop={8} className="flex-row items-center flex-1">
      <View
        className={`w-5 h-5 rounded border items-center justify-center mr-sm ${
          checked ? 'bg-primary border-primary' : 'border-hairline-border-strong'
        }`}
      >
        {checked && <Text className="text-white text-xs font-bold">✓</Text>}
      </View>
      <Text className={emphasize ? 'text-body font-bold text-ink' : 'text-body text-ink'}>
        {requiredLabel && (
          <Text className={requiredLabel === '필수' ? 'text-status-danger' : 'text-ink-tertiary'}>
            [{requiredLabel}]{' '}
          </Text>
        )}
        {label}
      </Text>
    </Pressable>
    {onViewPress && (
      <Pressable onPress={onViewPress} hitSlop={8}>
        <Text className="text-caption text-ink-tertiary underline ml-xs">보기</Text>
      </Pressable>
    )}
  </View>
);

export const SignupScreen = ({ navigation }: any) => {
  const setAuth = useAuthStore((s) => s.setAuth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<SignupFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [viewingTerms, setViewingTerms] = useState<'terms' | 'privacy' | null>(null);

  const allAgreed = agreeTerms && agreePrivacy && agreeAge && agreeMarketing;
  const requiredAgreed = agreeTerms && agreePrivacy && agreeAge;

  const toggleAll = () => {
    const next = !allAgreed;
    setAgreeTerms(next);
    setAgreePrivacy(next);
    setAgreeAge(next);
    setAgreeMarketing(next);
  };

  const runLocalValidation = (): SignupFieldErrors => {
    const next: SignupFieldErrors = {};
    const nameError = validateName(name);
    if (nameError) next.name = nameError;
    const emailError = validateEmail(email);
    if (emailError) next.email = emailError;
    const passwordError = validatePassword(password);
    if (passwordError) {
      next.password = passwordError;
    } else {
      const confirmError = validatePasswordConfirm(password, passwordConfirm);
      if (confirmError) next.password_confirm = confirmError;
    }
    const phoneError = validatePhone(phone);
    if (phoneError) next.phone = phoneError;
    if (!requiredAgreed) next.agreement = '필수 항목에 동의하면 가입할 수 있어요';
    return next;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    const localErrors = runLocalValidation();
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await authApi.signup({
        name,
        email,
        password,
        password_confirm: passwordConfirm,
        phone,
        agree_terms: agreeTerms,
        agree_privacy: agreePrivacy,
        agree_age: agreeAge,
        agree_marketing: agreeMarketing,
      });
      await setAuth(result.access_token, result.refresh_token, result.instructor);
      Alert.alert('가입했어요');
      navigation?.reset({ index: 0, routes: [{ name: 'ClassList' }] });
    } catch (err: any) {
      const fieldErrors = err?.response?.data?.detail;
      if (fieldErrors && typeof fieldErrors === 'object') {
        setErrors(fieldErrors);
      } else {
        Alert.alert('가입 실패', '잠시 후 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenLayout
      title="회원가입"
      showBackButton
      footer={
        <View>
          {!requiredAgreed && (
            <Text className="text-caption text-ink-tertiary text-center mb-xs">
              필수 항목에 동의하면 가입할 수 있어요
            </Text>
          )}
          <Button label="가입하기" onPress={handleSubmit} disabled={!requiredAgreed || isSubmitting} loading={isSubmitting} />
        </View>
      }
    >
      <View className="pt-md pb-xl">
        {/* 이름 */}
        <Text className="text-base font-bold text-ink mb-xs">이름</Text>
        <FormFieldTextInput
          value={name}
          onChangeText={(v) => {
            setName(v);
            setErrors((prev) => ({ ...prev, name: undefined }));
          }}
          placeholder="이름"
        />
        {errors.name && <FormFieldHelperText text={errors.name} type="error" />}

        {/* 이메일 */}
        <Text className="text-base font-bold text-ink mb-xs mt-md">이메일</Text>
        <FormFieldTextInput
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          placeholder="example@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        {!errors.email && <FormFieldHelperText text="로그인할 때 아이디로 써요" type="guide" />}
        {errors.email && (
          <>
            <FormFieldHelperText text={errors.email} type="error" />
            {errors.email === DUPLICATE_EMAIL_MESSAGE && (
              <Button
                label="로그인하기"
                variant="secondary"
                onPress={() => navigation?.navigate('Login')}
                className="mb-sm"
              />
            )}
          </>
        )}

        {/* 비밀번호 */}
        <Text className="text-base font-bold text-ink mb-xs mt-md">비밀번호</Text>
        <FormFieldTextInput
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            setErrors((prev) => ({ ...prev, password: undefined, password_confirm: undefined }));
          }}
          placeholder="8자 이상, 영문·숫자 포함"
          secureTextEntry
        />
        {!errors.password && <FormFieldHelperText text="8자 이상, 영문과 숫자를 함께 써주세요" type="guide" />}
        {errors.password && <FormFieldHelperText text={errors.password} type="error" />}

        <Text className="text-base font-bold text-ink mb-xs mt-md">비밀번호 확인</Text>
        <FormFieldTextInput
          value={passwordConfirm}
          onChangeText={(v) => {
            setPasswordConfirm(v);
            setErrors((prev) => ({ ...prev, password_confirm: undefined }));
          }}
          placeholder="비밀번호를 한 번 더 입력하세요"
          secureTextEntry
        />
        {errors.password_confirm && <FormFieldHelperText text={errors.password_confirm} type="error" />}

        {/* 휴대폰번호 */}
        <Text className="text-base font-bold text-ink mb-xs mt-md">휴대폰번호</Text>
        <FormFieldTextInput
          value={phone}
          onChangeText={(v) => {
            setPhone(formatPhoneNumber(v));
            setErrors((prev) => ({ ...prev, phone: undefined }));
          }}
          placeholder="010-0000-0000"
          keyboardType="phone-pad"
          maxLength={13}
        />
        {errors.phone && <FormFieldHelperText text={errors.phone} type="error" />}

        {/* 동의 */}
        <View className="mt-lg border-t border-hairline pt-md">
          <CheckboxRow checked={allAgreed} onToggle={toggleAll} label="아래 내용에 모두 동의해요" emphasize />
          <Text className="text-caption text-ink-tertiary ml-8 mb-xs">
            (선택 항목에 동의하지 않아도 가입할 수 있어요)
          </Text>

          <View className="ml-md">
            <CheckboxRow
              checked={agreeTerms}
              onToggle={() => setAgreeTerms((v) => !v)}
              label="서비스 이용약관에 동의해요"
              requiredLabel="필수"
              onViewPress={() => setViewingTerms('terms')}
            />
            <CheckboxRow
              checked={agreePrivacy}
              onToggle={() => setAgreePrivacy((v) => !v)}
              label="개인정보 수집·이용에 동의해요"
              requiredLabel="필수"
              onViewPress={() => setViewingTerms('privacy')}
            />
            <CheckboxRow
              checked={agreeAge}
              onToggle={() => setAgreeAge((v) => !v)}
              label="만 14세 이상이에요"
              requiredLabel="필수"
            />
            <CheckboxRow
              checked={agreeMarketing}
              onToggle={() => setAgreeMarketing((v) => !v)}
              label="베타 테스트 소식을 받을게요"
              requiredLabel="선택"
            />
          </View>
        </View>
      </View>

      <Modal transparent visible={viewingTerms !== null} animationType="fade" onRequestClose={() => setViewingTerms(null)}>
        <TouchableWithoutFeedback onPress={() => setViewingTerms(null)}>
          <View className="flex-1 bg-ink/60 justify-center items-center px-xl">
            <TouchableWithoutFeedback>
              <View className="w-full bg-canvas rounded-xl p-lg">
                <Text className="text-base font-bold text-ink mb-sm">
                  {viewingTerms === 'terms' ? '서비스 이용약관' : '개인정보 수집·이용'}
                </Text>
                <Text className="text-body text-ink-secondary mb-lg">
                  {viewingTerms === 'terms' ? TERMS_PLACEHOLDER : PRIVACY_PLACEHOLDER}
                </Text>
                <Button label="닫기" variant="secondary" onPress={() => setViewingTerms(null)} />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScreenLayout>
  );
};
