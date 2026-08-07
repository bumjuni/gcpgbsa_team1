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
