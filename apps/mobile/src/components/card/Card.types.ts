import { ReactNode } from 'react';

export type CardVariant = 'default' | 'warning' | 'notice' | 'muted';

export interface CardProps {
  variant?: CardVariant;
  onPress?: () => void;
  children: ReactNode;
  className?: string;
}

export interface CardHeaderProps {
  title: string;
  variant?: CardVariant;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  className?: string;
}

export interface CardItemProps {
  title: string;
  description?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
}
