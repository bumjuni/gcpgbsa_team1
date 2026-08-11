import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { FormFieldSelectProps } from './types';
import DatePicker from 'react-native-date-picker'
import { formatTime } from '../../../utils/timeUtils';

export const FormFieldSelect = React.memo(<T extends string | number | Date>({
  value,
  placeholder,
  onChange,
}: FormFieldSelectProps<T>) => {
  const [date, setDate] = useState<Date>(new Date(new Date().setHours(0, 0, 0, 0)))
  const [open, setOpen] = useState<boolean>(false)

  return (
    <>
    <Pressable
      onPress={() => setOpen(true)}
      className="flex-auto border border-hairline-border-strong rounded-md px-md py-sm flex-row align-middle"
      >
        {date &&
          <Text className={`text-base ${date ? 'text-ink' : 'text-ink-tertiary'}`}>
            {formatTime(date)}
          </Text>
        }

        {/* Chevron Icon */}
        <View className="w-sm h-sm border-r-2 border-b-2 border-ink-tertiary transform rotate-45 mb-1 self-center ml-auto" />
      </Pressable>

      {/* Picker */}
      <DatePicker
        modal
        open={open}
        date={date}
        title={null}
        minuteInterval={5}
        is24hourSource='locale'
        mode="time"
        onConfirm={(d) => {
          setOpen(false)
          setDate(d)
          onChange(formatTime(d) as T)
        }}
      onCancel={() => {
        setOpen(false)
      }}
      />
    </>
  );
});
