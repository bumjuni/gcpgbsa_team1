import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface FormFieldProps extends TextInputProps {
  label: string;
  badgeType?: 'required' | 'optional';
}

export const FormField = ({
  label,
  badgeType = 'required',
  multiline = false,
  ...props
}: FormFieldProps) => {
  return (
    <View className="mb-md">
      <View className="flex-row items-center mb-xs">
        <Text className="text-base font-bold text-ink mr-xs">{label}</Text>
        <View
          className={`px-xs py-xxs rounded-sm ${
            badgeType === 'required' ? 'bg-status-danger' : 'bg-ink-teriary'
          }`}
        >
          <Text className="text-[10px] font-bold text-ink-on_primary">
            {badgeType === 'required' ? '필수' : '선택'}
          </Text>
        </View>
      </View>
      <TextInput
        className={`w-full bg-surface-muted border border-surface-hairline rounded-md px-md text-base text-ink ${
          multiline ? 'h-32 pt-sm pb-sm' : 'h-14'
        }`}
        placeholderTextColor="#8B9198" // ink.teriary hex
        textAlignVertical={multiline ? 'top' : 'center'}
        multiline={multiline}
        {...props}
      />
    </View>
  );
};
