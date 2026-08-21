import { ProgramStatusType, SwimClass } from '../types/classroom';

const DAY_MAP: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

const DAY_LABEL_MAP: Record<number, string> = {
  0: '일', 1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토',
};

export const GENDER_MAP: Record<string, string> = {
  MALE: '남', FEMALE: '여',
};

export const LEVEL_MAP: Record<string, string> = {
  BEGINNER: '신규', ELEMENTARY: '초급', INTERMEDIATE: '중급', ADVANCED: '고급', MASTER: '마스터즈'
};

export const parseDaysOfWeek = (daysOfWeek: string): number[] => {
  return daysOfWeek
    .split(',')
    .map((d) => d.trim())
    .filter((d) => d in DAY_MAP)
    .map((d) => DAY_MAP[d]);
};

const parseTime = (time: string): { hour: number; minute: number } => {
  const [hour, minute] = time.split(':').map(Number);
  return { hour, minute };
};

export const isToday = (daysOfWeek: string, now: Date = new Date()): boolean => {
  const todayIndex = now.getDay();
  return parseDaysOfWeek(daysOfWeek).includes(todayIndex);
};

export function isTimePassed(time: string): boolean {
  const [hourStr, minuteStr] = time.split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);

  return now.getTime() > target.getTime();
}

// isTodayClassEnded 삭제. 시각으로 "종료"를 판정하지 않는다 (SRS: completed 여부만 본다).

/**
 * 다음 수업 일시 계산 (SRS 3번 로직)
 * - 오늘이 수업일이고 today_program_status가 completed가 아니면 -> "오늘" (시각 무관)
 * - 오늘 수업시간이 지나면 종료하는 것으로 상정
 * - 그 외 -> 다음 주기 중 가장 가까운 미래 요일
 */
export const getNextClassDate = (
  daysOfWeek: string,
  startTime: string,
  endTime: string,
  todayProgramStatus: ProgramStatusType | null,
  now: Date = new Date()
): { date: Date; isToday: boolean } | null => {
  const days = parseDaysOfWeek(daysOfWeek);
  if (days.length === 0) return null;

  const todayIndex = now.getDay();
  const { hour, minute } = parseTime(startTime);
  const isTodayCompleted = isTimePassed(endTime)
  // const isTodayCompleted = todayProgramStatus === 'COMPLETED';

  if (days.includes(todayIndex) && !isTodayCompleted) {
    const todayDate = new Date(now);
    todayDate.setHours(hour, minute, 0, 0);
    return { date: todayDate, isToday: true };
  }

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

/** "다음 8월 12일 (수) 오전 10:00" / "오늘 종료 · 다음 ..." 등 텍스트 생성 */
export const formatNextClassLabel = (
  daysOfWeek: string,
  startTime: string,
  endTime: string,
  todayProgramStatus: ProgramStatusType | null,
  now: Date = new Date()
): string => {
  const today = isToday(daysOfWeek, now);
  const todayCompleted = todayProgramStatus === 'COMPLETED';
  const next = getNextClassDate(daysOfWeek, startTime, endTime, todayProgramStatus, now);

  if (!next) return '수업 일정 없음';

  if (next.isToday) {
    return `오늘 ${formatAmPmTime(next.date.getHours(), next.date.getMinutes())}`;
  }

  const m = next.date.getMonth() + 1;
  const d = next.date.getDate();
  const dayLabel = DAY_LABEL_MAP[next.date.getDay()];
  const timeLabel = formatAmPmTime(next.date.getHours(), next.date.getMinutes());

  if (today && todayCompleted) {
    return `오늘 종료 · 다음 ${m}월 ${d}일 (${dayLabel}) ${timeLabel}`;
  }
  return `다음 수업 · ${m}월 ${d}일 (${dayLabel}) ${timeLabel}`;
};

/** 섹션① 오늘 카드 뱃지: completed면 종료, 아니면 다음(단, "다음"은 화면에서 1개만 골라 씀) */
export const getTodayBadge = (
  todayProgramStatus: ProgramStatusType | null
): { text: string; variant: 'primary-stressed' | 'present' } => {
  return todayProgramStatus === 'COMPLETED'
    ? { text: '종료', variant: 'present' }
    : { text: '다음', variant: 'primary-stressed' };
};


/** next_program_status -> 전체 반 카드 뱃지 (섹션② 4종) */
export const getLessonPlanBadge = (
  nextProgramStatus: ProgramStatusType | null
): { text: string; variant: 'primary' | 'present' | 'muted' } => {
  switch (nextProgramStatus) {
    case 'CONFIRMED':
      return { text: '수업안 확정됨', variant: 'present' };
    case 'INPROGRESS':
      return { text: '수업 진행중', variant: 'primary' };
    case 'DRAFT':
      return { text: '수업안 준비중', variant: 'primary' };
    case 'COMPLETED':
      console.warn('Unexpected completed in next_program_status');
      return { text: '수업안 없음', variant: 'muted' };
    default:
      return { text: '수업안 없음', variant: 'muted' };
  }
};


export const timeToMinutes = (time: string): number => {
  const { hour, minute } = parseTime(time);
  return hour * 60 + minute;
};

/**
 * 오늘의 수업들 중 completed가 아닌 것 중 시작 시각이 가장 이른 것 1개의 id
 * (시간 경과가 아니라 status로 판정 — SRS 원칙)
 */
export const getNearestUpcomingTodayClassId = (
  todayClasses: SwimClass[]
): number | null => {
  const upcoming = todayClasses
    .filter((item) => item.today_program_status !== 'COMPLETED')
    .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

  return upcoming[0]?.id ?? null;
};

/** 오늘의 수업 카드용 수업안 상태 문구 */
export const getTodayClassPlanText = (
  todayProgramStatus: ProgramStatusType | null
): string => {
  switch (todayProgramStatus) {
    case 'CONFIRMED':
      return '수업안 확정됨';
    case 'INPROGRESS':
      return '수업 진행중';
    case 'DRAFT':
      return '수업안 준비중';
    default:
      return '수업안을 아직 안 만들었어요';
  }
};


export const formatDateToYMD = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};


export interface ProgramHistoryItem {
  program_id: number;
  status: string;
  date: string; // 'YYYY-MM-DD'
}

export interface WeekGroup {
  weekLabel: string; // e.g. "8월 1주차 (8/3~8/9)"
  lessons: {
    id: number;
    date: string;
    label: string; // e.g. "8월 6일 (목) 오후 7:00"
    status: string;
  }[];
}

/**
 * 해당 날짜가 속한 주(일~토)의 시작일(일요일)을 반환
 */
function getWeekStart(d: Date): Date {
  const day = d.getDay(); // 0(일) ~ 6(토)
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * ISO 8601 규칙: 해당 주(일~토)의 목요일이 속한 달/주차를 계산
 * 주차 = 그 달의 몇 번째 목요일인지
 */
function getWeekInfo(weekStart: Date): { year: number; month: number; weekOfMonth: number } {
  const thursday = new Date(weekStart);
  thursday.setDate(weekStart.getDate() + 4); // 일요일 시작 기준 +4 = 목요일

  const year = thursday.getFullYear();
  const month = thursday.getMonth() + 1;

  // 해당 월의 첫 번째 목요일 찾기
  const firstOfMonth = new Date(year, month - 1, 1);
  const firstDay = firstOfMonth.getDay();
  const offsetToFirstThursday = (4 - firstDay + 7) % 7;
  const firstThursdayDate = 1 + offsetToFirstThursday;

  const weekOfMonth = Math.floor((thursday.getDate() - firstThursdayDate) / 7) + 1;

  return { year, month, weekOfMonth };
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function formatDateLabel(dateStr: string, startTime: string): string {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dayLabel = DAY_LABELS[d.getDay()];
  const timeLabel = formatTimeToAmPm(startTime); // 기존 timeUtils 활용, 없으면 시그니처 확인 필요
  return `${month}월 ${day}일 (${dayLabel}) ${timeLabel}`;
}

export function groupProgramHistoryByWeek(
  programs: ProgramHistoryItem[],
  startTime: string,
): WeekGroup[] {
  const groups = new Map<string, WeekGroup & { sortKey: number }>();

  for (const program of programs) {
    const d = new Date(program.date);
    const weekStart = getWeekStart(d);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const { month, weekOfMonth } = getWeekInfo(weekStart);
    const key = `${weekStart.toISOString()}`;

    const rangeLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()}~${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;
    const weekLabel = `${month}월 ${weekOfMonth}주차 (${rangeLabel})`;

    if (!groups.has(key)) {
      groups.set(key, {
        weekLabel,
        lessons: [],
        sortKey: weekStart.getTime(),
      });
    }

    groups.get(key)!.lessons.push({
      id: program.program_id,
      date: program.date,
      label: formatDateLabel(program.date, startTime),
      status: program.status,
    });
  }

  return Array.from(groups.values())
    .sort((a, b) => b.sortKey - a.sortKey) // 최신 주차 먼저
    .map((g) => ({
      weekLabel: g.weekLabel,
      lessons: g.lessons.sort((a, b) => (a.date < b.date ? 1 : -1)), // 주 내에서도 최신순
    }));
}

/**
 * "HH:mm" 형식의 시간 문자열을 "오전/오후 h:mm" 형식으로 변환
 * @param time "HH:mm" (24시간제)
 */
export function formatTimeToAmPm(time: string): string {
  const [hourStr, minuteStr] = time.split(':');
  const hour = Number(hourStr);
  const minute = minuteStr.padStart(2, '0');

  const period = hour < 12 ? '오전' : '오후';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;

  return `${period} ${hour12}:${minute}`;
}

export const filterPassedLessonPlans = (
  historyList: ProgramHistoryItem[],
  endTime: string,
): ProgramHistoryItem[] => {
  const now = new Date();

  return historyList.filter((item) => {
    // 'YYYY-MM-DDTHH:mm' 포맷으로 Date 객체 생성
    const itemDateTime = new Date(`${item.date}T${endTime}`);

    // 유효한 날짜이고, 해당 수업 시작 시간이 현재 시간보다 같거나 이전인 경우만 남김
    return !isNaN(itemDateTime.getTime()) && itemDateTime <= now;
  });
};
