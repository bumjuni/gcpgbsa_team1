import React, { ReactNode } from 'react';
import { View, Text } from 'react-native';
import { Badge } from '../badge/Badge';

interface FormFieldLabelProps {
  label: string;
  required?: boolean;
  rightAction?: ReactNode;
  className?: string;
}

export const FormFieldLabel = ({
  label,
  required = false,
  rightAction,
  className = '',
}: FormFieldLabelProps) => {
  return (
    <View className={`flex-row items-center justify-between mb-xs ${className}`}>
      <View className="flex-row items-center">
        <Text className="text-base font-bold text-ink mr-xs">{label}</Text>
        {required && <Badge variant="default" text="· 필수" />}
      </View>
      {rightAction && <View>{rightAction}</View>}
    </View>
  );
};
