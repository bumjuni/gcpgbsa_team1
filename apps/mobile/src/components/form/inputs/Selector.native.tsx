import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { FormFieldSelectProps } from './types';
import { formatTime, timeStringToDate } from '../../../utils/timeUtils';

export const FormFieldSelect = React.memo(<T extends string | number | Date>({
  value,
  onChange,
}: FormFieldSelectProps<T>) => {
  const [date, setDate] = useState<Date>(new Date(new Date().setHours(0, 0, 0, 0)));
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof value === 'string' && value) {
      setDate(timeStringToDate(value));
    }
  }, [value]);

  return (
    <View className="flex-auto relative">
      <Pressable
        onPress={() => setOpen(true)}
        className="border border-hairline-border-strong rounded-md px-md py-sm flex-row align-middle"
      >
        <Text className="text-base text-ink">{formatTime(date)}</Text>

        {/* Chevron Icon */}
        <View className="w-sm h-sm border-r-2 border-b-2 border-ink-tertiary transform rotate-45 mb-1 self-center ml-auto" />
      </Pressable>

      <DatePicker
        modal
        open={open}
        date={date}
        mode="time"
        minuteInterval={5}
        onConfirm={(newDate) => {
          setOpen(false);
          setDate(newDate);
          onChange(formatTime(newDate) as T);
        }}
        onCancel={() => setOpen(false)}
      />
    </View>
  );
});
