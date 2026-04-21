import { YANG_REN, type Ctx } from '../ctx'
import type { GejuDraft } from '../types'

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
