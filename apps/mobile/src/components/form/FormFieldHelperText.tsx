import React from 'react';
import { Text } from 'react-native';

interface FormFieldHelperTextProps {
  text: string;
  type?: 'info' | 'guide' | 'error';
  className?: string;
}

export const FormFieldHelperText = ({
  text,
  type = 'info',
  className = '',
}: FormFieldHelperTextProps) => {
  const textColor = type === 'guide' ? 'text-ink-tertiary' : 'text-ink-muted';
  return (
    <Text className={`text-sm ${textColor} mb-xs ${className}`}>
      {text}
    </Text>
  );
};
