import { readBazi, readExtras, readShishen, readStrength } from '../../hooks'
import { WX_GENERATED_BY } from '../../types'
import type { Shishen, WuXing, Zhi } from '@jabberwocky238/bazi-engine'

/**
 * 专旺共用判据 — 与 bazi-skills 《格局/专旺格/成立条件.md》对照:
 *
 *  bazi-skills 5 条 (《渊海子平·杂格》《三命通会·五行专旺》《滴天髓·从象》):
 *   1. 日主与月令同气 — 日主五行 = 月令本气五行  [静态, 不可补]
 *   2. 地支会该五行之局 — 三合 OR 三会 (土稼穑用四库齐 / 三库见 替代)
 *      [可被大运 / 流年地支补齐缺失的最后一字 → suiyunTrigger]
 *   3. 天干透比劫 / 印 遍布一气 — 日主外另透同五行 ≥ 1 位
 *      [可被大运 / 流年天干补齐 → suiyunTrigger]
 *   4. 原局无克本气之字 — 官杀不透 / 不藏 [岁运透官杀 → suiyunBreak]
 *   5. 食伤可微泄 — 此实现严判: 不许透 [岁运透食伤 → suiyunBreak]
 *
 *  附: 财透 (条件 4 副，"克气" 之财) — maxCaiTou 控量, 稼穑放宽到 1。
 *
 *  返回 ZhuanWangResult — 由各子格 detector 喂给 emitGeju 决定:
 *    - 主局已成 (baseFormed) + 岁运不破                           → 显, normal
 *    - 主局已成 + 岁运透官杀 / 食伤 / 超限财                       → 显 + Break
 *    - 主局缺 ② 或 ③ + 岁运地支补三合 / 天干透同气                 → 隐 + Trigger
 *    - 主局有 ④ ⑤ 类破气 (官杀 / 食伤透) — 主局已破 → 不补 → null
 */
const SANHE_TRIPLES: Record<string, readonly Zhi[]> = {
  木: ['亥', '卯', '未'],
  火: ['寅', '午', '戌'],
  金: ['巳', '酉', '丑'],
  水: ['申', '子', '辰'],
}
const SANHUI_TRIPLES: Record<string, readonly Zhi[]> = {
  木: ['寅', '卯', '辰'],
  火: ['巳', '午', '未'],
  金: ['申', '酉', '戌'],
  水: ['亥', '子', '丑'],
}
const SI_KU: readonly Zhi[] = ['辰', '戌', '丑', '未']

const CAI_SHISHENS: Shishen[] = ['正财', '偏财']

function hasAll(zhis: Zhi[], triple: readonly Zhi[]): boolean {
  return triple.every((z) => zhis.includes(z))
}

export interface ZhuanWangResult {
  /** 主局成格 (前 5 条全部主局满足)。 */
  baseFormed: boolean
  /** 主局 + 岁运 后成格 (条件 2/3 可被岁运补齐, 条件 4/5/6 任一被岁运破则 false)。 */
  withExtrasFormed: boolean
  /** 是否选了岁运。 */
  hasExtras: boolean
  /** 描述文字 (原局优先, 岁运补齐时标注 "岁运补…")。 */
  note: string
}

export function checkZhuanWang(
  targetWx: string,
  maxCaiTou = 0,
): ZhuanWangResult | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const strength = readStrength()
  const extras = readExtras()

  // —— 条件 1: 日主与月令同气 (静态前提) ——
  if (bazi.dayWx !== targetWx) return null
  if (!strength.deLing) return null

  const selfWx = bazi.dayWx
  const yinWx = WX_GENERATED_BY[selfWx] as WuXing
  const mainZhis = bazi.mainArr.map((p) => p.zhi as Zhi)
  const extraZhis = extras.extraArr.map((p) => p.zhi as Zhi)
  const allZhis = [...mainZhis, ...extraZhis]

  // —— 条件 2: 三合 / 三会 / (土) 四库齐 (可被岁运补齐) ——
  let baseLayout = ''
  let extraLayout = ''
  let base2 = false
  let ext2 = false
  if (selfWx === '土') {
    base2 = hasAll(mainZhis, SI_KU)
    ext2 = hasAll(allZhis, SI_KU)
    if (base2) baseLayout = '四库齐'
    else if (ext2) extraLayout = '岁运补四库齐'
  } else {
    const sh = SANHE_TRIPLES[selfWx]
    const hh = SANHUI_TRIPLES[selfWx]
    if (sh && hasAll(mainZhis, sh)) { base2 = true; baseLayout = `三合 ${sh.join('')}` }
    else if (hh && hasAll(mainZhis, hh)) { base2 = true; baseLayout = `三会 ${hh.join('')}` }

    if (sh && hasAll(allZhis, sh)) {
      ext2 = true
      if (!base2) extraLayout = `岁运补三合 ${sh.join('')}`
    } else if (hh && hasAll(allZhis, hh)) {
      ext2 = true
      if (!base2) extraLayout = `岁运补三会 ${hh.join('')}`
    }
  }

  // —— 条件 3: 天干同五行 ≥ 2 (含日主，可被岁运补齐) ——
  const baseGanN = bazi.ganWxCount(targetWx as WuXing)
  const allGanN = baseGanN + extras.extraGanWxCount(targetWx as WuXing)
  const base3 = baseGanN >= 2
  const ext3 = allGanN >= 2

  // —— 条件 4: 不见官杀 (透或藏一律破; 岁运官杀视为破气) ——
  const base4 = !shishen.hasCat('官杀')
  const ext4 = base4 && !extras.hasCat('官杀')

  // —— 条件 6 (md 序号 5): 食伤透 ≥ 1 即破; 岁运透食伤同破 ——
  const base6 = !shishen.touCat('食伤')
  const ext6 = base6 && !extras.touCat('食伤')

  // —— 条件 5: 财透 ≤ maxCaiTou (附属克气控量) ——
  const baseCaiTou = (shishen.tou('正财') ? 1 : 0) + (shishen.tou('偏财') ? 1 : 0)
  const extraCaiTouAdd = extras.extraArr.filter(
    (p) => CAI_SHISHENS.includes(p.shishen as Shishen),
  ).length
  const base5 = baseCaiTou <= maxCaiTou
  const ext5 = baseCaiTou + extraCaiTouAdd <= maxCaiTou

  // 稼穑额外: 财 (透 + 主气) 总位严控 < 2
  let base5b = true
  let ext5b = true
  if (selfWx === '土' && maxCaiTou >= 1) {
    const mainCaiMainZhi = shishen.mainZhiArr.filter(
      (s) => s === '正财' || s === '偏财',
    ).length
    const extraCaiMainZhi = extras.extraArr.filter(
      (p) => p.hideShishen[0] === '正财' || p.hideShishen[0] === '偏财',
    ).length
    base5b = (baseCaiTou + mainCaiMainZhi) < 2
    ext5b = (baseCaiTou + extraCaiTouAdd + mainCaiMainZhi + extraCaiMainZhi) < 2
  }

  const baseFormed = base2 && base3 && base4 && base5 && base5b && base6
  const withExtrasFormed = ext2 && ext3 && ext4 && ext5 && ext5b && ext6
  const hasExtras = extras.active

  if (!baseFormed && !withExtrasFormed) return null

  // —— 拼 note ——
  const layoutNote = baseLayout || extraLayout
  const ganNote = base3
    ? `${selfWx} 透 ${baseGanN} 位`
    : ext3
      ? `${selfWx} 透 ${baseGanN}+岁运${allGanN - baseGanN}=${allGanN} 位`
      : `${selfWx} 透 ${allGanN} 位`
  const caiNote = baseCaiTou > 0
    ? `, 财透${baseCaiTou}`
    : extraCaiTouAdd > 0
      ? `, 岁运财透${extraCaiTouAdd}`
      : ''

  void yinWx
  return {
    baseFormed,
    withExtrasFormed,
    hasExtras,
    note: `${layoutNote} · ${ganNote}${caiNote}`,
  }
}
