import React from 'react';
import { Pressable, Text, ActivityIndicator, PressableProps } from 'react-native';

interface ButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'text';
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
  const bgStyle = disabled ? disabledStyles[variant] ?? variantStyles[variant] : variantStyles[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`${baseStyle} ${bgStyle} ${className}`}

      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : '#0066ce'} />
      ) : (
        <Text className={textStyles[variant]}>{label}</Text>
      )}
    </Pressable>
  );
};

const baseStyle = 'w-full py-4 rounded-2xl items-center justify-center active:opacity-80';

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-primary',
  secondary: 'bg-primary-subtle',
  text: 'bg-transparent py-xs',
};

const disabledStyles: Partial<Record<NonNullable<ButtonProps['variant']>, string>> = {
  primary: 'bg-primary-subtle',
  secondary: 'bg-hairline',
};

const textStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'text-white font-bold text-base',
  secondary: 'text-primary font-bold text-base',
  text: 'text-text-muted font-medium text-sm',
};
