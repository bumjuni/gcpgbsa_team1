import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
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

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeVal = e.target.value; // "HH:mm"
    if (!timeVal) return;
    const newDate = timeStringToDate(timeVal);
    setDate(newDate);
    onChange(formatTime(newDate) as T);
  };

  return (
    <View className="flex-auto relative justify-center">
      <input
        type="time"
        step="300" // 5분 간격
        value={getFormattedTimeString(date)}
        onChange={handleTimeChange}
        className="border border-hairline-border-strong rounded-md px-md py-sm text-base text-ink bg-transparent w-full"
        style={{
          fontFamily: 'inherit',
          appearance: 'none',
          WebkitAppearance: 'none',
        }}
      />
    </View>
  );
});
