import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Button } from '../../components/button/Button';
import { FormFieldTextInput } from '../../components/form/inputs/TextInput';
import { useLessonPlanStore } from '../../stores/useLessonPlanStore';
import { lessonPlanApi } from '../../api/lessonPlan';

const STAR_VALUES = [1, 2, 3, 4, 5];

export const LessonPlanFeedbackScreen = ({ navigation }: any) => {
  const { lessonPlan, clearLessonPlan } = useLessonPlanStore();
  const [rating, setRating] = useState(0);
  const [memo, setMemo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!lessonPlan) return null;

  const goToClassList = () => {
    clearLessonPlan();
    navigation?.navigate('ClassList');
  };

  const handleSubmit = async () => {
    if (isSubmitting || rating === 0) return;
    setIsSubmitting(true);
    try {
      await lessonPlanApi.submitLessonPlanFeedback(lessonPlan.id, {
        rating,
        memo: memo.trim() || undefined,
      });
      goToClassList();
    } catch (error) {
      console.error('피드백 전송 실패:', error);
      // TODO: 에러 토스트/알럿
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenLayout
      title="수업안 피드백"
      showBackButton
      footer={
        <View>
          <Button
            label="의견 보내기"
            onPress={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            loading={isSubmitting}
          />
          <Pressable onPress={goToClassList} hitSlop={8} className="py-md items-center">
            <Text className="text-body text-ink-tertiary">건너뛸게요</Text>
          </Pressable>
        </View>
      }
    >
      <View className="pt-lg">
        <Text className="text-title font-bold text-ink text-center mb-lg">
          수업안은 어떠셨나요?
        </Text>

        <View className="flex-row justify-center mb-xl">
          {STAR_VALUES.map((value) => (
            <Pressable key={value} onPress={() => setRating(value)} hitSlop={8} className="mx-xs">
              <Text
                className={`text-3xl ${value <= rating ? 'text-primary' : 'text-hairline-border-strong'}`}
              >
                ★
              </Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-caption-strong text-ink mb-xxs">메모 · 선택</Text>
        <Text className="text-caption text-ink-tertiary mb-sm">
          다음 수업안에 참고할 점이 있다면 적어주세요
        </Text>
        <FormFieldTextInput
          multiline
          value={memo}
          onChangeText={setMemo}
          placeholder="예: 메인 세트가 살짝 길었어요"
          maxLength={500}
        />
        <Text className="text-legal text-ink-tertiary text-center mt-lg">
          남겨주신 의견은 수업안을 더 다듬는 데 쓰여요
        </Text>
      </View>
    </ScreenLayout>
  );
};
