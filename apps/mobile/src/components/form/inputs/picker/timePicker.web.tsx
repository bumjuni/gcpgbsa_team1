import React, { useEffect, useState, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { FormFieldSelectProps } from './types';
import { formatTime, timeStringToDate } from '../../../utils/timeUtils';

export const FormFieldSelect = React.memo(<T extends string | number | Date>({
  value,
  onChange,
}: FormFieldSelectProps<T>) => {
  const [date, setDate] = useState<Date>(new Date(new Date().setHours(0, 0, 0, 0)));
  const inputRef = useRef<HTMLInputElement>(null);

  // value prop이 "HH:mm" 문자열로 채워지면 내부 date state에 반영
  useEffect(() => {
    if (typeof value === 'string' && value) {
      setDate(timeStringToDate(value));
    }
  }, [value]);

  // Date 객체를 "HH:mm" 문자열로 변환 (HTML5 input value용)
  const getFormattedTimeString = (d: Date) => {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Pressable 클릭 시 숨겨진 <input type="time"> 피커 띄우기
  const handlePress = () => {
    if (inputRef.current) {
      if ('showPicker' in HTMLInputElement.prototype) {
        inputRef.current.showPicker(); // 브라우저 최신 Native Time Picker 열기
      } else {
        inputRef.current.focus();
      }
    }
  };

  // 웹 input 변경 시 호출
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeVal = e.target.value; // "HH:mm"
    if (timeVal) {
      const newDate = timeStringToDate(timeVal);
      setDate(newDate);
      onChange(formatTime(newDate) as T);
    }
  };

  return (
    <View className="flex-auto relative">
      <Pressable
        onPress={handlePress}
        className="border border-hairline-border-strong rounded-md px-md py-sm flex-row align-middle"
      >
        {date && (
          <Text className={`text-base ${date ? 'text-ink' : 'text-ink-tertiary'}`}>
            {formatTime(date)}
          </Text>
        )}

        {/* Chevron Icon */}
        <View className="w-sm h-sm border-r-2 border-b-2 border-ink-tertiary transform rotate-45 mb-1 self-center ml-auto" />
      </Pressable>

      {/* 웹 전용 보이지 않는 HTML5 Time Input */}
      <input
        ref={inputRef}
        type="time"
        step="300" // 5분 간격 (minuteInterval={5} 대응)
        value={getFormattedTimeString(date)}
        onChange={handleTimeChange}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          cursor: 'pointer',
          pointerEvents: 'none', // Pressable 클릭 이벤트를 방해하지 않음
        }}
      />
    </View>
  );
});
