import { CardVariant } from './Card.types';

export const CARD_CONTAINER_STYLES: Record<CardVariant, string> = {
  default: 'bg-canvas rounded-2xl border border-hairline overflow-hidden',
  notice: 'bg-primary-subtle p-5 rounded-2xl',
  warning: 'bg-status-warning-subtle p-4 rounded-2xl border border-status-warning/20',
  muted: 'bg-canvas-muted p-5 rounded-2xl',
};

export const CARD_TITLE_STYLES: Record<CardVariant, string> = {
  default: 'text-title-md text-ink',
  notice: 'text-title-md text-primary',
  warning: 'text-title-sm text-status-warning',
  muted: 'text-title-sm text-ink-secondary',
};
