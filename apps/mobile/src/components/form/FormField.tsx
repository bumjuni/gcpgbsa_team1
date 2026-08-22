import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { FormFieldLabel } from './FormFieldLabel';
import { FormFieldHelperText } from './FormFieldHelperText';
import { FormFieldTextInput } from './inputs/TextInput';
import { FormFieldChipGroup } from './inputs/ChipGroup';
import { FormFieldCardGroup } from './inputs/CardGroup';
import { FormFieldSelect } from './inputs/Selector';

interface FormFieldRootProps {
  children: ReactNode;
  className?: string;
}

const FormFieldRoot = ({ children, className = '' }: FormFieldRootProps) => {
  return <View className={`mb-lg ${className}`}>{children}</View>;
};

export const FormField = Object.assign(FormFieldRoot, {
  Label: FormFieldLabel,
  HelperText: FormFieldHelperText,
  TextInput: FormFieldTextInput,
  ChipGroup: FormFieldChipGroup,
  Select: FormFieldSelect,
  CardGroup: FormFieldCardGroup,
});
