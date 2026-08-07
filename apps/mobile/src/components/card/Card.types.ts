import { ReactNode } from 'react';

export type CardVariant = 'default' | 'warning' | 'notice' | 'muted';

export interface CardProps {
  variant?: CardVariant;
  onPress?: () => void;
  children: ReactNode;
  className?: string;
}
