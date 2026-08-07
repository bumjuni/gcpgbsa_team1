import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { FormFieldChipGroupProps } from './types';

export const FormFieldChipGroup = <T extends string | number>({
  options,
  value,
  onChange,
  multiple = false,
  variant = 'pill',
}: FormFieldChipGroupProps<T>) => {
  const isSelected = (val: T) => {
    return Array.isArray(value) ? value.includes(val) : value === val;
  };

  const handlePress = (val: T) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const nextValues = currentValues.includes(val)
        ? currentValues.filter((v) => v !== val)
        : [...currentValues, val];
      onChange(nextValues);
    } else {
      onChange(val);
    }
  };

  return (
    <View className="flex-row flex-wrap gap-xs">
      {options.map((opt) => {
        const selected = isSelected(opt.value);
        const isCircle = variant === 'circle';

        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => handlePress(opt.value)}
            className={`items-center justify-center border transition-all ${
              isCircle
                ? 'px-sm py-sm rounded-full'
              : 'px-md py-sm rounded-full self-start'
            } ${
              selected
                ? 'bg-primary-subtle border-primary'
                : ' border-hairline-border-strong'
            }`}
          >
            <Text
              className={`text-base ${
                selected ? 'text-primary font-bold' : 'text-ink'
              }`}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};
