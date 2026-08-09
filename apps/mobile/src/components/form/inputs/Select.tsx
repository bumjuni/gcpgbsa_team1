import React from 'react';
import { Pressable, Text } from 'react-native';
import { FormFieldSelectProps } from './types';

export const FormFieldSelect = ({
  value,
  placeholder = '선택하세요',
  onPress,
}: FormFieldSelectProps) => {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 border border-hairline-border-strong rounded-md px-md py-sm"
    >
      <Text className={`text-base ${value ? 'text-ink' : 'text-ink-tertiary'}`}>
        {value || placeholder}
      </Text>
      {/* Chevron Icon */}
      {/*<View className="w-4 h-4 border-r-2 border-b-2 border-ink-tertiary transform rotate-45 mb-1" />*/}
    </Pressable>
  );
};
