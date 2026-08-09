import React from 'react';
import { Pressable, Text, ActivityIndicator, PressableProps } from 'react-native';
import { BUTTON_CONTAINER_STYLES, BUTTON_TEXT_STYLES } from './Button.variants';

export type ButtonVariant = 'primary' | 'secondary' | 'text' | 'danger';

interface ButtonProps extends PressableProps {
  label: string;
  variant?: ButtonVariant
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const Button = ({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
  ...props
}: ButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`${BUTTON_CONTAINER_STYLES[variant]} ${className}
        w-full py-4 rounded-md items-center justify-center active:bg-primary-pressed`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : '#0066ce'} />
      ) : (
        <Text className={`${BUTTON_TEXT_STYLES[variant]}`}>
          {label}
        </Text>
      )}
    </Pressable>
  );
};
