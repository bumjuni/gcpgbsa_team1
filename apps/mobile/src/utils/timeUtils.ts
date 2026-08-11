// timeUtils.ts
export const timeStringToDate = (time: string): Date => {
  const base = new Date();
  if (!time) return base;
  const [h, m] = time.split(':').map(Number);
  base.setHours(h, m, 0, 0);
  return base;
};

export const dateToTimeString = (date: Date): string => {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};
