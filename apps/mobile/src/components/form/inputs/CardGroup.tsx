import React from 'react';
import { View, Text } from 'react-native';
import { FormFieldCardGroupProps } from './types';
import { Card } from '../../card/Card';

export const FormFieldCardGroup = <T extends string | number>({
  options,
  value,
  onChange,
}: FormFieldCardGroupProps<T>) => {
  return (
    <View className="gap-xs">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <Card
            key={String(opt.value)}
            variant='default'
            onPress={() => onChange(opt.value)}
            className={`flex-row items-center p-sm border ${
              selected ? 'border-primary bg-primary-subtle' : 'border-hairline-border-strong'
            }`}
          >
            {/* Radio Circle */}
            <View
              className={`w-6 h-6 rounded-full border items-center justify-center mr-md ${
                selected ? 'border-primary bg-primary' : 'border-hairline-border-strong'
              }`}
            >
              {selected && <View className="w-2.5 h-2.5 rounded-full bg-white" />}
            </View>

            {/* Label & Description */}
            <View className="flex-1">
              <Text className="text-button-sm text-ink">{opt.label}</Text>
              {opt.description && (
                <Text className="text-caption text-ink-secondary mt-2">
                  {opt.description}
                </Text>
              )}
            </View>
          </Card>
        );
      })}
    </View>
  );
};
