import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { FormFieldSelectProps } from './types';
import DatePicker from 'react-native-date-picker'

export const FormFieldSelect = <T extends string | number | Date>({
  value,
  placeholder,
  onChange,
}: FormFieldSelectProps<T>) => {
  const [open, setOpen] = useState<boolean>(false)

  return (
  <Pressable
    onPress={() => setOpen(true)}
    className="flex-1 border border-hairline-border-strong rounded-md px-md py-sm flex-row align-middle"
    >
      {placeholder &&
        <Text className={`text-base ${value ? 'text-ink' : 'text-ink-tertiary'}`}>
          {value?.toString() || placeholder}
        </Text>
      }

      {/* Chevron Icon */}
      <View className="w-sm h-sm border-r-2 border-b-2 border-ink-tertiary transform rotate-45 mb-1 self-center ml-auto" />

      {/* Picker */}
      <DatePicker
        modal
        open={open}
        date={new Date()}
        title={null}
        is24hourSource='locale'
        mode="time"
        onConfirm={(value) => {
          setOpen(false)
          onChange(value as T)
        }}
      onCancel={() => {
        setOpen(false)
      }}
      />
    </Pressable>
  );
};
