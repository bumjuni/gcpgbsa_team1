import React from 'react';
import { View, TextInput, Text, TextInputProps } from 'react-native';

interface Props extends TextInputProps {
  suffix?: string; // 단위
  multiline?: boolean;
}

export const FormFieldTextInput = ({
  suffix,
  multiline = false,
  className = '',
  ...props
}: Props) => {
  return (
    <View className="flex-row items-center w-full bg-surface-muted border border-hairline-border-strong rounded-md px-md">
      <TextInput
        className={`flex-1 text-base text-ink ${
          multiline ? 'h-32 pt-sm pb-sm' : 'h-14'
        } ${className}`}
        placeholderTextColor="#8B9198"
        textAlignVertical={multiline ? 'top' : 'center'}
        multiline={multiline}
        {...props}
      />
      {suffix && <Text className="text-base text-ink ml-xs font-medium">{suffix}</Text>}
    </View>
  );
};
