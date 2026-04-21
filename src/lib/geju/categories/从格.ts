import {
  WX_GENERATED_BY,
  WX_CONTROLLED_BY,
  WX_CONTROLS,
  type Ctx,
} from '../ctx'
import type { GejuDraft, ShishenCat } from '../types'

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
  if (ctx.countCat('财') < ctx.countCat('食伤')) return null
  if (ctx.countCat('财') <= ctx.countCat('官杀')) return null
  return { name: '从财格', note: r.note }
}

/** 从杀格 —— md：「官杀数量 ≥ 财星」「官杀数量 > 食伤」+ 「无食伤克官杀」。 */
export function isCongShaGe(ctx: Ctx): GejuDraft | null {
  const ksWx = WX_CONTROLLED_BY[ctx.dayWx]
  const r = checkCong(ctx, '官杀', ksWx)
  if (!r) return null
  if (ctx.countCat('官杀') < ctx.countCat('财')) return null
  if (ctx.countCat('官杀') <= ctx.countCat('食伤')) return null
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
  const ssWx = WX_GENERATED_BY[ctx.dayWx]
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
  if (ctx.tou('七杀')) return null
  const gwWx = WX_CONTROLLED_BY[ctx.dayWx]
  if (ctx.zhiMainWxCount(gwWx) < 2) return null
  return { name: '从官格', note: `无比印食伤，正官纯清且通根 (${gwWx} ≥ 2 位)` }
}

/**
 * 从旺格：比劫+印主导全局 + 无官杀 + 无财破印 (若有食伤仅微泄)。
 * 《滴天髓·从旺》"四柱皆比劫，无官杀制，有印生之"。
 */
export function isCongWangGe(ctx: Ctx): GejuDraft | null {
  if (!ctx.deLing) return null
  const support = ctx.countCat('比劫') + ctx.countCat('印')
  if (support < 5) return null
  if (ctx.countCat('官杀') > 0) return null
  if (ctx.touCat('财')) {
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
  if (ctx.monthCat === '比劫' || ctx.monthCat === '印') return null
  const strongCats = (['食伤', '财', '官杀'] as ShishenCat[]).filter(
    (c) => ctx.touCat(c) && ctx.countCat(c) >= 2,
  )
  if (strongCats.length < 2) return null
  return { name: '从势格', note: `无根 · 月令非印比 · ${strongCats.join(' ')} 并强` }
}

/**
 * 从强格 (md)：印星力量 > 比劫 + 月令为印或比劫 + 全局皆印比 + 无食伤财官杀。
 * md 明文：「四柱印绶重重，比劫叠叠」「印星力量 > 比劫」
 *        「没有食伤财星官杀任何一党」。
 * 与从旺格差异：从旺格 比劫 ≥ 印，从强格 印 > 比劫。
 */
export function isCongQiangGe(ctx: Ctx): GejuDraft | null {
  if (!ctx.deLing) return null
  const yinN = ctx.countCat('印')
  const biN = ctx.countCat('比劫')
  if (yinN <= biN) return null
  if (yinN + biN < 5) return null
  if (ctx.countCat('食伤') > 0) return null
  if (ctx.countCat('财') > 0) return null
  if (ctx.countCat('官杀') > 0) return null
  return { name: '从强格', note: `印 ${yinN} > 比劫 ${biN} 主导，全局皆印比` }
}
