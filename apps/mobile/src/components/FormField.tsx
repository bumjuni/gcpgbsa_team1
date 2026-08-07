import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { Badge } from './badge/Badge';

interface FormFieldProps extends TextInputProps {
  label: string;
  required?: boolean;
  multiline?: boolean;
}

export const FormField = ({
  label,
  required = false,
  multiline = false,
  ...props
}: FormFieldProps) => {
  return (
    <View className="mb-md">
      {/* Label */}
      <View className="flex-row items-center mb-xs">
        <Text className="text-base font-bold text-ink mr-xs">{label}</Text>
        <Badge
          variant='default'
          text={required ? '· 필수' : ''}
          />
      </View>

      {/* Input */}
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
