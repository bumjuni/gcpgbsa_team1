import { ButtonVariant } from "./Button";

export const BUTTON_CONTAINER_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary border-[1px] border-primary',
  text: '',
  danger: 'bg-status-danger-subtle',
};

export const BUTTON_TEXT_STYLES: Record<ButtonVariant, string> = {
  primary: 'text-ink-on-primary text-button',
  secondary: 'text-primary text-button',
  text: 'text-tertiary text-button-sm',
  danger: 'text-status-danger text-button',
};
