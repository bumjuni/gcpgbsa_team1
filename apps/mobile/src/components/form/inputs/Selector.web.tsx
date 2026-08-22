import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { FormFieldSelectProps } from './types';
import { formatTime, timeStringToDate } from '../../../utils/timeUtils';

export const FormFieldSelect = React.memo(<T extends string | number | Date>({
  value,
  onChange,
}: FormFieldSelectProps<T>) => {
  const [date, setDate] = useState<Date>(new Date(new Date().setHours(0, 0, 0, 0)));

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
      {/* 표시 전용. 실제 클릭은 아래 input이 직접 받는다 (showPicker()는 Safari에서 신뢰할 수 없어 사용하지 않음) */}
      <View
        pointerEvents="none"
        className="border border-hairline-border-strong rounded-md px-md py-sm flex-row align-middle"
      >
        <Text className="text-base text-ink">{formatTime(date)}</Text>

        {/* Chevron Icon */}
        <View className="w-sm h-sm border-r-2 border-b-2 border-ink-tertiary transform rotate-45 mb-1 self-center ml-auto" />
      </View>

      {/* 웹 전용 보이지 않는 HTML5 Time Input. 클릭을 직접 받아 브라우저 기본 피커를 연다 */}
      <input
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
        }}
      />
    </View>
  );
});
