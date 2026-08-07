export interface Option<T = string> {
  label: string;
  value: T;
  description?: string;
}

export interface FormFieldChipGroupProps<T> {
  options: Option<T>[];
  value: T | T[];
  onChange: (value: any) => void;
  multiple?: boolean;
  variant?: 'circle' | 'pill';
}

export interface FormFieldCardGroupProps<T> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

export interface FormFieldSelectProps {
  value?: string;
  placeholder?: string;
  onPress: () => void;
}
