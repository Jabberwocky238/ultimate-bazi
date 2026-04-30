import { create } from 'zustand'
import type { Sex } from '@jabberwocky238/bazi-engine'
import { HOUR_UNKNOWN, EMPTY_PILLAR, useBazi, type Bazi } from '@/lib'
import { computeBazi, baziToPillars, equationOfTime } from './compute'
import { computeDaYun, useDayun } from './dayun'

/**
 * 排盘输入模式:
 *   gregorian      公历 (默认): 直接以输入的 wall clock 喂引擎, 不做修正。
 *                  trueSolarStr 显示按 120°E 算出的均时差修正参考值。
 *   trueSolar      真太阳时 (用户已自行修正): 输入即真太阳时, 引擎按真太阳时分时柱。
 *   gregorianLong  公历 + 出生地经度: 在 wall clock 基础上加 (经度−120)·4min + 均时差,
 *                  得真太阳时再喂引擎。
 *   bazi           八字直输: 4 干支 + 性别, 跳过公历/农历计算。
 */
export type BaziInputMode = 'gregorian' | 'trueSolar' | 'gregorianLong' | 'bazi'

export interface BaziInputState {
  mode: BaziInputMode
  year: number
  month: number
  day: number
  hour: number
  minute: number
  /** 出生地经度, 单位 °E (东经为正). 仅 gregorianLong 用. */
  longitude: number
  /** 4 干支字符串, 仅 bazi 模式用. 时柱可空串(代表未知). */
  bazi: [string, string, string, string]
  sex: Sex
  setMode: (m: BaziInputMode) => void
  setDate: (d: {
    year: number
    month: number
    day: number
    hour: number
    minute: number
    sex: Sex
  }) => void
  setLongitude: (n: number) => void
  setBaziGz: (b: [string, string, string, string], sex: Sex) => void
  syncToUrl: () => void
}

function parseIntOr(value: string | null, fallback: number): number {
  if (value === null) return fallback
  const n = parseInt(value, 10)
  return Number.isFinite(n) ? n : fallback
}
function parseFloatOr(value: string | null, fallback: number): number {
  if (value === null) return fallback
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : fallback
}

function readQuery() {
  const params = new URLSearchParams(window.location.search)
  const sexRaw = parseIntOr(params.get('sex'), 1)
  const hourRaw = params.get('hour')
  const hourUnknown = hourRaw === 'unknown' || hourRaw === String(HOUR_UNKNOWN)
  const hour = hourUnknown
    ? HOUR_UNKNOWN
    : hourRaw === null || hourRaw === ''
      ? 7
      : parseIntOr(hourRaw, 7)
  const modeRaw = params.get('mode') as BaziInputMode | null
  const mode: BaziInputMode =
    modeRaw === 'trueSolar' || modeRaw === 'gregorianLong' || modeRaw === 'bazi'
      ? modeRaw
      : 'gregorian'
  const baziRaw = params.get('bazi') ?? ''
  const baziArr = baziRaw.split('|')
  const bazi: [string, string, string, string] = [
    baziArr[0] ?? '',
    baziArr[1] ?? '',
    baziArr[2] ?? '',
    baziArr[3] ?? '',
  ]
  return {
    mode,
    year: parseIntOr(params.get('year'), 1893),
    month: parseIntOr(params.get('month'), 12),
    day: parseIntOr(params.get('day'), 26),
    hour,
    minute: hourUnknown ? 0 : parseIntOr(params.get('minute'), 0),
    longitude: parseFloatOr(params.get('lng'), 120),
    bazi,
    sex: (sexRaw === 0 ? 0 : 1) as Sex,
  }
}

const initial = readQuery()

export const useBaziInput = create<BaziInputState>((set, get) => ({
  ...initial,
  setMode: (mode) => set({ mode }),
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
  setLongitude: (longitude) => set({ longitude }),
  setBaziGz: (bazi, sex) => set({ bazi, sex }),
  syncToUrl: () => {
    const { mode, year, month, day, hour, minute, sex, longitude, bazi } = get()
    const q = new URLSearchParams({ sex: String(sex) })
    if (mode !== 'gregorian') q.set('mode', mode)
    if (mode === 'bazi') {
      q.set('bazi', bazi.join('|'))
    } else {
      q.set('year', String(year))
      q.set('month', String(month))
      q.set('day', String(day))
      if (hour === HOUR_UNKNOWN) {
        q.set('hour', 'unknown')
      } else {
        q.set('hour', String(hour))
        q.set('minute', String(minute))
      }
      if (mode === 'gregorianLong') q.set('lng', String(longitude))
    }
    const next = `${window.location.pathname}?${q.toString()}`
    window.history.replaceState(null, '', next)
  },
}))

// ————————————————————————————————————————————————————————
// 输入 → 输出 wiring。
// ————————————————————————————————————————————————————————

function fmtDate(y: number, m: number, d: number, h: number, mi: number): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${y}-${pad(m)}-${pad(d)} ${pad(h)}:${pad(mi)}`
}

function pushBazi(s: BaziInputState) {
  if (s.mode === 'bazi') {
    const valid = s.bazi.slice(0, 3).every((g) => g.length === 2)
    if (!valid) return
    const hourGz = s.bazi[3]
    const hourKnown = hourGz.length === 2
    try {
      const fullBazi: Bazi = [
        s.bazi[0],
        s.bazi[1],
        s.bazi[2],
        hourKnown ? hourGz : '甲子', // 占位, 之后用 EMPTY_PILLAR 覆盖
      ]
      const pillars = baziToPillars(fullBazi, s.sex)
      if (!hourKnown) pillars[3] = EMPTY_PILLAR
      useBazi.getState().setBazi({
        solarStr: '',
        trueSolarStr: '',
        lunarStr: `八字直输 ${s.bazi.filter((g) => g.length === 2).join(' ')}`,
        pillars,
        hourKnown,
      })
    } catch (e) {
      console.warn('[bazi-mode] 解析失败:', e)
      return
    }
    useDayun.getState().setDayun(null)
    return
  }

  // gregorian / trueSolar / gregorianLong: 都走公历→引擎路径, 仅在 hour/minute 处差异
  let { year, month, day, hour, minute } = s
  let trueSolarStr = ''
  let solarStr = ''
  const hourKnown = hour !== HOUR_UNKNOWN && hour >= 0 && hour < 24

  if (s.mode === 'gregorianLong' && hourKnown) {
    // 公历 + 经度 → 真太阳时
    const eot = equationOfTime(year, month, day)
    const longShift = (s.longitude - 120) * 4
    const total = Math.round(eot + longShift)
    const d = new Date(year, month - 1, day, hour, minute, 0)
    d.setMinutes(d.getMinutes() + total)
    solarStr = fmtDate(year, month, day, hour, minute)
    year = d.getFullYear()
    month = d.getMonth() + 1
    day = d.getDate()
    hour = d.getHours()
    minute = d.getMinutes()
    trueSolarStr = fmtDate(year, month, day, hour, minute)
  } else if (s.mode === 'trueSolar' && hourKnown) {
    // 输入即真太阳时, 直接喂引擎, 不再做 EOT 修正
    trueSolarStr = fmtDate(year, month, day, hour, minute)
  }

  const r = computeBazi(year, month, day, hour, minute, s.sex)
  if (s.mode === 'gregorianLong' && solarStr) {
    r.solarStr = `${solarStr} (公历)`
    r.trueSolarStr = `${trueSolarStr} (真太阳时)`
  } else if (s.mode === 'trueSolar' && trueSolarStr) {
    r.trueSolarStr = `${trueSolarStr} (输入即真太阳时, 未再做均时差)`
  }
  useBazi.getState().setBazi(r)
  useDayun.getState().setDayun(computeDaYun(year, month, day, hour, minute, s.sex))
}

pushBazi(useBaziInput.getState())

useBaziInput.subscribe((s, prev) => {
  if (
    s.mode === prev.mode &&
    s.year === prev.year &&
    s.month === prev.month &&
    s.day === prev.day &&
    s.hour === prev.hour &&
    s.minute === prev.minute &&
    s.sex === prev.sex &&
    s.longitude === prev.longitude &&
    s.bazi[0] === prev.bazi[0] &&
    s.bazi[1] === prev.bazi[1] &&
    s.bazi[2] === prev.bazi[2] &&
    s.bazi[3] === prev.bazi[3]
  ) return
  pushBazi(s)
})
