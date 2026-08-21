// src/screens/LessonPlanGeneratingScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native'; // Animated 추가

const DOT_COLORS = [
  '#0069C0',
  'rgba(0, 105, 192, 0.55)',
  'rgba(0, 105, 192, 0.25)',
];

const MESSAGES = [
  '반 정보를 확인하고 있어요',
  '반 정보에 맞는 수업 방향을 설계중이에요',
  '내부 데이터를 활용해 훈련 내용을 선정 중이에요',
  '수업안에 문제가 없나 검토중이에요',
  '이제 마무리 단계에요!',
];

const BASE_DOT_STYLE = {
  width: 12,
  height: 12,
  borderRadius: 6,
  marginHorizontal: 4,
};

// 애니메이션 지속 시간 (ms)
const FADE_DURATION = 300;

export const LessonPlanGeneratingScreen = () => {
  const [colorIndex, setColorIndex] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  // 투명도를 제어할 애니메이션 값 초기화 (0: 투명, 1: 불투명)
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 1초마다 dot 색상 순환
  useEffect(() => {
    const timer = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % 3);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 2초마다 문구 변경 및 애니메이션 실행 (마지막 문구에서 멈춤)
  useEffect(() => {
    // 1. 처음 마운트될 때 Fade In 애니메이션 실행
    Animated.timing(fadeAnim, {
      toValue: 1, // 목표 투명도 (불투명)
      duration: FADE_DURATION, // 애니메이션 지속 시간
      useNativeDriver: true, // 네이티브 드라이버 사용으로 성능 최적화
    }).start();

    // 마지막 문구에 도달하면 타이머 중지
    if (messageIndex >= MESSAGES.length - 1) return;

    // 2. 2초 후에 다음 문구로 변경하는 타이머 설정
    const messageTimer = setTimeout(() => {
      // 3. Fade Out 애니메이션 시작
      Animated.timing(fadeAnim, {
        toValue: 0, // 목표 투명도 (투명)
        duration: FADE_DURATION, // 애니메이션 지속 시간
        useNativeDriver: true, // 네이티브 드라이버 사용
      }).start(() => {
        // 4. Fade Out 애니메이션이 끝나면 문구 변경
        setMessageIndex((prev) => prev + 1);

        // 5. 문구가 변경된 후, Fade In 애니메이션을 다시 실행하기 위해 초기값 설정
        // 이펙트가 다시 실행되면서 상단의 Fade In 로직이 동작함
      });
    }, 3000); // 2초 대기

    return () => clearTimeout(messageTimer);
  }, [messageIndex, fadeAnim]); // messageIndex가 변경될 때마다 이펙트 재실행

  return (
    <View className="flex-1 justify-center items-center">
      <View className="w-28 h-28 rounded-full bg-primary-subtle items-center justify-center mb-md">
        <View className="flex-row items-center">
          <View
            style={{
              ...BASE_DOT_STYLE,
              backgroundColor: DOT_COLORS[colorIndex % 3],
            }}
          />
          <View
            style={{
              ...BASE_DOT_STYLE,
              backgroundColor: DOT_COLORS[(colorIndex + 1) % 3],
            }}
          />
          <View
            style={{
              ...BASE_DOT_STYLE,
              backgroundColor: DOT_COLORS[(colorIndex + 2) % 3],
            }}
          />
        </View>
      </View>

      {/* 애니메이션이 적용될 Text 컴포넌트 */}
      <Animated.Text // Text 대신 Animated.Text 사용
        className="text-button text-ink-secondary text-center my-lg"
        style={{
          opacity: fadeAnim, // 애니메이션 값(fadeAnim)을 opacity 스타일에 연결
        }}
      >
        {MESSAGES[messageIndex]}
      </Animated.Text>
    </View>
  );
};
