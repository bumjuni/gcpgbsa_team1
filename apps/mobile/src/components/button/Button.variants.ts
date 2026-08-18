import { ButtonVariant } from "./Button";

export const BUTTON_CONTAINER_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary border-[1px] border-primary',
  disabled: 'bg-canvas-muted border-[1px] border-hairline-border-strong',
  text: '',
  danger: 'bg-status-danger-subtle',
};

export const BUTTON_TEXT_STYLES: Record<ButtonVariant, string> = {
  primary: 'text-ink-on-primary text-button',
  secondary: 'text-primary text-button',
  disabled: 'text-ink-secondary',
  text: 'text-ink-secondary text-button-sm',
  danger: 'text-status-danger text-button',
};
