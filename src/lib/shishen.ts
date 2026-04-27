import { Solar } from 'lunar-typescript'
import { create } from 'zustand'
import {
  computeShensha,
  computeShishen,
  ganWuxing,
  zhiWuxing,
  zizuoState,
  nayinOf,
  wuxingRelations,
  seasonOf,
  ShishenMap,
  CANG_GAN,
  type BaziInput,
  type Gan,
  type Zhi,
  type Sex,
  type Season,
  type Shishen,
  type ShishenCat,
  type WuXing,
} from '@jabberwocky238/bazi-engine'

import type { Pillar, PillarType, BaziResult } from './store'

// ————————————————————————————————————————————————————————
// 共享常量（同时被 useBazi / useShishen 与 geju/types.ts 重导出使用）
// ————————————————————————————————————————————————————————

/** 十神 → 类别映射（依 engine ShishenMap 派生）。 */
export const SHI_SHEN_CAT: Record<string, ShishenCat> = Object.fromEntries(
  Object.entries(ShishenMap).map(([name, def]) => [name, def.category]),
) as Record<string, ShishenCat>

/** 地支六冲对。 */
export const CHONG_PAIR: Record<string, string> = {
  子: '午', 午: '子', 卯: '酉', 酉: '卯',
  寅: '申', 申: '寅', 巳: '亥', 亥: '巳',
  辰: '戌', 戌: '辰', 丑: '未', 未: '丑',
}

const YANG_GANS: ReadonlySet<string> = new Set(['甲', '丙', '戊', '庚', '壬'])

/** 四柱干支字符串元组 (年/月/日/时)，如 `['甲子','己巳','壬子','乙巳']`。 */
export type Bazi = [string, string, string, string]

export const HOUR_UNKNOWN = -1

export type basicBaziState = {
  gan: [Gan, Gan, Gan, Gan],
  zhi: [Zhi, Zhi, Zhi, Zhi],
} 

/** 十神五行 (依日主) — 通过 engine 的 ShishenMap + wuxingRelations 派生。
 *  日主本位/空串/未识别十神统一回空串。 */
export function shishenWuxing(dayGan: string, shishen: string): WuXing | '' {
  if (shishen === '日主') return ganWuxing(dayGan as Gan) ?? ''
  const def = ShishenMap[shishen as Shishen]
  if (!def) return ''
  return wuxingRelations(dayGan as Gan)[def.relation] ?? ''
}

// —— 真太阳时：按均时差修正北京时间 (120°E)，不含经度修正 ——
function dayOfYear(year: number, month: number, day: number): number {
  const start = Date.UTC(year, 0, 1)
  const d = Date.UTC(year, month - 1, day)
  return Math.floor((d - start) / 86400000) + 1
}

function equationOfTime(year: number, month: number, day: number): number {
  const n = dayOfYear(year, month, day)
  const B = (2 * Math.PI * (n - 81)) / 365
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B)
}

function formatTrueSolar(year: number, month: number, day: number, hour: number, minute: number): string {
  const eot = equationOfTime(year, month, day)
  const d = new Date(year, month - 1, day, hour, minute, 0)
  d.setMinutes(d.getMinutes() + Math.round(eot))
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${dd} ${hh}:${mm}`
}

// —— 时辰未知时的占位时柱 (UI 应依 hourKnown 跳过渲染) ——
const EMPTY_PILLAR = {
  label: '时柱',
  gan: '',
  zhi: '',
  ganWuxing: '',
  zhiWuxing: '',
  nayin: '',
  hideGans: [],
  shishen: '',
  shishenWuxing: '',
  hideShishen: [],
  hideShishenWuxings: [],
  shensha: [],
  zizuo: '',
} as unknown as Pillar

export function computeBazi(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  sex: Sex,
): BaziResult {
  const hourKnown = hour !== HOUR_UNKNOWN && hour >= 0 && hour < 24
  const safeHour = hourKnown ? hour : 0
  const safeMinute = hourKnown && minute >= 0 && minute < 60 ? minute : 0
  const solar = Solar.fromYmdHms(year, month, day, safeHour, safeMinute, 0)
  const lunar = solar.getLunar()
  const ec = lunar.getEightChar()
  // sect=1：23:00 即换日（早子换日派）
  ec.setSect(1)

  const input: BaziInput = {
    year: { gan: ec.getYearGan() as Gan, zhi: ec.getYearZhi() as Zhi },
    month: { gan: ec.getMonthGan() as Gan, zhi: ec.getMonthZhi() as Zhi },
    day: { gan: ec.getDayGan() as Gan, zhi: ec.getDayZhi() as Zhi },
    hour: { gan: ec.getTimeGan() as Gan, zhi: ec.getTimeZhi() as Zhi },
    sex,
  }
  const shensha = computeShensha(input)
  const shishen = computeShishen(input)
  const dayGan = input.day.gan

  const base = [
    { label: '年柱' as const, gan: input.year.gan, zhi: input.year.zhi, nayin: ec.getYearNaYin(), hide: ec.getYearHideGan(), ssKey: 'year' as const },
    { label: '月柱' as const, gan: input.month.gan, zhi: input.month.zhi, nayin: ec.getMonthNaYin(), hide: ec.getMonthHideGan(), ssKey: 'month' as const },
    { label: '日柱' as const, gan: input.day.gan, zhi: input.day.zhi, nayin: ec.getDayNaYin(), hide: ec.getDayHideGan(), ssKey: 'day' as const },
    { label: '时柱' as const, gan: input.hour.gan, zhi: input.hour.zhi, nayin: ec.getTimeNaYin(), hide: ec.getTimeHideGan(), ssKey: 'hour' as const },
  ]

  const pillars = base.map<Pillar>((p, i) => {
    const ss = shishen.十神[i]
    const hideSs = shishen.藏干十神[i]
    return {
      label: p.label,
      gan: p.gan,
      zhi: p.zhi,
      ganWuxing: ganWuxing(p.gan),
      zhiWuxing: zhiWuxing(p.zhi),
      nayin: p.nayin,
      hideGans: [...p.hide] as Gan[],
      shishen: ss as Shishen,
      shishenWuxing: shishenWuxing(dayGan, ss) as WuXing,
      hideShishen: hideSs,
      hideShishenWuxings: hideSs.map((s) => shishenWuxing(dayGan, s)) as WuXing[],
      shensha: shensha[p.ssKey],
      zizuo: zizuoState(p.gan, p.zhi),
    }
  })

  if (!hourKnown) pillars[3] = EMPTY_PILLAR

  return {
    solarStr: hourKnown
      ? solar.toYmdHms()
      : `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 时辰未知`,
    trueSolarStr: hourKnown ? formatTrueSolar(year, month, day, hour, minute) : '',
    lunarStr: hourKnown
      ? `${lunar.toString()} ${lunar.getTimeZhi()}时`
      : `${lunar.toString()} 时辰未知`,
    pillars,
    hourKnown,
  }
}

// ———— 直接由四柱干支构造 Pillar[] (不需要生日) ————

const PILLAR_LABELS: PillarType[] = ['年柱', '月柱', '日柱', '时柱']
const SS_KEYS = ['year', 'month', 'day', 'hour'] as const

function parseGz(gz: string): { gan: Gan; zhi: Zhi } {
  if (gz.length !== 2) throw new Error(`bad ganzhi: ${gz}`)
  return { gan: gz[0] as Gan, zhi: gz[1] as Zhi }
}

/**
 * 直接由四柱干支 + 性别构造 Pillar[]，跳过公历/农历计算。
 * 用于测试或已知八字直接喂进 detector 等场景；神煞依赖四柱干支 + 性别，不依赖具体日期。
 */
export function baziToPillars(bazi: Bazi, sex: Sex): Pillar[] {
  const parsed = bazi.map(parseGz) as [
    { gan: Gan; zhi: Zhi }, { gan: Gan; zhi: Zhi },
    { gan: Gan; zhi: Zhi }, { gan: Gan; zhi: Zhi },
  ]
  const [y, m, d, h] = parsed
  const input: BaziInput = { year: y, month: m, day: d, hour: h, sex }
  const shishen = computeShishen(input)
  const shensha = computeShensha(input)
  const dayGan = d.gan
  return parsed.map((p, i): Pillar => {
    const ss = shishen.十神[i]
    const hideSs = shishen.藏干十神[i]
    return {
      label: PILLAR_LABELS[i],
      gan: p.gan,
      zhi: p.zhi,
      ganWuxing: ganWuxing(p.gan),
      zhiWuxing: zhiWuxing(p.zhi),
      nayin: nayinOf(p.gan, p.zhi),
      hideGans: [...CANG_GAN[p.zhi]] as Gan[],
      shishen: ss as Shishen,
      shishenWuxing: shishenWuxing(dayGan, ss) as WuXing,
      hideShishen: hideSs,
      hideShishenWuxings: hideSs.map((s) => shishenWuxing(dayGan, s)) as WuXing[],
      shensha: shensha[SS_KEYS[i]],
      zizuo: zizuoState(p.gan, p.zhi),
    }
  })
}

// ————————————————————————————————————————————————————————
// Stores
//   useBazi    — 八字结果 + 派生柱级数据/查询；接管原 Ctx 大部分柱面字段。
//   useShishen — 十神面派生数据 + 查询方法（tou / countCat / adjacentTou ...）。
//   useShensha — 神煞按柱视图。
// ————————————————————————————————————————————————————————

const EMPTY_BAZI: BaziResult = {
  solarStr: '',
  trueSolarStr: '',
  lunarStr: '',
  pillars: [],
  hourKnown: false,
}

interface BaziDerived {
  /** 日主天干。pillars 不齐时回空串。 */
  dayGan: Gan | ''
  dayZhi: Zhi | ''
  dayGz: string
  dayWx: WuXing | ''
  /** 日主阳干（甲丙戊庚壬）。 */
  dayYang: boolean
  yearZhi: Zhi | ''
  monthZhi: Zhi | ''
  /** 月支所在季节，pillars 不齐时回空串。 */
  season: Season | ''
  /** 月支主气十神类别（'比劫' / '财' …）。 */
  monthCat: ShishenCat | ''
  /** 月支是否被其他柱地支所冲。 */
  monthZhiBeingChong: boolean
  /** 四柱数组别名（同 pillars，便于沿用旧 ctx.mainArr 的语义）。 */
  mainArr: Pillar[]
  /** 年/月/时三柱天干集合（不含日主）。 */
  ganSet: Set<Gan>
}

interface BaziStore extends BaziResult, BaziDerived {
  setBazi: (r: BaziResult) => void
  /** 五行查询（基于 pillars） */
  ganWxCount: (wx: WuXing) => number
  zhiMainWxCount: (wx: WuXing) => number
  touWx: (wx: WuXing) => boolean
  rootWx: (wx: WuXing) => boolean
  /** 本气或中气含此五行 */
  rootExt: (wx: WuXing) => boolean
}

function deriveBazi(b: BaziResult): BaziDerived {
  const [year, month, day, hour] = b.pillars
  const dayGan = (day?.gan ?? '') as Gan | ''
  const dayZhi = (day?.zhi ?? '') as Zhi | ''
  const monthZhi = (month?.zhi ?? '') as Zhi | ''
  const monthMain = month?.hideShishen[0]
  let season: Season | '' = ''
  if (monthZhi) {
    try { season = seasonOf(monthZhi as Zhi) } catch { season = '' }
  }
  const monthChongTarget = CHONG_PAIR[monthZhi]
  const monthZhiBeingChong = !!monthChongTarget && [
    year?.zhi, day?.zhi, hour?.zhi,
  ].includes(monthChongTarget as Zhi)
  return {
    dayGan,
    dayZhi,
    dayGz: dayGan && dayZhi ? `${dayGan}${dayZhi}` : '',
    dayWx: (dayGan ? ganWuxing(dayGan as Gan) : '') as WuXing | '',
    dayYang: !!dayGan && YANG_GANS.has(dayGan),
    yearZhi: (year?.zhi ?? '') as Zhi | '',
    monthZhi,
    season,
    monthCat: (monthMain ? (SHI_SHEN_CAT[monthMain] ?? '') : '') as ShishenCat | '',
    monthZhiBeingChong,
    mainArr: b.pillars,
    ganSet: new Set(
      [year?.gan, month?.gan, hour?.gan].filter(Boolean) as Gan[],
    ),
  }
}

export const useBazi = create<BaziStore>()((set, get) => ({
  ...EMPTY_BAZI,
  ...deriveBazi(EMPTY_BAZI),
  setBazi: (r) => set({ ...r, ...deriveBazi(r) }),
  ganWxCount: (wx) => get().pillars.filter((p) => ganWuxing(p.gan) === wx).length,
  zhiMainWxCount: (wx) =>
    get().pillars.filter((p) => {
      const g = p.hideGans[0]
      return !!g && ganWuxing(g) === wx
    }).length,
  touWx: (wx) => get().pillars.some((p, i) => i !== 2 && ganWuxing(p.gan) === wx),
  rootWx: (wx) => get().zhiMainWxCount(wx) > 0,
  rootExt: (wx) =>
    get().pillars.some((p) => {
      const b = p.hideGans[0]
      const m = p.hideGans[1]
      return (!!b && ganWuxing(b) === wx) || (!!m && ganWuxing(m) === wx)
    }),
}))

interface ShishenDerived {
  dayGan: Gan | ''
  byPillar: Shishen[]
  hideByPillar: Shishen[][]
  /** 年/月/时 三柱天干十神（剔除"日主"）。 */
  ganSs: Shishen[]
  /** 四柱地支本气十神（按柱索引对齐；未知位回 ''）。 */
  mainZhiArr: string[]
  /** 四柱所有藏干十神展平。 */
  allZhiArr: Shishen[]
}

interface ShishenStore extends ShishenDerived {
  tou: (s: Shishen) => boolean
  touCat: (c: ShishenCat) => boolean
  zang: (s: Shishen) => boolean
  has: (s: Shishen) => boolean
  hasCat: (c: ShishenCat) => boolean
  mainAt: (s: Shishen) => number[]
  strong: (s: Shishen) => boolean
  strongCat: (c: ShishenCat) => boolean
  countOf: (s: Shishen) => number
  countCat: (c: ShishenCat) => number
  /** 两个十神是否在相邻柱天干紧贴（差 1）。 */
  adjacentTou: (s1: Shishen, s2: Shishen) => boolean
}

function deriveShishen(b: BaziResult): ShishenDerived {
  const [year, month, day, hour] = b.pillars
  const ganSs: Shishen[] = []
  for (const p of [year, month, hour]) {
    if (!p) continue
    const s = p.shishen
    if (s && (s as string) !== '日主') ganSs.push(s)
  }
  return {
    dayGan: (day?.gan ?? '') as Gan | '',
    byPillar: b.pillars.map((p) => p.shishen),
    hideByPillar: b.pillars.map((p) => p.hideShishen),
    ganSs,
    mainZhiArr: b.pillars.map((p) => (p.hideShishen[0] ?? '') as string),
    allZhiArr: b.pillars.flatMap((p) => p.hideShishen),
  }
}

export const useShishen = create<ShishenStore>()((set, get) => ({
  ...deriveShishen(useBazi.getState()),
  tou: (s) => get().ganSs.includes(s),
  touCat: (c) => get().ganSs.some((s) => SHI_SHEN_CAT[s] === c),
  zang: (s) => get().allZhiArr.includes(s),
  has: (s) => get().tou(s) || get().zang(s),
  hasCat: (c) => get().touCat(c) || get().allZhiArr.some((s) => SHI_SHEN_CAT[s] === c),
  mainAt: (s) => {
    const out: number[] = []
    get().mainZhiArr.forEach((x, i) => { if (x === s) out.push(i) })
    return out
  },
  strong: (s) => get().tou(s) || get().mainAt(s).length > 0,
  strongCat: (c) => {
    const main = useBazi.getState().mainArr
    return main.some((p, i) => {
      if (i !== 2 && SHI_SHEN_CAT[p.shishen as string] === c) return true
      const h = p.hideShishen[0]
      return !!h && SHI_SHEN_CAT[h] === c
    })
  },
  countOf: (s) => {
    const { ganSs, allZhiArr } = get()
    let n = 0
    for (const g of ganSs) if (g === s) n++
    for (const z of allZhiArr) if (z === s) n++
    return n
  },
  countCat: (c) => {
    const { ganSs, allZhiArr } = get()
    let n = 0
    for (const g of ganSs) if (SHI_SHEN_CAT[g] === c) n++
    for (const z of allZhiArr) if (SHI_SHEN_CAT[z] === c) n++
    return n
  },
  adjacentTou: (s1, s2) => {
    const main = useBazi.getState().mainArr
    const posOf = (s: Shishen) => {
      const out: number[] = []
      if (main[0]?.shishen === s) out.push(0)
      if (main[1]?.shishen === s) out.push(1)
      if (main[3]?.shishen === s) out.push(3)
      return out
    }
    const p1 = posOf(s1)
    const p2 = posOf(s2)
    for (const a of p1) for (const b of p2) if (Math.abs(a - b) === 1) return true
    return false
  },
}))

useBazi.subscribe((s, prev) => {
  if (s.pillars === prev.pillars) return
  useShishen.setState(deriveShishen(s))
})

interface ShenshaStore {
  byPillar: string[][]
}

function deriveShensha(b: BaziResult): ShenshaStore {
  return { byPillar: b.pillars.map((p) => p.shensha) }
}

export const useShensha = create<ShenshaStore>()(() => deriveShensha(useBazi.getState()))

useBazi.subscribe((s, prev) => {
  if (s.pillars === prev.pillars) return
  useShensha.setState(deriveShensha(s))
})
