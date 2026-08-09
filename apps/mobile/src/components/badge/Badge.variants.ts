import { BadgeVariant } from "./Badge";


export const BADGE_CONTAINER_STYLES: Record<BadgeVariant, string> = {
  default: '',
  primary: 'bg-primary-subtle',
  danger: 'bg-status-danger-subtle',
};

export const BADGE_TEXT_STYLES: Record<BadgeVariant, string> = {
  default: 'text-status-absent',
  primary: 'text-primary',
  danger: 'text-status-danger',
};
