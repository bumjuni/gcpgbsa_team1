// utils/classSchedule.ts
import { ProgramStatusType, SwimClass } from '../api/types';

const DAY_MAP: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

const DAY_LABEL_MAP: Record<number, string> = {
  0: '일', 1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토',
};

/** "Mon, Tue, Wed" -> [1, 2, 3] */
export const parseDaysOfWeek = (daysOfWeek: string): number[] => {
  return daysOfWeek
    .split(',')
    .map((d) => d.trim())
    .filter((d) => d in DAY_MAP)
    .map((d) => DAY_MAP[d]);
};

/** "HH:mm:ss" 또는 "HH:mm" -> { hour, minute } */
const parseTime = (time: string): { hour: number; minute: number } => {
  const [hour, minute] = time.split(':').map(Number);
  return { hour, minute };
};

export const isToday = (daysOfWeek: string, now: Date = new Date()): boolean => {
  const todayIndex = now.getDay();
  return parseDaysOfWeek(daysOfWeek).includes(todayIndex);
};

/** 오늘 수업이 시간상 종료되었는지 (로컬 시간 기준) */
export const isTodayClassEnded = (endTime: string, now: Date = new Date()): boolean => {
  const { hour, minute } = parseTime(endTime);
  const end = new Date(now);
  end.setHours(hour, minute, 0, 0);
  return now.getTime() >= end.getTime();
};

/**
 * 다음 수업 일시 계산
 * - 오늘이 수업일이고 아직 종료 전이면 -> "오늘"
 * - 오늘이 수업일이고 이미 종료됐으면 -> 다음 주기 중 가장 가까운 미래 요일
 * - 오늘이 수업일이 아니면 -> 가장 가까운 미래 요일
 */
export const getNextClassDate = (
  daysOfWeek: string,
  startTime: string,
  now: Date = new Date()
): { date: Date; isToday: boolean } | null => {
  const days = parseDaysOfWeek(daysOfWeek);
  if (days.length === 0) return null;

  const todayIndex = now.getDay();
  const { hour, minute } = parseTime(startTime);

  const todayStart = new Date(now);
  todayStart.setHours(hour, minute, 0, 0);

  if (days.includes(todayIndex) && now.getTime() < todayStart.getTime()) {
    return { date: todayStart, isToday: true };
  }

  // 오늘 이후(내일부터) 가장 가까운 수업일 탐색
  for (let offset = 1; offset <= 7; offset++) {
    const candidateIndex = (todayIndex + offset) % 7;
    if (days.includes(candidateIndex)) {
      const candidate = new Date(now);
      candidate.setDate(now.getDate() + offset);
      candidate.setHours(hour, minute, 0, 0);
      return { date: candidate, isToday: false };
    }
  }
  return null;
};

const pad2 = (n: number) => String(n).padStart(2, '0');

const formatAmPmTime = (hour: number, minute: number): string => {
  const period = hour < 12 ? '오전' : '오후';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${period} ${displayHour}:${pad2(minute)}`;
};

export const formatTime = (time: string): string => {
  const { hour, minute } = parseTime(time);
  return formatAmPmTime(hour, minute);
};

/** "다음 8월 12일 (수) 오전 10:00" / "다음 수업 · 오늘 오후 5:00" 등 텍스트 생성 */
export const formatNextClassLabel = (
  daysOfWeek: string,
  startTime: string,
  endTime: string,
  now: Date = new Date()
): string => {
  const today = isToday(daysOfWeek, now);
  const ended = today ? isTodayClassEnded(endTime, now) : false;
  const next = getNextClassDate(daysOfWeek, startTime, now);

  const prefix = today && !ended ? '오늘 종료' : today && ended ? '오늘 종료' : '';

  if (!next) return prefix || '수업 일정 없음';

  if (next.isToday) {
    return `오늘 ${formatAmPmTime(next.date.getHours(), next.date.getMinutes())}`;
  }

  const m = next.date.getMonth() + 1;
  const d = next.date.getDate();
  const dayLabel = DAY_LABEL_MAP[next.date.getDay()];
  const timeLabel = formatAmPmTime(next.date.getHours(), next.date.getMinutes());

  if (today && ended) {
    return `오늘 종료 · 다음 ${m}월 ${d}일 (${dayLabel}) ${timeLabel}`;
  }
  return `다음 수업 · ${m}월 ${d}일 (${dayLabel}) ${timeLabel}`;
};

export const getTodayBadge = (
  endTime: string,
  now: Date = new Date()
): { text: string; variant: 'default' | 'primary' | 'danger' } => {
  return isTodayClassEnded(endTime, now)
    ? { text: '종료', variant: 'default' }
    : { text: '다음', variant: 'primary' };
};

/** lesson_status(ProgramStatusEnum | null) -> 전체 반 카드 뱃지 */
export const getLessonPlanBadge = (
  lessonStatus: ProgramStatusType | null
): { text: string; variant: 'default' | 'primary' | 'danger' } => {
  switch (lessonStatus) {
    case 'SCHEDULED':
      return { text: '수업안 확정됨', variant: 'primary' };
    case 'DRAFT':
      return { text: '수업안 준비중', variant: 'default' };
    case 'COMPLETED':
      return { text: '수업안 완료', variant: 'default' };
    default:
      return { text: '수업안 없음', variant: 'default' };
  }
};

// 기존 parseTime 재사용 위해 분 단위로 변환하는 헬퍼 추가
export const timeToMinutes = (time: string): number => {
  const { hour, minute } = (() => {
    const [h, m] = time.split(':').map(Number);
    return { hour: h, minute: m };
  })();
  return hour * 60 + minute;
};

/**
 * 오늘의 수업들 중, 아직 종료되지 않은 수업 중 시작 시각이 가장 이른(=가장 가까운) 것 1개의 id
 * (진행 중인 수업도 "아직 시간이 지나지 않음"에 포함)
 */
 export const getNearestUpcomingTodayClassId = (
   todayClasses: SwimClass[],
   now: Date = new Date()
 ): number | null => {
   const upcoming = todayClasses
     .filter((item) => !isTodayClassEnded(item.end_time, now))
     .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

   return upcoming[0]?.id ?? null;
 };

/** 오늘의 수업 카드용 수업안 상태 문구 */
export const getTodayClassPlanText = (lessonStatus: ProgramStatusType | null): string => {
  return lessonStatus === 'SCHEDULED'
    ? '수업안 확정됨'
    : '수업안을 아직 안 만들었어요';
};
