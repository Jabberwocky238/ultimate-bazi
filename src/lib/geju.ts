/**
 * 格局识别器。**全部采用定性判断**：
 * - 透 (某十神/五行出现在天干)
 * - 藏 (出现在地支藏干)
 * - 通根 (天干十神在地支找到根气)
 * - 得令 (月令主气生扶日主)
 * - 得地 (日支主气生扶日主)
 * - 得势 (多位支持)
 *
 * 所有阈值都是**位置数**（0-4 个柱），不做权重累加或回归比值。
 *
 * 每个 isXxx(ctx) 返回 GejuDraft | null。判定标准来自
 * public/bazi-skills/core/格局/<name>.md 的「成立条件」章节。
 */

import {
  LU,
  YANG_REN,
  WU_XING,
  TRIAD_MAP,
  triadOf,
  type Gan,
  type Zhi,
} from '@jabberwocky238/bazi-engine'
import type { Pillar } from './store'
import { ganWuxing } from './wuxing'
import { analyzeStrength, type StrengthLevel } from './strength'

export type GejuQuality = 'good' | 'bad' | 'neutral'
export type GejuCategory = '从格' | '十神格' | '五行格' | '专旺格' | '特殊格' | '正格'

export interface GejuHit {
  name: string
  note: string
  quality: GejuQuality
  category: GejuCategory
}

type GejuDraft = Pick<GejuHit, 'name' | 'note'>

const META: Record<string, { quality: GejuQuality; category: GejuCategory }> = {
  // 特殊格
  魁罡格: { quality: 'good', category: '特殊格' },
  三奇格: { quality: 'good', category: '特殊格' },
  三庚格: { quality: 'good', category: '特殊格' },
  化气格: { quality: 'good', category: '特殊格' },
  日德格: { quality: 'good', category: '特殊格' },
  日贵格: { quality: 'good', category: '特殊格' },
  // 特殊/复合格局
  两气成象: { quality: 'neutral', category: '特殊格' },
  五行齐全: { quality: 'neutral', category: '特殊格' },
  天元一气: { quality: 'good', category: '特殊格' },
  帝王命造: { quality: 'good', category: '特殊格' },
  壬骑龙背: { quality: 'good', category: '特殊格' },
  禄马同乡: { quality: 'good', category: '特殊格' },
  日照江河: { quality: 'good', category: '特殊格' },
  寒木向阳: { quality: 'good', category: '特殊格' },

  // 正格 (月令单一十神成格，纯粹)
  建禄格: { quality: 'good', category: '正格' },
  阳刃格: { quality: 'neutral', category: '正格' },
  七杀格: { quality: 'good', category: '正格' },
  食神格: { quality: 'good', category: '正格' },
  伤官格: { quality: 'good', category: '正格' },
  正财格: { quality: 'good', category: '正格' },
  偏财格: { quality: 'good', category: '正格' },
  正印格: { quality: 'good', category: '正格' },
  偏印格: { quality: 'good', category: '正格' },
  正官格: { quality: 'good', category: '正格' },

  // 十神格 (吉)
  官印相生: { quality: 'good', category: '十神格' },
  杀印相生: { quality: 'good', category: '十神格' },
  食神制杀: { quality: 'good', category: '十神格' },
  伤官合杀: { quality: 'good', category: '十神格' },
  伤官生财: { quality: 'good', category: '十神格' },
  伤官佩印: { quality: 'good', category: '十神格' },
  食伤泄秀: { quality: 'good', category: '十神格' },
  
  财官印全: { quality: 'good', category: '特殊格' },
  羊刃驾杀: { quality: 'neutral', category: '特殊格' },
  羊刃劫财: { quality: 'neutral', category: '特殊格' },
  身杀两停: { quality: 'neutral', category: '特殊格' },

  // 十神格 (凶/中性)
  官杀混杂: { quality: 'bad', category: '十神格' },
  食伤混杂: { quality: 'bad', category: '十神格' },
  伤官见官: { quality: 'bad', category: '十神格' },
  枭神夺食: { quality: 'bad', category: '十神格' },
  以财破印: { quality: 'bad', category: '十神格' },
  财多身弱: { quality: 'bad', category: '十神格' },
  比劫重重: { quality: 'bad', category: '十神格' },
  劫财见财: { quality: 'bad', category: '十神格' },

  // 专旺格
  曲直格: { quality: 'good', category: '专旺格' },
  炎上格: { quality: 'good', category: '专旺格' },
  稼穑格: { quality: 'good', category: '专旺格' },
  从革格: { quality: 'good', category: '专旺格' },
  润下格: { quality: 'good', category: '专旺格' },

  // 从格
  从财格: { quality: 'good', category: '从格' },
  从杀格: { quality: 'good', category: '从格' },
  从儿格: { quality: 'good', category: '从格' },
  从官格: { quality: 'good', category: '从格' },
  从旺格: { quality: 'good', category: '从格' },
  从强格: { quality: 'good', category: '从格' },
  从势格: { quality: 'good', category: '从格' },
 
  // 五行格 (吉)
  木火通明: { quality: 'good', category: '五行格' },
  水木清华: { quality: 'good', category: '五行格' },
  水火既济: { quality: 'good', category: '五行格' },
  土金毓秀: { quality: 'good', category: '五行格' },
  金火铸印: { quality: 'good', category: '五行格' },
  金白水清: { quality: 'good', category: '五行格' },
  火土夹带: { quality: 'good', category: '五行格' },
  木疏厚土: { quality: 'good', category: '五行格' },
  斧斤伐木: { quality: 'good', category: '五行格' },

  // 五行格 (凶)
  木火相煎: { quality: 'bad', category: '五行格' },
  木多火塞: { quality: 'bad', category: '五行格' },
  水火相战: { quality: 'bad', category: '五行格' },
  水多木漂: { quality: 'bad', category: '五行格' },
  水冷木寒: { quality: 'bad', category: '五行格' },
  金寒水冷: { quality: 'bad', category: '五行格' },
  火旺金衰: { quality: 'bad', category: '五行格' },
  火多金熔: { quality: 'bad', category: '五行格' },
  火炎土燥: { quality: 'bad', category: '五行格' },
  土重金埋: { quality: 'bad', category: '五行格' },
}

type ShishenCat = '比劫' | '印' | '食伤' | '财' | '官杀'

const SHI_SHEN_CAT: Record<string, ShishenCat> = {
  比肩: '比劫', 劫财: '比劫',
  正印: '印', 偏印: '印',
  食神: '食伤', 伤官: '食伤',
  正财: '财', 偏财: '财',
  正官: '官杀', 七杀: '官杀',
}

const KUIGANG_DAY = new Set(['庚辰', '庚戌', '壬辰', '戊戌'])

const WX_GENERATED_BY: Record<string, string> = { 火: '木', 土: '火', 金: '土', 水: '金', 木: '水' }
const WX_CONTROLLED_BY: Record<string, string> = { 土: '木', 水: '土', 火: '水', 金: '火', 木: '金' }
const WX_CONTROLS: Record<string, string> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' }

const SEASON_BY_ZHI: Record<string, '春' | '夏' | '秋' | '冬'> = {
  寅: '春', 卯: '春', 辰: '春',
  巳: '夏', 午: '夏', 未: '夏',
  申: '秋', 酉: '秋', 戌: '秋',
  亥: '冬', 子: '冬', 丑: '冬',
}

function yimaFrom(zhi: string): string | undefined {
  try {
    return TRIAD_MAP[triadOf(zhi as Zhi)]['驿马']
  } catch {
    return undefined
  }
}

interface Ctx {
  pillars: Pillar[]
  dayGan: Gan
  dayZhi: Zhi
  dayGz: string
  monthZhi: Zhi
  yearZhi: Zhi
  dayWx: string
  season: '春' | '夏' | '秋' | '冬' | ''
  /** 日主阳干 (甲/丙/戊/庚/壬) */
  dayYang: boolean

  // —— 十神定性查询 ——
  tou(s: string): boolean
  touCat(c: ShishenCat): boolean
  zang(s: string): boolean
  has(s: string): boolean
  hasCat(c: ShishenCat): boolean
  mainAt(s: string): number[]
  strong(s: string): boolean
  strongCat(c: ShishenCat): boolean

  // —— 数量统计 (干位 + 所有藏干位) ——
  /** 某十神总位数 (年月时干 + 四柱所有藏干) */
  countOf(s: string): number
  /** 某类别总位数 */
  countCat(c: ShishenCat): number

  // —— 五行定性查询 (按"柱数"计数) ——
  ganWxCount(wx: string): number
  zhiMainWxCount(wx: string): number
  touWx(wx: string): boolean
  rootWx(wx: string): boolean
  /** 本气 或 中气 含此五行 (如寅中丙、戌中丁算火根)。 */
  rootExt(wx: string): boolean

  // —— 日主强弱 —— 全部来自 strength.ts 的 analyzeStrength 结果
  /** 身强弱九级：身极旺/身旺/身中强/身中(偏强)/身中(偏弱)/身略弱/身弱/身极弱/近从弱 */
  level: StrengthLevel | ''
  deLing: boolean
  deDi: boolean
  deShi: boolean
  shenWang: boolean
  shenRuo: boolean

  // —— 位置关系 ——
  adjacentTou(s1: string, s2: string): boolean

  // —— 月令类别 ——
  monthCat: ShishenCat | ''

  /** 月支是否被其他支冲（六冲） */
  monthZhiBeingChong: boolean
}

function buildCtx(pillars: Pillar[]): Ctx {
  const [yearP, monthP, dayP, hourP] = pillars
  const dayGan = dayP.gan as Gan
  const dayWx = WU_XING[dayGan] ?? ganWuxing(dayGan)
  const season = SEASON_BY_ZHI[monthP.zhi as string] ?? ''

  // 年/月/时干十神 (排除日干)
  const ganSs = [yearP.shishen, monthP.shishen, hourP.shishen].filter(
    (s) => s && s !== '日主',
  )
  const ganSet = new Set(ganSs)

  // 四柱地支主气十神 (含日支)
  const mainZhi = pillars.map((p) => p.hideShishen[0] ?? '')
  // 所有藏干十神
  const allZhi = pillars.flatMap((p) => p.hideShishen)

  const monthCat = (SHI_SHEN_CAT[mainZhi[1]] ?? '') as ShishenCat | ''

  // —— 日主强弱 —— 统一用 strength.ts 的 analyzeStrength 结果，不在本处再算
  const strength = analyzeStrength(pillars)
  const level: StrengthLevel | '' = strength?.level ?? ''
  const deLing = strength?.deLing ?? false
  // 得地：日支 (正根) 为本气/中气/余气任一
  const deDi = strength ? strength.roots[2].kind !== 'none' : false
  // 得势：天干同党贡献 > 0 (strength 层的天干得生/得助分小计)
  const deShi = strength ? strength.ganPoints > 0 : false
  const strongLv = new Set<StrengthLevel>(['身极旺', '身旺', '身中强', '身中(偏强)'])
  const weakLv = new Set<StrengthLevel>(['身略弱', '身弱', '身极弱', '近从弱', '身中(偏弱)'])
  const shenWang = level ? strongLv.has(level) : false
  const shenRuo = level ? weakLv.has(level) : false

  // —— 查询 helpers ——
  const tou = (s: string) => ganSet.has(s)
  const touCat = (c: ShishenCat) => ganSs.some((s) => SHI_SHEN_CAT[s] === c)
  const zang = (s: string) => allZhi.includes(s)
  const has = (s: string) => ganSet.has(s) || allZhi.includes(s)
  const hasCat = (c: ShishenCat) =>
    ganSs.some((s) => SHI_SHEN_CAT[s] === c) ||
    allZhi.some((s) => SHI_SHEN_CAT[s] === c)
  const mainAt = (s: string) => {
    const out: number[] = []
    mainZhi.forEach((x, i) => {
      if (x === s) out.push(i)
    })
    return out
  }
  const strong = (s: string) => tou(s) || mainAt(s).length > 0
  const strongCat = (c: ShishenCat) =>
    pillars.some((p, i) => {
      if (i !== 2 && SHI_SHEN_CAT[p.shishen] === c) return true
      return SHI_SHEN_CAT[p.hideShishen[0] ?? ''] === c
    })

  // 数量统计：天干 3 位 + 四柱所有藏干
  const countOf = (s: string) => {
    let n = 0
    for (const g of ganSs) if (g === s) n++
    for (const z of allZhi) if (z === s) n++
    return n
  }
  const countCat = (c: ShishenCat) => {
    let n = 0
    for (const g of ganSs) if (SHI_SHEN_CAT[g] === c) n++
    for (const z of allZhi) if (SHI_SHEN_CAT[z] === c) n++
    return n
  }

  const ganWxCount = (wx: string) =>
    pillars.filter((p) => ganWuxing(p.gan) === wx).length
  const zhiMainWxCount = (wx: string) =>
    pillars.filter((p) => {
      const g = p.hideGans[0]
      return g && ganWuxing(g) === wx
    }).length
  const touWx = (wx: string) =>
    pillars.some((p, i) => i !== 2 && ganWuxing(p.gan) === wx)
  const rootWx = (wx: string) => zhiMainWxCount(wx) > 0
  /** 扩展根：本气 **或** 中气含此五行（如寅中丙、戌中丁算火根）。 */
  const rootExt = (wx: string) =>
    pillars.some((p) => {
      const b = p.hideGans[0]
      const m = p.hideGans[1]
      return (b && ganWuxing(b) === wx) || (m && ganWuxing(m) === wx)
    })

  // 天干位置 (0=年 1=月 3=时) — 不含日柱
  const ganPosOf = (s: string): number[] => {
    const out: number[] = []
    if (pillars[0].shishen === s) out.push(0)
    if (pillars[1].shishen === s) out.push(1)
    if (pillars[3].shishen === s) out.push(3)
    return out
  }
  const adjacentTou = (s1: string, s2: string) => {
    const p1 = ganPosOf(s1)
    const p2 = ganPosOf(s2)
    for (const a of p1) for (const b of p2) if (Math.abs(a - b) === 1) return true
    // 日柱位2, 若 s1或s2 落在邻柱, 考虑与日柱邻接
    return false
  }

  const dayYang = ['甲', '丙', '戊', '庚', '壬'].includes(dayGan)

  // 六冲表（月支视角，只取冲对手的对支）
  const CHONG_PAIR: Record<string, string> = {
    子: '午', 午: '子', 卯: '酉', 酉: '卯',
    寅: '申', 申: '寅', 巳: '亥', 亥: '巳',
    辰: '戌', 戌: '辰', 丑: '未', 未: '丑',
  }
  const mzChong = CHONG_PAIR[monthP.zhi as string]
  const monthZhiBeingChong = mzChong
    ? [yearP.zhi, dayP.zhi, hourP.zhi].includes(mzChong)
    : false

  return {
    pillars,
    dayGan,
    dayZhi: dayP.zhi as Zhi,
    dayGz: dayP.gz,
    monthZhi: monthP.zhi as Zhi,
    yearZhi: yearP.zhi as Zhi,
    dayWx,
    season,
    dayYang,
    level,
    tou, touCat, zang, has, hasCat, mainAt, strong, strongCat,
    countOf, countCat,
    ganWxCount, zhiMainWxCount, touWx, rootWx, rootExt,
    deLing, deDi, deShi, shenWang, shenRuo,
    adjacentTou,
    monthCat,
    monthZhiBeingChong,
  }
}

// ——————————————————————— 正格 ———————————————————————

/**
 * 建禄格：月支本气为日主之禄 + 原局有官/财/食伤作为泄克出口 + **月支不被冲**。
 * 依《子平真诠》："禄格用官，干头透出为奇；其次财生官，其次伤官佩印……
 *   日元既旺，则宜泄宜克"。无泄克出口者只是"空身强"，不入贵格。
 * md 明文："月支不被冲、不被合化为他五行；六冲忌讳"。
 */
export function isJianLuGe(ctx: Ctx): GejuDraft | null {
  if (ctx.monthZhi !== LU[ctx.dayGan]) return null
  if (ctx.monthZhiBeingChong) return null           // 月支被冲 → 破
  const hasOutlet =
    ctx.touCat('官杀') || ctx.touCat('财') || ctx.touCat('食伤')
  if (!hasOutlet) return null
  return {
    name: '建禄格',
    note: `月令 ${ctx.monthZhi} 临日主 ${ctx.dayGan} 之禄，带官杀/财/食伤为用`,
  }
}

/**
 * 通用"月令X格"工厂：
 *   - 月令主气为 target 十神 OR (target 透干 + 月令地支藏 target)
 *   - 返回基础成立的草稿；具体格局的额外条件由调用方再判。
 */
function monthGeFormed(ctx: Ctx, target: string): boolean {
  const monthMain = ctx.pillars[1].hideShishen[0] ?? ''
  if (monthMain === target) return true
  const monthHide = ctx.pillars[1].hideShishen.includes(target)
  return ctx.tou(target) && monthHide
}

/**
 * 正官格（依《子平真诠·论正官》5 条）：
 *  1. 月令正官 OR 透 + 月令藏 ✓
 *  2. 不混七杀 ✓
 *  3. 无伤官紧贴 ✓
 *  4. 日主身中偏强 (非身弱)
 *  5. 正官通根 (非虚透)
 */
export function isZhengGuanGe(ctx: Ctx): GejuDraft | null {
  if (!monthGeFormed(ctx, '正官')) return null
  if (!ctx.tou('正官')) return null
  if (!ctx.zang('正官')) return null                 // 条件 5：通根
  if (ctx.tou('七杀')) return null                    // 条件 2：不混
  if (ctx.tou('伤官')) return null                    // 条件 3：无伤
  if (ctx.shenRuo) return null                        // 条件 4：身非弱
  return { name: '正官格', note: '月令正官透根，不混杀无伤，身可任' }
}

/**
 * 七杀格（依《子平真诠·论七杀》5 条）：
 *  1. 月令七杀 OR 透 + 月令藏 ✓
 *  2. 不混正官 ✓
 *  3. 有食神制 OR 印化 ✓
 *  4. 日主有根 (非极弱)
 *  5. 制化之神通根 (食神或印透且有根)
 */
export function isQiShaGe(ctx: Ctx): GejuDraft | null {
  if (!monthGeFormed(ctx, '七杀')) return null
  if (ctx.tou('正官')) return null                        // 不混官
  const foodRooted = ctx.tou('食神') && ctx.zang('食神')  // 食神透通根
  const yinRooted = ctx.touCat('印') && (ctx.zang('正印') || ctx.zang('偏印'))
  if (!foodRooted && !yinRooted) return null              // 制化有根
  if (ctx.shenRuo) return null                            // md: 身中至身强
  return {
    name: '七杀格',
    note: `月令七杀 + ${foodRooted ? '食神制 (透根)' : '印化 (透根)'}`,
  }
}

/**
 * 食神格（依《子平真诠·论食神》5 条必要 + 1 条升格）：
 *  1. 月令食神 OR 透+月令藏 ✓
 *  2. 食神透干通根 ✓
 *  3. 日主有根不极弱 ✓
 *  4. **无偏印紧贴夺食 OR 有财护食** (md 允许偏印不紧贴)
 *  5. 不混伤官 ✓
 */
export function isShiShenGe(ctx: Ctx): GejuDraft | null {
  if (!monthGeFormed(ctx, '食神')) return null
  if (!ctx.tou('食神')) return null
  if (!ctx.zang('食神')) return null
  if (ctx.tou('伤官')) return null                          // 不混伤
  if (ctx.shenRuo) return null                               // md: 身中至身强
  // 偏印紧贴夺食 (月/日邻位 或 日/时邻位) 且无财护 → 破
  const xiaoDuoShi =
    ctx.tou('偏印') &&
    ctx.adjacentTou('偏印', '食神') &&
    !ctx.touCat('财')
  if (xiaoDuoShi) return null
  return { name: '食神格', note: '月令食神透根，不混伤，无枭夺食' }
}

/**
 * 伤官格：月令伤官 + 伤官透根 + 无正官 + 不混食神 + 身非极弱(伤泄身)。
 * 《子平真诠》"伤官见官为祸"；"伤官须有制或有印化"。
 */
export function isShangGuanGe(ctx: Ctx): GejuDraft | null {
  if (!monthGeFormed(ctx, '伤官')) return null
  if (!ctx.tou('伤官')) return null
  if (!ctx.zang('伤官')) return null
  if (ctx.tou('正官')) return null
  if (ctx.tou('食神')) return null                   // 不混食
  if (ctx.shenRuo) return null                        // md: 身中至身强
  return { name: '伤官格', note: '月令伤官透根，无官可见，不混食' }
}

/**
 * 正财格（依《子平真诠·论正财/论财》）：
 *  1. 月令正财 OR 透+月令藏 ✓
 *  2. 正财透干通根 ✓
 *  3. 日主身强能任财 (非身弱) ✓
 *  4. **无比劫紧贴夺财**；若有比劫，须**官杀制之**。
 */
export function isZhengCaiGe(ctx: Ctx): GejuDraft | null {
  if (!monthGeFormed(ctx, '正财')) return null
  if (!ctx.tou('正财')) return null
  if (!ctx.zang('正财')) return null
  if (ctx.shenRuo) return null
  // 比劫透干 + 无官杀制 → 夺财破
  if ((ctx.tou('劫财') || ctx.tou('比肩')) && !ctx.touCat('官杀')) return null
  return { name: '正财格', note: '月令正财透根，身可任，比劫有官杀制' }
}

/**
 * 偏财格（同正财，且偏财更忌比劫）：
 *  1. 月令偏财 OR 透+月令藏 ✓
 *  2. 偏财透干通根 ✓
 *  3. 日主身强 ✓
 *  4. **无比劫紧贴夺财**；若有比劫，须**食伤通关 或 官杀制之**。
 */
export function isPianCaiGe(ctx: Ctx): GejuDraft | null {
  if (!monthGeFormed(ctx, '偏财')) return null
  if (!ctx.tou('偏财')) return null
  if (!ctx.zang('偏财')) return null
  if (ctx.shenRuo) return null
  const hasBiJie = ctx.tou('劫财') || ctx.tou('比肩')
  if (hasBiJie && !ctx.touCat('食伤') && !ctx.touCat('官杀')) return null
  return { name: '偏财格', note: '月令偏财透根，身可任，比劫有食伤/官杀化' }
}

/**
 * 正印格（依《子平真诠·论印绶》）：
 *  1. 月令正印 OR 透+月令藏 ✓
 *  2. 正印透干通根 ✓
 *  3. **无财星紧贴破印**；若有财，须**比劫隔之** (正偏财均破印)
 *  4. 日主身弱或身中 (忌身强，印反闷气机)
 */
export function isZhengYinGe(ctx: Ctx): GejuDraft | null {
  if (!monthGeFormed(ctx, '正印')) return null
  if (!ctx.tou('正印')) return null
  if (!ctx.zang('正印')) return null
  // 财透 + 无比劫护印 → 破
  if (ctx.touCat('财') && !ctx.touCat('比劫')) return null
  // md: 身中至身强；身极旺则印多余 (非 md 涵盖范围)
  if (ctx.level === '身极旺') return null
  return { name: '正印格', note: '月令正印透根，无财紧贴破印' }
}

/**
 * 偏印格（依《子平真诠·论偏印》5 条）：
 *  1. 月令偏印 OR 透+月令藏 ✓
 *  2. 偏印透干通根 ✓
 *  3. **无食神紧贴被克**；若有食神紧贴须**财护食**
 *  4. 日主不过强
 *  5. 偏印不过重 (天干 + 主气合计 ≤ 2 位)
 */
export function isPianYinGe(ctx: Ctx): GejuDraft | null {
  if (!monthGeFormed(ctx, '偏印')) return null
  if (!ctx.tou('偏印')) return null
  if (!ctx.zang('偏印')) return null
  // 食神紧贴 + 无财护 → 让位枭神夺食
  const xiao = ctx.tou('偏印') && ctx.adjacentTou('偏印', '食神') && !ctx.touCat('财')
  if (xiao) return null
  // 偏印过重 (干+主气 > 2) → 枭神过旺降格
  const ganCount = ctx.pillars.filter((p) => p.shishen === '偏印').length
  const mainCount = ctx.mainAt('偏印').length
  if (ganCount + mainCount > 2) return null
  // md: 身中至身强；身极旺则印过多反累 (非 md 涵盖范围)
  if (ctx.level === '身极旺') return null
  return { name: '偏印格', note: '月令偏印透根，量不过重，食神有护' }
}

/**
 * 阳刃格（依《子平真诠·论阳刃》5 条）：
 *  1. 日主阳干 ✓
 *  2. 月令为刃 ✓
 *  3. **必有官杀制** (透干) ✓
 *  4. **官杀通根** (非虚透)
 *  5. 若取正官制刃，**无伤官** (否则伤官见官反坏)
 */
export function isYangRenGe(ctx: Ctx): GejuDraft | null {
  if (!ctx.dayYang) return null
  if (ctx.monthZhi !== YANG_REN[ctx.dayGan]) return null
  if (ctx.monthZhiBeingChong) return null            // md: "阳刃最怕冲 · 月令不被冲"
  if (!ctx.touCat('官杀')) return null
  // 官杀通根
  const gwRooted =
    (ctx.tou('正官') && ctx.zang('正官')) ||
    (ctx.tou('七杀') && ctx.zang('七杀'))
  if (!gwRooted) return null
  // 用正官制刃时忌伤官 (伤官克官)
  if (ctx.tou('正官') && !ctx.tou('七杀') && ctx.tou('伤官')) return null
  return { name: '阳刃格', note: `月令 ${ctx.monthZhi} 阳刃，官杀透根制之` }
}

/**
 * 魁罡格：日柱为四魁罡 + 身旺 + 原局无财透紧贴日柱。
 * 《三命通会》"身强遇之转荣华，运见财官禄科尽丧"。身弱或财紧贴者破格。
 */
export function isKuiGangGe(ctx: Ctx): GejuDraft | null {
  if (!KUIGANG_DAY.has(ctx.dayGz)) return null
  if (ctx.shenRuo) return null
  // 月干/时干有财透 = 财紧贴日柱
  const adjCai =
    SHI_SHEN_CAT[ctx.pillars[1].shishen] === '财' ||
    SHI_SHEN_CAT[ctx.pillars[3].shishen] === '财'
  if (adjCai) return null
  return { name: '魁罡格', note: `日柱 ${ctx.dayGz} 魁罡，身强不犯财官` }
}

/**
 * 壬骑龙背：日柱壬辰 + 再见壬或辰（多壬多辰为贵）+ 辰不被戌冲。
 * 《三命通会》"壬骑龙背，所喜者多壬、多辰"；md 条件 2 要求其他柱再见壬或辰，
 * 仅日柱壬辰降为"一般壬坐辰"不入真格。
 */
export function isRenQiLongBei(ctx: Ctx): GejuDraft | null {
  if (ctx.dayGz !== '壬辰') return null
  // 条件 2：年/月/时 再见壬 或 再见辰
  const otherRen = [ctx.pillars[0], ctx.pillars[1], ctx.pillars[3]]
    .some((p) => p.gan === '壬')
  const otherChen = [ctx.pillars[0].zhi, ctx.pillars[1].zhi, ctx.pillars[3].zhi]
    .includes('辰')
  if (!otherRen && !otherChen) return null
  // 条件 3：辰不被戌冲
  const hasXu = ctx.pillars.some((p) => p.zhi === '戌')
  if (hasXu) return null
  return {
    name: '壬骑龙背',
    note: `日柱壬辰${otherRen ? '，再透壬' : ''}${otherChen ? '，再见辰' : ''}`,
  }
}

// ——————————————————————— 官杀 ———————————————————————

/**
 * 官杀混杂：正官与七杀同时存在，**至少一方透干**。
 *   - 显混杂 = 两者俱透干（最典型）
 *   - 隐混杂 = 一透一藏
 *   - 均藏 → md 未列为破格，本 detector 不识别
 */
export function isGuanShaHunZa(ctx: Ctx): GejuDraft | null {
  if (!ctx.has('正官') || !ctx.has('七杀')) return null
  const bothTou = ctx.tou('正官') && ctx.tou('七杀')
  const oneTou = ctx.tou('正官') || ctx.tou('七杀')
  if (!oneTou) return null
  return {
    name: '官杀混杂',
    note: bothTou ? '正官 + 七杀 天干双透 (显混杂)' : '正官 / 七杀 一透一藏 (隐混杂)',
  }
}

/**
 * 官印相生：正官 + 印 双透通根 + 位置连贯（官印紧贴）+ 无七杀透 + 无伤官透 + 无财紧贴破印。
 * md 明文："正官透干通根；印透干通根；位置连贯"；"财最忌紧贴克印"。
 */
export function isGuanYinXiangSheng(ctx: Ctx): GejuDraft | null {
  if (!ctx.tou('正官')) return null
  if (!ctx.zang('正官')) return null         // 官通根
  if (ctx.has('七杀')) return null           // md: 不混七杀 (透或藏皆破)
  if (!ctx.touCat('印')) return null
  if (!(ctx.zang('正印') || ctx.zang('偏印'))) return null   // 印通根
  if (ctx.tou('伤官')) return null
  // 官印位置连贯（紧贴）
  const adjOfficial =
    ctx.adjacentTou('正官', '正印') || ctx.adjacentTou('正官', '偏印')
  if (!adjOfficial) return null
  // 财紧贴印则破印
  if (ctx.adjacentTou('正财', '正印') || ctx.adjacentTou('正财', '偏印') ||
      ctx.adjacentTou('偏财', '正印') || ctx.adjacentTou('偏财', '偏印')) return null
  return { name: '官印相生', note: '正官印双透通根紧贴，无伤官与紧贴财破格' }
}

/**
 * 杀印相生：七杀透干或月令七杀 + 印透干。
 * 允许正官藏支（不透则不算混杂）。
 *
 * 互斥条件：**伤官合杀成立时七杀已被合去，无杀可化**。
 * 依《子平真诠·论七杀》"杀用印则不用食伤，杀用食伤则不用印"——
 * 七杀用神排他；《子平真诠·论伤官》"合杀者，取其合以去杀"——
 * 合后杀已不独立存在，不能再论相生。
 */
export function isShaYinXiangSheng(ctx: Ctx): GejuDraft | null {
  const shaPresent = ctx.tou('七杀') || ctx.monthCat === '官杀'
  if (!shaPresent) return null
  if (ctx.tou('正官')) return null
  if (!ctx.touCat('印')) return null
  if (!(ctx.zang('正印') || ctx.zang('偏印'))) return null   // md: 印通根
  // md: 杀印位置连贯 (七杀透时紧贴印)
  if (ctx.tou('七杀')) {
    const adj = ctx.adjacentTou('七杀', '正印') || ctx.adjacentTou('七杀', '偏印')
    if (!adj) return null
  }
  // md: 财最忌紧贴克印
  if (ctx.adjacentTou('正财', '正印') || ctx.adjacentTou('正财', '偏印') ||
      ctx.adjacentTou('偏财', '正印') || ctx.adjacentTou('偏财', '偏印')) return null
  // 伤官合杀互斥：阴日主 + 伤官与七杀紧贴双透 → 杀已合去，返 null
  if (!ctx.dayYang && ctx.tou('伤官') && ctx.tou('七杀') &&
      ctx.adjacentTou('伤官', '七杀')) {
    return null
  }
  return { name: '杀印相生', note: '七杀配印，紧贴化杀生身，无财紧贴破印' }
}

// ——————————————————————— 食伤 ———————————————————————

/**
 * 食神制杀（依 md "成立条件"）：
 *  1. 七杀透干通根 (md: 七杀透干通根)
 *  2. 食神透干通根 (md: 食神透干通根)
 *  3. 食神与七杀位置相邻 (md: 位置相邻)
 *  4. 无枭印紧贴克食神（除非财救，md: 枭神紧贴克食神破格 (无财救)）
 *  5. 身中至身强 (md)
 */
export function isShiShenZhiSha(ctx: Ctx): GejuDraft | null {
  if (!ctx.tou('七杀')) return null
  if (!ctx.zang('七杀')) return null                        // 杀通根
  if (!ctx.tou('食神')) return null
  if (!ctx.zang('食神')) return null                        // 食通根
  if (!ctx.adjacentTou('食神', '七杀')) return null         // 紧贴
  if (ctx.tou('偏印') && ctx.adjacentTou('偏印', '食神') && !ctx.touCat('财')) return null
  if (ctx.shenRuo) return null                               // md: 身中至身强
  return { name: '食神制杀', note: '身非弱 · 食神七杀双透根紧贴，无枭夺食' }
}

/**
 * 枭神夺食：偏印透 + 食神存在 + 无财救 + 无伤官夺命（月令伤官且伤官透干则本格为伤官佩印）。
 * 互斥：月令伤官 + 伤官透干 → 结构为伤官格，偏印作佩印用，不作枭印夺食论。
 */
export function isXiaoShenDuoShi(ctx: Ctx): GejuDraft | null {
  if (!ctx.tou('偏印')) return null
  if (!ctx.has('食神')) return null
  if (ctx.touCat('财')) return null
  // 月令伤官且伤官透干 → 本格为伤官格 + 偏印佩印，非枭神夺食
  if (ctx.mainAt('伤官').includes(1) && ctx.tou('伤官')) return null
  return { name: '枭神夺食', note: '偏印透克食神，无财救' }
}

/** 伤官见官：伤官与正官都透干 + 相邻 + 无印制(印不透)。 */
export function isShangGuanJianGuan(ctx: Ctx): GejuDraft | null {
  if (!ctx.tou('伤官') || !ctx.tou('正官')) return null
  if (!ctx.adjacentTou('伤官', '正官')) return null
  if (ctx.touCat('印')) return null
  if (ctx.touCat('财')) return null
  return { name: '伤官见官', note: '伤官正官紧贴且无救' }
}

/**
 * 伤官合杀：日主为阴干 + 伤官与七杀**都透干** + 位置紧贴 + **无争合**。
 * 《渊海子平》：五合只在天干，阳干无此结构。
 * 《滴天髓·通神论》"合之力以紧贴为真"。md 明文："无争合"——伤官或七杀再现一位即破。
 */
export function isShangGuanHeSha(ctx: Ctx): GejuDraft | null {
  if (ctx.dayYang) return null
  if (!ctx.tou('伤官') || !ctx.tou('七杀')) return null
  if (!ctx.adjacentTou('伤官', '七杀')) return null  // 紧贴才真合
  // 争合检查：伤官 或 七杀 在天干出现 > 1 位 → 争合破
  const shangN = ctx.pillars.filter((p, i) => i !== 2 && p.shishen === '伤官').length
  const shaN = ctx.pillars.filter((p, i) => i !== 2 && p.shishen === '七杀').length
  if (shangN > 1 || shaN > 1) return null
  return { name: '伤官合杀', note: `阴日主 ${ctx.dayGan} 伤官七杀紧贴双透五合，无争合` }
}

/**
 * 伤官生财：身强 + 伤官透通根 + 财通根紧贴 + 印不透(以免克伤) + 无正官紧贴。
 * md 明文："身强才能用伤官生财 —— 身弱转入伤官佩印"；"原局无正官紧贴"。
 */
export function isShangGuanShengCai(ctx: Ctx): GejuDraft | null {
  if (!ctx.tou('伤官')) return null
  if (!ctx.strongCat('财')) return null
  if (ctx.touCat('印')) return null
  if (!ctx.shenWang) return null                              // md: 必身强
  if (ctx.tou('正官') && ctx.adjacentTou('伤官', '正官')) return null  // 正官紧贴破
  return { name: '伤官生财', note: '身强 · 伤官透生财 · 无印阻无官紧贴' }
}

/**
 * 伤官佩印：伤官透干通根 + 印透干通根 + **身弱**（专为身弱用印） + 财不透破印。
 * 《子平真诠》"伤官用印，身弱有力"。身旺用财，身弱用印 —— 这里限身弱。
 */
export function isShangGuanPeiYin(ctx: Ctx): GejuDraft | null {
  if (!ctx.tou('伤官')) return null
  if (!ctx.zang('伤官')) return null                 // 伤官通根
  if (!ctx.touCat('印')) return null
  if (ctx.touCat('财')) return null                  // 财透破印
  if (ctx.shenWang) return null                      // 身旺则不用印而应用财
  return { name: '伤官佩印', note: '身弱伤官透，印透制伤化气' }
}

/** 食伤混杂：食神与伤官同时透干。 */
export function isShiShangHunZa(ctx: Ctx): GejuDraft | null {
  if (!(ctx.tou('食神') && ctx.tou('伤官'))) return null
  return { name: '食伤混杂', note: '食神伤官双透' }
}

/** 食伤泄秀：身旺 + 食伤透干 + 无偏印透(避免夺食)。 */
export function isShiShangXieXiu(ctx: Ctx): GejuDraft | null {
  if (!ctx.shenWang) return null
  if (!(ctx.tou('食神') || ctx.tou('伤官'))) return null
  if (ctx.tou('偏印')) return null
  return { name: '食伤泄秀', note: '身旺见食伤透泄秀' }
}

// ——————————————————————— 羊刃 ———————————————————————

/**
 * 羊刃驾杀：日主阳干 + 刃位见于月/日/时支 + 七杀透干通根 + **身强**。
 * 《子平真诠》"羊刃无杀不足为贵；七杀无刃不足为威"。刃杀势均方成贵格。
 * md 明文："日主必为阳干 + 身极强"；"身杀两停（力量势均）"。
 */
export function isYangRenJiaSha(ctx: Ctx): GejuDraft | null {
  if (!ctx.dayYang) return null
  const yr = YANG_REN[ctx.dayGan]
  if (!yr) return null
  const yrPos = [ctx.pillars[1].zhi, ctx.pillars[2].zhi, ctx.pillars[3].zhi].includes(yr)
  if (!yrPos) return null
  if (!ctx.tou('七杀')) return null
  if (!ctx.zang('七杀')) return null                 // md: 七杀通根
  if (!ctx.shenWang) return null                      // md: 身强方能驾杀
  return { name: '羊刃驾杀', note: `身强 · 阳刃 ${yr} 见于支 · 七杀透根` }
}

/**
 * 羊刃劫财：阳干 + 刃位见于月/日/时支 + 劫财透或通根多位。
 */
export function isYangRenJieCai(ctx: Ctx): GejuDraft | null {
  if (!ctx.dayYang) return null
  const yr = YANG_REN[ctx.dayGan]
  if (!yr) return null
  const yrPos = [ctx.pillars[1].zhi, ctx.pillars[2].zhi, ctx.pillars[3].zhi].includes(yr)
  if (!yrPos) return null
  if (!ctx.has('劫财')) return null
  return { name: '羊刃劫财', note: `阳刃 ${yr} 见于支 + 劫财并显` }
}

// ——————————————————————— 总量 ———————————————————————

/** 财官印全：财、官(杀)、印 三者皆透干。 */
export function isCaiGuanYinQuan(ctx: Ctx): GejuDraft | null {
  if (!ctx.touCat('财')) return null
  if (!ctx.touCat('官杀')) return null
  if (!ctx.touCat('印')) return null
  return { name: '财官印全', note: '财官印三者透干' }
}

/** 比劫重重：比劫透干 ≥ 2 或 地支主气比劫 ≥ 3。 */
export function isBiJieChongChong(ctx: Ctx): GejuDraft | null {
  const touN = [
    ctx.tou('比肩'), ctx.tou('劫财'),
  ].filter(Boolean).length +
    (ctx.pillars.filter((p, i) => i !== 2 && SHI_SHEN_CAT[p.shishen] === '比劫').length > 1 ? 1 : 0)
  const zhiN = ctx.pillars.filter((p) => SHI_SHEN_CAT[p.hideShishen[0] ?? ''] === '比劫').length
  if (touN < 2 && zhiN < 3) return null
  return { name: '比劫重重', note: `比劫透 ${touN} 位，地支主气 ${zhiN} 位` }
}

/** 禄马同乡：某柱地支既为日主禄又为驿马。 */
export function isLuMaTongXiang(ctx: Ctx): GejuDraft | null {
  const lu = LU[ctx.dayGan]
  const ymY = yimaFrom(ctx.yearZhi)
  const ymD = yimaFrom(ctx.dayZhi)
  for (let i = 0; i < ctx.pillars.length; i++) {
    const p = ctx.pillars[i]
    if (p.zhi === lu && (p.zhi === ymY || p.zhi === ymD)) {
      return { name: '禄马同乡', note: `${['年', '月', '日', '时'][i]}柱 ${p.zhi} 禄马同位` }
    }
  }
  return null
}

/**
 * 以财破印：印过旺成病（印≥3位）+ 财透干通根 + 日主有其他比劫/禄刃可承担。
 * 《子平真诠》"印太多而无财以制，其人多懒惰无成"——用在印盛时，不用在身弱时。
 */
export function isYiCaiPoYin(ctx: Ctx): GejuDraft | null {
  if (ctx.countCat('印') < 3) return null            // 印需成病 (≥3位)
  if (!ctx.touCat('财')) return null
  if (!ctx.zang('正财') && !ctx.zang('偏财')) return null  // 财通根
  // 身弱且无比劫支撑 → 破印反损身
  if (ctx.shenRuo && ctx.countCat('比劫') === 0) return null
  return { name: '以财破印', note: `印 ${ctx.countCat('印')} 位成病，财透破印` }
}

/** 财多身弱：身弱 + 财透干 ≥ 2 或 财在地支主气 ≥ 2。 */
export function isCaiDuoShenRuo(ctx: Ctx): GejuDraft | null {
  if (!ctx.shenRuo) return null
  const caiTou = ['正财', '偏财'].map((s) => ctx.tou(s) ? 1 : 0 as number)
  const touN = (caiTou[0] + caiTou[1])
  const zhiN = ctx.pillars.filter((p) => SHI_SHEN_CAT[p.hideShishen[0] ?? ''] === '财').length
  if (touN < 2 && zhiN < 2) return null
  return { name: '财多身弱', note: `财透 ${touN} 位，地支主气 ${zhiN} 位` }
}

// ——————————————————————— 五行象法 · 成对判定 ———————————————————————
/*
 * 五行象法按"两五行对关系"分组。每对 judge 函数返回**至多一个**名号,
 * 同一对内的不同子格天然互斥 (定性分支决定落在哪个子格)。
 */

/** 水火对 (md)：
 *  - 既济：水火五行明显 (透+有根) + 势均 + 有木通关
 *    md: 「水透干+亥子有根」「火透干+巳午有根」「两者力量势均」「有木通关」
 *    md 未将土列为通关——土只能调和非通关
 *  - 相战：水火皆显 + 势均 + 无木通关 + 无土调和
 *    md: 「无木通关」「无土调和」
 */
export function judgeShuiHuo(ctx: Ctx): GejuDraft | null {
  // md 要求"五行明显" —— 透干且有根
  const shuiShow = ctx.touWx('水') && ctx.rootWx('水')
  const huoShow = ctx.touWx('火') && ctx.rootWx('火')
  if (!shuiShow || !huoShow) return null
  // md: 势均 (双方都成势，位数相差不大)
  const shuiN = ctx.ganWxCount('水') + ctx.zhiMainWxCount('水')
  const huoN = ctx.ganWxCount('火') + ctx.zhiMainWxCount('火')
  if (Math.abs(shuiN - huoN) > 2) return null    // 悬殊非相战/既济
  const muTongGuan = ctx.touWx('木')             // md: 木通关
  if (muTongGuan) {
    return { name: '水火既济', note: '水火有根势均 · 木通关' }
  }
  const tuDiaohe = ctx.touWx('土')               // md: 土只调和非通关
  if (!tuDiaohe) {
    return { name: '水火相战', note: '水火有根势均 · 无木通关无土调和' }
  }
  return null
}

/** 木火对：
 *  - 木日主 + 火过旺 + 木无重根 + 无水救 → 木火相煎
 *  - 木日主 + 火透且火有根 + 木有根 + 无金克 + 无重水灭火 → 木火通明
 *  - 火日主 + 地支木 ≥ 3 + 火无重根 → 木多火塞
 */
export function judgeMuHuo(ctx: Ctx): GejuDraft | null {
  if (ctx.dayWx === '木') {
    const huoMany = ctx.ganWxCount('火') >= 2 || ctx.zhiMainWxCount('火') >= 2
    const muRootCount = ctx.zhiMainWxCount('木')
    const hasShui = ctx.touWx('水') || ctx.rootWx('水')
    if (huoMany && muRootCount <= 1 && !hasShui) {
      return { name: '木火相煎', note: '火过旺而木根虚，无水润' }
    }
    // 木火通明 (md 成立条件):
    //   2. 火透干 (丙/丁)
    //   3. 木有根 (寅卯本气或亥中甲——本气或中气)
    //   4. 地支见火根 (巳午本气)
    //   5. 无重金克木
    //   6. 无重水灭火 —— md "过旺"即"透+有根"，虚透不破
    // 互斥：水透且有根 → 让位水木清华
    const shuiRooted = ctx.touWx('水') && ctx.rootWx('水')
    if (
      ctx.touWx('火') &&
      ctx.rootWx('火') &&               // md 条件 4: 巳午本气火根
      ctx.rootExt('木') &&              // md 条件 3: 寅卯本气 或 亥中甲
      !ctx.touWx('金') &&               // md 条件 5
      !shuiRooted                        // md 条件 6: 水过旺 (透+有根)
    ) {
      return { name: '木火通明', note: '木生火，火透坐巳午本气根' }
    }
  }
  if (ctx.dayWx === '火') {
    // 木多火塞 (md: 木非常旺 + 火非常弱 + 无金克木疏通)
    const muMany = ctx.zhiMainWxCount('木') >= 3
    const huoWeak = !ctx.rootWx('火') || ctx.zhiMainWxCount('火') < 2   // md: 火弱
    const wuJin = !ctx.touWx('金') || ctx.ganWxCount('金') < 2         // md: 金不能过多也不能无
    if (muMany && huoWeak && wuJin) {
      return { name: '木多火塞', note: '木多压火 · 火弱无根 · 无金疏通' }
    }
  }
  return null
}

/** 土金对：
 *  - 土日主 + 金透通根 + 土有根 + 无木透 → 土金毓秀
 *    md: 「土厚有根」「金透干有根」「无重木克土」「无重火克金」
 *  - 金日主 + 地支土≥3 + 土透≥2 + 金虚 + 无木救 + 无水救 → 土重金埋
 *    md: 「金本身虚弱」「无木疏土」「无水润土」
 */
export function judgeTuJin(ctx: Ctx): GejuDraft | null {
  if (ctx.dayWx === '土') {
    if (
      ctx.touWx('金') && ctx.rootWx('金') &&   // md: 金透干有根
      ctx.rootWx('土') &&
      !ctx.touWx('木') &&
      ctx.ganWxCount('火') < 2                  // md: 无重火克金
    ) {
      return { name: '土金毓秀', note: '土厚金透通根，无木克土无重火克金' }
    }
  }
  if (ctx.dayWx === '金') {
    if (
      ctx.zhiMainWxCount('土') >= 3 &&
      ctx.ganWxCount('土') >= 2 &&
      !ctx.rootWx('金') &&                      // md: 金虚弱
      !ctx.touWx('木') &&                       // md: 无木疏土
      !ctx.touWx('水') && !ctx.rootWx('水')     // md: 无水润土
    ) {
      return { name: '土重金埋', note: '土 ≥ 3 位压金 · 金虚无根 · 无木水救' }
    }
  }
  return null
}

/** 火金对 (日主金)：
 *  - 火过盛 + 金无根 + 无水救 + 无土通关 + 无金比劫 → 火多金熔
 *    md: 「火气极旺+金极弱」「无水救金」「无土通关」「无金比劫」
 *  - 火透 ≥ 2 + 金无根 + 无土通关 → 火旺金衰
 *    md: 「无水救金」「无土通关」
 *  - 金有根 + 火透有根但不过旺 → 金火铸印
 *    md: 「金有根」「火有根但不过旺」；理想比例金三分、火两分
 */
export function judgeHuoJin(ctx: Ctx): GejuDraft | null {
  if (ctx.dayWx !== '金') return null
  const huoHeavy = ctx.ganWxCount('火') >= 2 && ctx.zhiMainWxCount('火') >= 1
  const huoDuo = ctx.ganWxCount('火') >= 2
  const jinRoot = ctx.rootWx('金')
  const huoTou = ctx.touWx('火')
  const huoRoot = ctx.rootWx('火')
  const hasShui = ctx.touWx('水') || ctx.rootWx('水')
  const hasTu = ctx.touWx('土')            // md: 土通关
  const hasBijie = ctx.ganWxCount('金') >= 2 // md: 金比劫
  if (huoHeavy && !jinRoot && !hasShui && !hasTu && !hasBijie) {
    return { name: '火多金熔', note: '火极盛 · 金无根无水无土无比劫救' }
  }
  if (huoDuo && !jinRoot && !hasTu) {
    return { name: '火旺金衰', note: '火多透 · 金无根 · 无土通关' }
  }
  // md: 金火铸印 —— 火有根但不过旺
  const huoOver = ctx.ganWxCount('火') >= 3
  if (jinRoot && huoTou && huoRoot && !huoOver) {
    return { name: '金火铸印', note: '金有根 · 火透坐根不过旺 · 得火锻炼' }
  }
  return null
}

/** 火土对：
 *  - 火土皆透 + 有根 + 有水调湿 → 火土夹带 (吉)
 *  - 火过旺 + 土随火烤 + 无水 → 火炎土燥 (凶)
 */
export function judgeHuoTu(ctx: Ctx): GejuDraft | null {
  const huoTou = ctx.touWx('火')
  const tuTou = ctx.touWx('土')
  if (!huoTou || !tuTou) return null
  const huoHeavy = ctx.ganWxCount('火') >= 2 || ctx.zhiMainWxCount('火') >= 2
  const hasShui = ctx.touWx('水') || ctx.rootWx('水')
  if (huoHeavy && !hasShui) {
    return { name: '火炎土燥', note: '火旺透土而无水润' }
  }
  if (ctx.rootWx('火') && ctx.rootWx('土') && hasShui) {
    return { name: '火土夹带', note: '火土相连有根且水润' }
  }
  return null
}

/** 水木对 (日主水或木)：
 *  - 木日主 + 水极盛 + 木无根 → 水多木漂 (凶)
 *  - 木日主 + 冬月 + 水多 + 无火 → 水冷木寒 (凶)
 *  - 水透 + 木透 + 无金透 + 无厚土克水 → 水木清华 (吉)
 */
export function judgeShuiMu(ctx: Ctx): GejuDraft | null {
  if (ctx.dayWx !== '水' && ctx.dayWx !== '木') return null

  if (ctx.dayWx === '木') {
    // 水多木漂 (md: 水过旺 + 木无根 + 无土制水 + 无火泄木)
    const shuiMany = ctx.ganWxCount('水') >= 2 || ctx.zhiMainWxCount('水') >= 3
    const muRootless = ctx.zhiMainWxCount('木') === 0
    const wuTu = !ctx.touWx('土')         // md: 无土制水
    const wuHuo = !ctx.touWx('火')        // md: 无火泄木
    if (shuiMany && muRootless && wuTu && wuHuo) {
      return { name: '水多木漂', note: '水盛 · 木无根 · 无土制水无火泄木' }
    }
    // 水冷木寒 (md: 冬月水过旺 + 无火调候 + 无土制水)
    if (
      ctx.season === '冬' &&
      (ctx.ganWxCount('水') >= 2 || ctx.zhiMainWxCount('水') >= 2) &&
      !ctx.touWx('火') &&
      !ctx.touWx('土')                    // md: 无土制水
    ) {
      return { name: '水冷木寒', note: '冬月水旺 · 无火调候 · 无土制水' }
    }
  }

  // 水木清华 (md: 水木比例合宜 + 无重金克木 + 无重土塞水)
  if (!ctx.touWx('水') || !ctx.touWx('木')) return null
  if (ctx.touWx('金')) return null
  if (ctx.zhiMainWxCount('土') >= 2) return null
  // 互斥：火透且有根 (含中气) → 让位木火通明
  if (ctx.touWx('火') && ctx.rootExt('火')) return null
  return { name: '水木清华', note: '水生木且木透，无金克无重土塞水' }
}

/**
 * 金水对：
 *  - 冬月 + 金水齐透 + 无火透 → 金寒水冷 (凶)
 *  - 金白水清 (吉，严格依《穷通宝鉴》)：
 *      ① 庚/辛日主
 *      ② 水透 + 通根 (亥子本气 或 申中壬水长生)
 *      ③ 金有根 (申酉本气)
 *      ④ 无戊己土透干 (忌浊水)
 *      ⑤ 无丙丁火透干 (忌熔金)——冬生一位可调候，此处简化为一刀切
 */
export function judgeJinShui(ctx: Ctx): GejuDraft | null {
  if (
    ctx.season === '冬' &&
    (ctx.dayWx === '金' || ctx.dayWx === '水') &&
    ctx.touWx('金') && ctx.touWx('水') &&
    !ctx.touWx('火')
  ) {
    return { name: '金寒水冷', note: '冬月金水并透，火缺调候' }
  }
  // 金白水清：金日主 + 秋/冬月 + 水透根 + 金有根 + 无土透 + 无火透
  if (ctx.dayWx !== '金') return null
  // 季节限制：md 条件 3 "月令为申酉最典型"；条件 5 "夏生必忌"。
  // 春 (木克金囚) / 夏 (火熔金) 都不合本格气候，只允许秋冬。
  if (ctx.season !== '秋' && ctx.season !== '冬') return null
  const waterTouRoot = ctx.touWx('水') && ctx.rootWx('水')
  if (!waterTouRoot) return null
  if (!ctx.rootWx('金')) return null
  if (ctx.touWx('土')) return null
  if (ctx.touWx('火')) return null
  const monthIsShenYou = ctx.monthZhi === '申' || ctx.monthZhi === '酉'
  return {
    name: '金白水清',
    note: `${ctx.season}月金水并秀${monthIsShenYou ? '，月令秋金当令' : ''}`,
  }
}

/** 木土对 (日主土)：土极厚 + 木有根能疏 + 木不过旺 + 无重金克木。
 *  md: 「土极为厚实：天干戊己透出且多、地支辰戌丑未见两个以上」
 *      「木有力疏土：甲乙透干、有根能真的扎进土里」
 *      「木不过旺：理想比例 土 3 木 1-2」
 *      「无重金克木：金若过多 → 克断木」 */
export function judgeMuTu(ctx: Ctx): GejuDraft | null {
  if (ctx.dayWx !== '土') return null
  // md: 土极厚 (天干戊己透 + 地支辰戌丑未 ≥ 2)
  if (ctx.zhiMainWxCount('土') < 2) return null
  if (ctx.ganWxCount('土') < 1) return null
  // md: 木有力疏土 (透 + 有根)
  if (!ctx.touWx('木')) return null
  if (!ctx.rootExt('木')) return null                 // md: "木有根能扎进土里"
  // md: 木不过旺 (理想 1-2 位)
  if (ctx.ganWxCount('木') > 2) return null
  // md: 无重金克木
  if (ctx.ganWxCount('金') >= 2) return null
  return { name: '木疏厚土', note: '土厚 · 木透有根疏土 · 无重金克木' }
}

/** 金木对 (日主木)：木有根 + 金透有根但不过旺 → 斧斤伐木。
 *  md: 「木有强盛的本根 (日主甲乙木或月令寅卯/亥卯未合木)」
 *      「金有力但不过旺 (理想比例 木3金1-2)」
 *      「庚辛透干有根，但不至于一片金气」
 *      「无过多水生木」「无过多土生金」 */
export function judgeJinMu(ctx: Ctx): GejuDraft | null {
  if (ctx.dayWx !== '木') return null
  // md: 木有强盛本根
  if (!ctx.rootWx('木')) return null
  // md: 金有力但不过旺
  const jinGanN = ctx.ganWxCount('金')
  const jinZhiN = ctx.zhiMainWxCount('金')
  if (jinGanN === 0 && jinZhiN === 0) return null
  if (jinGanN + jinZhiN > 3) return null              // md: 金过多→金多木折 (破格)
  if (!ctx.touWx('金')) return null                   // md: 庚辛透干
  // md: 无过多水生木 (水≥2位则木不需要修)
  if (ctx.ganWxCount('水') + ctx.zhiMainWxCount('水') >= 3) return null
  // md: 无过多土生金
  if (ctx.ganWxCount('土') + ctx.zhiMainWxCount('土') >= 3) return null
  return { name: '斧斤伐木', note: '木有根 · 金透根适度 · 金木对立成象' }
}

/**
 * 寒木向阳：冬月木日主 + 木有根 + 火透 + 火不过烈 + 水不过多。
 * md: 「日主为木」「月令为冬」「木有根」「火不过烈」「水不过多」
 */
export function judgeHanMu(ctx: Ctx): GejuDraft | null {
  if (ctx.dayWx !== '木') return null
  if (ctx.season !== '冬') return null
  if (!ctx.touWx('火')) return null
  // md: 木有根 (寒木需有根才经得起冬寒)
  if (!ctx.rootExt('木')) return null
  // 火不过烈: 火透 ≤ 2
  if (ctx.ganWxCount('火') >= 3) return null
  // 水不过多: 地支水主气 < 3
  if (ctx.zhiMainWxCount('水') >= 3) return null
  return { name: '寒木向阳', note: '冬木有根 · 火透调候 · 水火适度' }
}

/**
 * 日照江河：丙日主 + 丙火有根 + 水旺流通 + 无厚土拦水。
 * md: "丙火坐地支火根"；"水气有进有出"；"无土拦水"。
 */
export function judgeRiZhao(ctx: Ctx): GejuDraft | null {
  if (ctx.dayGan !== '丙') return null
  if (!ctx.touWx('水')) return null
  // md 成立条件 2 原文："丙火坐地支火根（寅、午、巳）" —— 寅中丙为中气根
  if (!ctx.rootExt('火')) return null
  const waterStrong = ctx.zhiMainWxCount('水') >= 2 || ctx.ganWxCount('水') >= 2
  if (!waterStrong) return null
  // 无厚土塞水: 土透 ≤ 1
  if (ctx.ganWxCount('土') >= 2) return null
  return { name: '日照江河', note: '丙火有根 (含寅中丙)，水旺流通' }
}

// ——————————————————————— 专旺 ———————————————————————

/**
 * 专旺共用判据 (定性)：
 * - 日主属 targetWx
 * - 月令主气为日主同类或印
 * - 地支 (同类+印) 主气 ≥ 3
 * - 无官杀透 (克星一透即破，依《渊海子平》"无 X 相克"铁律)
 * - 财透位数 ≤ maxCaiTou (默认 ∞，稼穑另传 1 位)
 *
 * 曲直/炎上/从革/润下 md 均未把财透列为破条件 — 只忌官杀。
 * 稼穑 md 条件 5 明列"水多冲土"，一位有根可容，二位以上破。
 */
/**
 * 专旺共用判据 —— 严格按 md："天干另有至少一位 X 透出"。
 * 除日主外年/月/时干再透同五行至少 1 位 (即全局本五行透 ≥ 2 位)。
 */
function checkZhuanWang(
  ctx: Ctx,
  targetWx: string,
  maxCaiTou = Infinity,
): { note: string } | null {
  if (ctx.dayWx !== targetWx) return null
  if (!ctx.deLing) return null
  const selfWx = ctx.dayWx
  const yinWx = WX_GENERATED_BY[selfWx]
  const supportZhi = ctx.zhiMainWxCount(selfWx) + ctx.zhiMainWxCount(yinWx)
  if (supportZhi < 3) return null
  if (ctx.touCat('官杀')) return null
  // md: 「天干另有至少一位甲/乙 (或相应五行) 透出」 —— 含日干本身合计 ≥ 2 位
  if (ctx.ganWxCount(targetWx) < 2) return null
  const caiTouN =
    (ctx.tou('正财') ? 1 : 0) + (ctx.tou('偏财') ? 1 : 0)
  if (caiTouN > maxCaiTou) return null
  return {
    note: `地支 ${selfWx}+${yinWx} ${supportZhi} 位 · ${selfWx} 透 ${ctx.ganWxCount(targetWx)} 位${caiTouN ? `，财透${caiTouN}` : '，无官杀'}`,
  }
}

/** 曲直格：甲乙木日主专旺。 */
export function isQuZhiGe(ctx: Ctx): GejuDraft | null {
  const r = checkZhuanWang(ctx, '木')
  return r ? { name: '曲直格', note: r.note } : null
}
/** 炎上格：丙丁火日主专旺。 */
export function isYanShangGe(ctx: Ctx): GejuDraft | null {
  const r = checkZhuanWang(ctx, '火')
  return r ? { name: '炎上格', note: r.note } : null
}
/** 稼穑格：戊己土日主专旺 + 月令辰戌丑未 + 财透 ≤ 1 (水不多冲土)。 */
export function isJiaSeGe(ctx: Ctx): GejuDraft | null {
  if (ctx.dayWx !== '土') return null
  if (!['辰', '戌', '丑', '未'].includes(ctx.monthZhi)) return null
  const r = checkZhuanWang(ctx, '土', 1)
  return r ? { name: '稼穑格', note: `月令 ${ctx.monthZhi} ; ${r.note}` } : null
}
/** 从革格：庚辛金日主专旺。 */
export function isCongGeGe(ctx: Ctx): GejuDraft | null {
  const r = checkZhuanWang(ctx, '金')
  return r ? { name: '从革格', note: r.note } : null
}
/** 润下格：壬癸水日主专旺。 */
export function isRunXiaGe(ctx: Ctx): GejuDraft | null {
  const r = checkZhuanWang(ctx, '水')
  return r ? { name: '润下格', note: r.note } : null
}

// ——————————————————————— 从格 ———————————————————————

/**
 * 从X 共用判据（依《滴天髓》"若有一毫印绶，即不为从"）：
 * - 日主**无任何比劫 / 印根**（天干无比印透，四柱藏干无比印）
 * - 月令为目标类别 OR 目标在地支主气 ≥ 3
 * - 目标类别透干
 */
function checkCong(ctx: Ctx, target: ShishenCat, targetWx: string): { note: string } | null {
  if (ctx.countCat('比劫') > 0) return null
  if (ctx.countCat('印') > 0) return null
  if (!ctx.touCat(target)) return null
  const monthIs = ctx.monthCat === target
  const zhiSupport = ctx.zhiMainWxCount(targetWx)
  if (!monthIs && zhiSupport < 3) return null
  return {
    note: `日主无根 (0 比劫印)，${monthIs ? `月令${target}` : `地支 ${targetWx} ${zhiSupport} 位`}`,
  }
}

/** 从财格 —— md：「财星数量 ≥ 食伤」「财星数量 > 官杀」。 */
export function isCongCaiGe(ctx: Ctx): GejuDraft | null {
  const caiWx = WX_CONTROLS[ctx.dayWx]
  const r = checkCong(ctx, '财', caiWx)
  if (!r) return null
  // md: 财 ≥ 食伤 且 财 > 官杀
  if (ctx.countCat('财') < ctx.countCat('食伤')) return null
  if (ctx.countCat('财') <= ctx.countCat('官杀')) return null
  return { name: '从财格', note: r.note }
}

/** 从杀格 —— md：「官杀数量 ≥ 财星」「官杀数量 > 食伤」+ 「无食伤克官杀」。 */
export function isCongShaGe(ctx: Ctx): GejuDraft | null {
  const ksWx = WX_CONTROLLED_BY[ctx.dayWx]
  const r = checkCong(ctx, '官杀', ksWx)
  if (!r) return null
  // md: 官杀 ≥ 财 且 官杀 > 食伤
  if (ctx.countCat('官杀') < ctx.countCat('财')) return null
  if (ctx.countCat('官杀') <= ctx.countCat('食伤')) return null
  // md: 无食伤克官杀
  if (ctx.touCat('食伤')) return null
  return { name: '从杀格', note: r.note }
}

/**
 * 从儿格：日主无根 + 食伤成势 + 无印 + 无官杀 + 无比劫帮身。
 * 《滴天髓·从儿》"从儿不管身强弱，只要吾儿又遇儿"；"从儿最忌官杀，次忌印绶"。
 */
export function isCongErGe(ctx: Ctx): GejuDraft | null {
  if (ctx.countCat('比劫') > 0) return null
  if (ctx.countCat('印') > 0) return null
  if (ctx.countCat('官杀') > 0) return null
  if (!ctx.touCat('食伤')) return null
  const ssWx = WX_GENERATED_BY[ctx.dayWx] // 我生之五行
  // 需要食伤成势：月令食伤 或 地支食伤主气 ≥ 3
  const monthIs = ctx.monthCat === '食伤'
  const zhiN = ctx.zhiMainWxCount(ssWx)
  if (!monthIs && zhiN < 3) return null
  return {
    name: '从儿格',
    note: `无比劫印官，食伤成势 (${monthIs ? '月令食伤' : `地支 ${ssWx} ${zhiN} 位`})`,
  }
}

/**
 * 从官格：身无根 + 正官成势 + 无印化官 + 无食伤克官 + 无七杀混杂。
 * 《滴天髓·从象》；《子平真诠》"正官须清纯不杂七杀"。
 */
export function isCongGuanGe(ctx: Ctx): GejuDraft | null {
  if (ctx.countCat('比劫') > 0) return null
  if (ctx.countCat('印') > 0) return null
  if (ctx.countCat('食伤') > 0) return null
  if (!ctx.tou('正官')) return null
  if (ctx.tou('七杀')) return null   // 不混杂
  // 正官通根
  const gwWx = WX_CONTROLLED_BY[ctx.dayWx]
  if (ctx.zhiMainWxCount(gwWx) < 2) return null
  return { name: '从官格', note: `无比印食伤，正官纯清且通根 (${gwWx} ≥ 2 位)` }
}

/**
 * 从旺格：比劫+印主导全局 + 无官杀 + 无财破印 (若有食伤仅微泄)。
 * 《滴天髓·从旺》"四柱皆比劫，无官杀制，有印生之"。
 */
export function isCongWangGe(ctx: Ctx): GejuDraft | null {
  // 月令必须 比劫或印
  if (!ctx.deLing) return null
  // 比劫 + 印 位数占大半 (≥ 5)
  const support = ctx.countCat('比劫') + ctx.countCat('印')
  if (support < 5) return null
  // 无官杀
  if (ctx.countCat('官杀') > 0) return null
  // 财若透，需不紧贴印 (简化：财透位数 ≤ 1 且未克印)
  if (ctx.touCat('财')) {
    // 财透即紧贴风险：保守拒绝
    return null
  }
  return {
    name: '从旺格',
    note: `比印合 ${support} 位主导，无官杀无财破`,
  }
}

/**
 * 从势格 (原弃命从势)：日主无任何比劫/印根 + 食伤、财、官杀中至少两类并强透干。
 * 《滴天髓·从象》任铁樵注："日主孤立无根，四柱财官食伤势均力敌"。
 */
export function isCongShiGe(ctx: Ctx): GejuDraft | null {
  if (ctx.countCat('比劫') > 0) return null
  if (ctx.countCat('印') > 0) return null
  // md: 「月支可以是食伤/财/官杀中的任何一个」「月令若为印比立即破格」
  if (ctx.monthCat === '比劫' || ctx.monthCat === '印') return null
  const strongCats = (['食伤', '财', '官杀'] as ShishenCat[]).filter(
    (c) => ctx.touCat(c) && ctx.countCat(c) >= 2,
  )
  if (strongCats.length < 2) return null
  return { name: '从势格', note: `无根 · 月令非印比 · ${strongCats.join(' ')} 并强` }
}

// ——————————————————————— 从强格（与从旺格分离）———————————————————————

/**
 * 从强格 (md)：印星力量 > 比劫 + 月令为印或比劫 + 全局皆印比 + 无食伤财官杀。
 * md 明文：「四柱印绶重重，比劫叠叠」「印星力量 > 比劫」
 *        「没有食伤财星官杀任何一党」。
 * 与从旺格差异：从旺格 比劫 ≥ 印，从强格 印 > 比劫。
 */
export function isCongQiangGe(ctx: Ctx): GejuDraft | null {
  if (!ctx.deLing) return null                          // md: 月令为印或比劫
  const yinN = ctx.countCat('印')
  const biN = ctx.countCat('比劫')
  if (yinN <= biN) return null                          // md: 印 > 比劫 (与从旺差异)
  if (yinN + biN < 5) return null                       // md: 印比叠叠
  // md: 无食伤、财星、官杀
  if (ctx.countCat('食伤') > 0) return null
  if (ctx.countCat('财') > 0) return null
  if (ctx.countCat('官杀') > 0) return null
  return { name: '从强格', note: `印 ${yinN} > 比劫 ${biN} 主导，全局皆印比` }
}

// ——————————————————————— 特殊格局 ———————————————————————

/**
 * 三奇格 —— md：天干四位中同时含某一组三奇 (乙丙丁 / 甲戊庚 / 壬癸辛) 全部；
 *   「顺排」: 三奇按 年月日时 顺序出现；「中间字必须在中间位」。
 */
const SAN_QI: Array<[string, string, string]> = [
  ['乙', '丙', '丁'],
  ['甲', '戊', '庚'],
  ['壬', '癸', '辛'],
]
export function isSanQiGe(ctx: Ctx): GejuDraft | null {
  const gans = ctx.pillars.map((p) => p.gan)
  for (const trio of SAN_QI) {
    const positions = trio.map((g) => gans.indexOf(g))
    if (positions.some((p) => p < 0)) continue
    // md: 顺排 —— positions 递增
    const sorted = [...positions].sort((a, b) => a - b)
    if (positions.join() !== sorted.join()) return null  // 中间字错位 → 破
    return { name: '三奇格', note: `天干顺排 ${trio.join('')} 三奇` }
  }
  return null
}

/**
 * 三庚格 —— md：「天干四位中至少三位为庚金」+ 「庚金为日主喜用」。
 *   庚金为用 = 日主为甲乙木 (庚为官杀 需有根以任官) 或 丙丁火 (庚为财)；
 *   日主为庚辛金 (庚为比劫) → md 明文: 「庚金为忌神 → 破格」。
 */
export function isSanGengGe(ctx: Ctx): GejuDraft | null {
  const gengN = ctx.pillars.filter((p) => p.gan === '庚').length
  if (gengN < 3) return null
  if (ctx.dayWx === '金') return null                    // md: 庚为比劫→破
  // 甲乙日主: 庚为官杀，md 要求"甲乙木须有根以任官杀"
  if (ctx.dayWx === '木' && ctx.shenRuo) return null
  return { name: '三庚格', note: `天干庚 ${gengN} 位 · 日主${ctx.dayGan}为用` }
}

/**
 * 两气成象 —— md：「命局中只有两种五行势均力敌且相生有情」。
 * 条件：只有两种五行出现 (天干+地支主气) + 两者为相生关系 (非相克)。
 */
export function isLiangQiChengXiang(ctx: Ctx): GejuDraft | null {
  const wxSet = new Set<string>()
  for (const p of ctx.pillars) {
    const gw = ganWuxing(p.gan)
    if (gw) wxSet.add(gw)
    const zw = ctx.pillars.find((x) => x === p) && ganWuxing(p.hideGans[0] ?? '')
    if (zw) wxSet.add(zw)
  }
  if (wxSet.size !== 2) return null
  const [a, b] = [...wxSet]
  // md: 必须相生 (a 生 b 或 b 生 a)，不能相克
  const GEN: Record<string, string> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }
  if (GEN[a] !== b && GEN[b] !== a) return null
  // md: 势均 —— 两方各自天干位数相差 ≤ 2
  const aN = ctx.ganWxCount(a) + ctx.zhiMainWxCount(a)
  const bN = ctx.ganWxCount(b) + ctx.zhiMainWxCount(b)
  if (Math.abs(aN - bN) > 2) return null
  return { name: '两气成象', note: `只见 ${a}${b} 两五行且势均相生` }
}

/**
 * 五行齐全 —— md：「八字天干地支(含藏干)中木火土金水全部出现」。
 */
export function isWuXingQiQuan(ctx: Ctx): GejuDraft | null {
  const wxSet = new Set<string>()
  for (const p of ctx.pillars) {
    const gw = ganWuxing(p.gan)
    if (gw) wxSet.add(gw)
    for (const h of p.hideGans) {
      const hw = ganWuxing(h)
      if (hw) wxSet.add(hw)
    }
  }
  const WX = ['木', '火', '土', '金', '水']
  if (!WX.every((w) => wxSet.has(w))) return null
  return { name: '五行齐全', note: '木火土金水齐全' }
}

/**
 * 化气格 —— md：「日干与月干或日干与时干形成五合」
 *          「化神在月令当令或局中极旺」
 *          「化干(日主之原本五行)无根」。
 */
const HE_MAP: Record<string, { partner: string; huaWx: string }> = {
  甲: { partner: '己', huaWx: '土' }, 己: { partner: '甲', huaWx: '土' },
  乙: { partner: '庚', huaWx: '金' }, 庚: { partner: '乙', huaWx: '金' },
  丙: { partner: '辛', huaWx: '水' }, 辛: { partner: '丙', huaWx: '水' },
  丁: { partner: '壬', huaWx: '木' }, 壬: { partner: '丁', huaWx: '木' },
  戊: { partner: '癸', huaWx: '火' }, 癸: { partner: '戊', huaWx: '火' },
}
export function isHuaQiGe(ctx: Ctx): GejuDraft | null {
  const info = HE_MAP[ctx.dayGan]
  if (!info) return null
  // md: 日干与月干或时干紧贴
  const monthGan = ctx.pillars[1].gan
  const hourGan = ctx.pillars[3].gan
  if (monthGan !== info.partner && hourGan !== info.partner) return null
  // md: 化干(日主)无根 —— 日主五行在地支本气为 0
  if (ctx.rootWx(ctx.dayWx)) return null
  // md: 化神旺 —— 月令为化气五行 或 地支化气五行 ≥ 2 位
  const monthWx = ganWuxing(ctx.pillars[1].hideGans[0] ?? '')
  const huaStrong = monthWx === info.huaWx || ctx.zhiMainWxCount(info.huaWx) >= 2
  if (!huaStrong) return null
  // md: 合而见争 (日干同五行再出现) 破
  const sameN = ctx.pillars.filter((p) => p.gan === ctx.dayGan).length
  if (sameN > 1) return null
  return { name: '化气格', note: `${ctx.dayGan}${info.partner} 合化${info.huaWx} · 化干无根 · 化神旺` }
}

/** 天元一气 —— md：「年月日时四柱之干同为一字」。 */
export function isTianYuanYiQi(ctx: Ctx): GejuDraft | null {
  const g = ctx.pillars[0].gan
  if (!g) return null
  if (!ctx.pillars.every((p) => p.gan === g)) return null
  return { name: '天元一气', note: `四柱天干同为 ${g}` }
}

/**
 * 日德格 —— md：「日柱为五日德之一：甲寅/丙辰/戊辰/庚辰/壬戌」
 *          + 「叠见：除日柱外另见一位」+ 「日支不被冲」。
 */
const RI_DE = new Set(['甲寅', '丙辰', '戊辰', '庚辰', '壬戌'])
export function isRiDeGe(ctx: Ctx): GejuDraft | null {
  if (!RI_DE.has(ctx.dayGz)) return null
  // md: 叠见 —— 年/月/时柱至少再出现一位同日德
  const others = [ctx.pillars[0].gz, ctx.pillars[1].gz, ctx.pillars[3].gz]
  if (!others.some((gz) => RI_DE.has(gz))) return null
  // md: 日支不被年/月/时支冲
  const CHONG_PAIR: Record<string, string> = {
    子: '午', 午: '子', 卯: '酉', 酉: '卯',
    寅: '申', 申: '寅', 巳: '亥', 亥: '巳',
    辰: '戌', 戌: '辰', 丑: '未', 未: '丑',
  }
  const dzChong = CHONG_PAIR[ctx.dayZhi as string]
  if (dzChong && [ctx.pillars[0].zhi, ctx.pillars[1].zhi, ctx.pillars[3].zhi].includes(dzChong)) {
    return null
  }
  return { name: '日德格', note: `日柱 ${ctx.dayGz} · 叠见日德 · 日支不冲` }
}

/**
 * 日贵格 —— md：「日柱为四日贵之一：丁亥/丁酉/癸巳/癸卯」+ 「贵人不被冲破合去」。
 */
const RI_GUI = new Set(['丁亥', '丁酉', '癸巳', '癸卯'])
export function isRiGuiGe(ctx: Ctx): GejuDraft | null {
  if (!RI_GUI.has(ctx.dayGz)) return null
  // md: 贵人不冲
  const CHONG_PAIR: Record<string, string> = {
    子: '午', 午: '子', 卯: '酉', 酉: '卯',
    寅: '申', 申: '寅', 巳: '亥', 亥: '巳',
    辰: '戌', 戌: '辰', 丑: '未', 未: '丑',
  }
  const dzChong = CHONG_PAIR[ctx.dayZhi as string]
  if (dzChong && [ctx.pillars[0].zhi, ctx.pillars[1].zhi, ctx.pillars[3].zhi].includes(dzChong)) {
    return null
  }
  return { name: '日贵格', note: `日柱 ${ctx.dayGz} · 天乙贵人不冲` }
}

/**
 * 身杀两停 —— md：「日主有根有扶」「七杀透干通根」「身杀旺度相当」「无官杀混杂」。
 * 采用 shenWang + 七杀通根 + 无正官，作为"力量势均"的定性近似。
 */
export function isShenShaLiangTing(ctx: Ctx): GejuDraft | null {
  if (!ctx.shenWang) return null                         // md: 身须有根有扶
  if (!ctx.tou('七杀')) return null
  if (!ctx.zang('七杀')) return null                     // md: 七杀通根
  if (ctx.tou('正官')) return null                        // md: 无官杀混杂
  return { name: '身杀两停', note: '身旺 · 七杀透根 · 官杀不混' }
}

/**
 * 劫财见财 —— md：「劫财透干通根 + 财星透干 + 财弱于比劫 + 无官无食伤救」。
 */
export function isJieCaiJianCai(ctx: Ctx): GejuDraft | null {
  if (!ctx.tou('劫财')) return null
  if (!ctx.zang('劫财')) return null                     // md: 劫财通根
  if (!ctx.touCat('财')) return null
  // md: 比劫 > 财
  if (ctx.countCat('比劫') <= ctx.countCat('财')) return null
  // md: 无官杀护财 + 无食伤通关
  if (ctx.touCat('官杀')) return null
  if (ctx.touCat('食伤')) return null
  return { name: '劫财见财', note: '劫财透根 · 财弱无官食救 · 夺财' }
}

/**
 * 帝王命造 —— md：「格局清纯不混杂」+ 「五行流通或气势纯粹二者居其一」
 *            + 「日主立得住」+ 「无致命破格」。
 * 采用 "身不过弱 + 财官印全 / 专旺 / 从格 成立" 作为定性近似。
 */
export function isDiWangMingZao(ctx: Ctx): GejuDraft | null {
  if (ctx.shenRuo && !ctx.deLing) return null             // md: 日主立得住
  // md: 流通 (财官印全) 或 气势纯粹 (专旺/从格)
  const hasFull = isCaiGuanYinQuan(ctx) !== null
  const hasZhuan = !!checkZhuanWang(ctx, ctx.dayWx)
  if (!hasFull && !hasZhuan) return null
  // md: 格局清纯 —— 无官杀混杂、无伤官见官、无枭神夺食
  if (isGuanShaHunZa(ctx) !== null) return null
  if (isShangGuanJianGuan(ctx) !== null) return null
  if (isXiaoShenDuoShi(ctx) !== null) return null
  return { name: '帝王命造', note: '格局清纯 · 流通或专旺 · 日主立得住' }
}

// ——————————————————————— 主入口 ———————————————————————

export const DETECTORS: Record<string, (ctx: Ctx) => GejuDraft | null> = {
  // 正格 (月令单一十神)
  建禄格: isJianLuGe,
  阳刃格: isYangRenGe,
  正官格: isZhengGuanGe,
  七杀格: isQiShaGe,
  食神格: isShiShenGe,
  伤官格: isShangGuanGe,
  正财格: isZhengCaiGe,
  偏财格: isPianCaiGe,
  正印格: isZhengYinGe,
  偏印格: isPianYinGe,
  魁罡格: isKuiGangGe,
  壬骑龙背: isRenQiLongBei,
  // 官杀
  官杀混杂: isGuanShaHunZa,
  官印相生: isGuanYinXiangSheng,
  杀印相生: isShaYinXiangSheng,
  // 食伤
  食神制杀: isShiShenZhiSha,
  枭神夺食: isXiaoShenDuoShi,
  伤官见官: isShangGuanJianGuan,
  伤官合杀: isShangGuanHeSha,
  伤官生财: isShangGuanShengCai,
  伤官佩印: isShangGuanPeiYin,
  食伤混杂: isShiShangHunZa,
  食伤泄秀: isShiShangXieXiu,
  // 羊刃
  羊刃驾杀: isYangRenJiaSha,
  羊刃劫财: isYangRenJieCai,
  // 总量
  财官印全: isCaiGuanYinQuan,
  比劫重重: isBiJieChongChong,
  禄马同乡: isLuMaTongXiang,
  以财破印: isYiCaiPoYin,
  财多身弱: isCaiDuoShenRuo,
  // 五行象法 (成对判定，key 为对关系标识)
  水火对: judgeShuiHuo,   // → 水火既济 / 水火相战
  木火对: judgeMuHuo,     // → 木火相煎 / 木火通明 / 木多火塞
  土金对: judgeTuJin,     // → 土金毓秀 / 土重金埋
  火金对: judgeHuoJin,    // → 火多金熔 / 火旺金衰 / 金火铸印
  火土对: judgeHuoTu,     // → 火土夹带 / 火炎土燥
  水木对: judgeShuiMu,    // → 水木清华 / 水多木漂 / 水冷木寒
  金水对: judgeJinShui,   // → 金寒水冷 / 金白水清
  木土对: judgeMuTu,      // → 木疏厚土
  金木对: judgeJinMu,     // → 斧斤伐木
  寒木向阳: judgeHanMu,
  日照江河: judgeRiZhao,
  // 专旺 (五行分五格)
  曲直格: isQuZhiGe,
  炎上格: isYanShangGe,
  稼穑格: isJiaSeGe,
  从革格: isCongGeGe,
  润下格: isRunXiaGe,
  // 从格
  从财格: isCongCaiGe,
  从杀格: isCongShaGe,
  从儿格: isCongErGe,
  从官格: isCongGuanGe,
  从旺格: isCongWangGe,
  从强格: isCongQiangGe,
  从势格: isCongShiGe,
  // 特殊格
  三奇格: isSanQiGe,
  三庚格: isSanGengGe,
  两气成象: isLiangQiChengXiang,
  五行齐全: isWuXingQiQuan,
  化气格: isHuaQiGe,
  天元一气: isTianYuanYiQi,
  日德格: isRiDeGe,
  日贵格: isRiGuiGe,
  身杀两停: isShenShaLiangTing,
  劫财见财: isJieCaiJianCai,
  帝王命造: isDiWangMingZao,
}

function enrich(d: GejuDraft): GejuHit {
  const m = META[d.name] ?? { quality: 'neutral' as const, category: '特殊格' as const }
  return { ...d, quality: m.quality, category: m.category }
}

export function detectGeju(pillars: Pillar[]): GejuHit[] {
  if (pillars.length !== 4) return []
  const ctx = buildCtx(pillars)
  const hits: GejuHit[] = []
  for (const detect of Object.values(DETECTORS)) {
    const h = detect(ctx)
    if (!h) continue
    hits.push(enrich(h))
  }
  return hits
}
