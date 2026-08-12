import { BadgeVariant } from "./Badge";


export const BADGE_CONTAINER_STYLES: Record<BadgeVariant, string> = {
  default: '',
  primary: 'bg-primary-subtle',
  'primary-stressed': 'bg-primary',
  present: 'bg-status-present-subtle',
  danger: 'bg-status-danger-subtle',
  muted: 'bg-hairline border border-hairline',
};

export const BADGE_TEXT_STYLES: Record<BadgeVariant, string> = {
  default: 'text-status-absent',
  primary: 'text-primary',
  'primary-stressed': 'text-ink-on-primary',
  present: 'text-status-present',
  danger: 'text-status-danger',
  muted: 'text-ink-secondary',
};
