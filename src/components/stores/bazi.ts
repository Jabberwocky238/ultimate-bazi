import { create } from 'zustand'
import type { Sex } from '@jabberwocky238/bazi-engine'
import { HOUR_UNKNOWN, computeBazi, useBazi, computeDaYun, useDayun } from '@/lib'

export interface BaziInputState {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  sex: Sex
  setDate: (d: {
    year: number
    month: number
    day: number
    hour: number
    minute: number
    sex: Sex
  }) => void
  syncToUrl: () => void
}

function parseIntOr(value: string | null, fallback: number): number {
  if (value === null) return fallback
  const n = parseInt(value, 10)
  return Number.isFinite(n) ? n : fallback
}

function readQuery() {
  const params = new URLSearchParams(window.location.search)
  const sexRaw = parseIntOr(params.get('sex'), 1)
  const hourRaw = params.get('hour')
  // 'unknown' / '-1' 表示时柱缺失；其余缺省值落到 7 点（默认"时辰已知"）
  const hourUnknown = hourRaw === 'unknown' || hourRaw === String(HOUR_UNKNOWN)
  const hour = hourUnknown
    ? HOUR_UNKNOWN
    : hourRaw === null || hourRaw === ''
      ? 7
      : parseIntOr(hourRaw, 7)
  return {
    year: parseIntOr(params.get('year'), 1893),
    month: parseIntOr(params.get('month'), 12),
    day: parseIntOr(params.get('day'), 26),
    hour,
    minute: hourUnknown ? 0 : parseIntOr(params.get('minute'), 0),
    sex: (sexRaw === 0 ? 0 : 1) as Sex,
  }
}

const initial = readQuery()

export const useBaziInput = create<BaziInputState>((set, get) => ({
  ...initial,
  setDate: ({ year, month, day, hour, minute, sex }) => {
    const hourKnown = hour !== HOUR_UNKNOWN
    set({
      year,
      month,
      day,
      hour,
      minute: hourKnown ? minute : 0,
      sex,
    })
  },
  syncToUrl: () => {
    const { year, month, day, hour, minute, sex } = get()
    const q = new URLSearchParams({
      year: String(year),
      month: String(month),
      day: String(day),
      sex: String(sex),
    })
    if (hour === HOUR_UNKNOWN) {
      q.set('hour', 'unknown')
    } else {
      q.set('hour', String(hour))
      q.set('minute', String(minute))
    }
    const next = `${window.location.pathname}?${q.toString()}`
    window.history.replaceState(null, '', next)
  },
}))

// ————————————————————————————————————————————————————————
// 输入 → 输出 wiring：把日期输入算成 BaziResult / DaYunData，分别填入
// lib 里的 useBazi / useDayun。下游 useShishen / useStrength / useShensha
// / useGeju / useXiyong 会通过订阅 useBazi 自动更新。
// ————————————————————————————————————————————————————————

function pushBazi(s: BaziInputState) {
  useBazi.getState().setBazi(computeBazi(s.year, s.month, s.day, s.hour, s.minute, s.sex))
  useDayun.getState().setDayun(computeDaYun(s.year, s.month, s.day, s.hour, s.minute, s.sex))
}

pushBazi(useBaziInput.getState())

useBaziInput.subscribe((s, prev) => {
  if (
    s.year === prev.year &&
    s.month === prev.month &&
    s.day === prev.day &&
    s.hour === prev.hour &&
    s.minute === prev.minute &&
    s.sex === prev.sex
  ) return
  pushBazi(s)
})
