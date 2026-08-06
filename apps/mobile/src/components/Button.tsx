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
  const baseStyle = 'w-full py-4 rounded-2xl items-center justify-center active:opacity-80 transition-all';

  const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: disabled ? 'bg-blue-300' : 'bg-[#0066ce]',
    secondary: disabled ? 'bg-gray-100' : 'bg-blue-50',
    text: 'bg-transparent py-2',
  };

  const textStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'text-white font-bold text-base',
    secondary: 'text-[#0066ce] font-bold text-base',
    text: 'text-gray-500 font-medium text-sm',
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`${baseStyle} ${variantStyles[variant]} ${className}`}
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
