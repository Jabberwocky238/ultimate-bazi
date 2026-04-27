import type { Ctx } from '../../types'
import type { ShishenCat } from '../../types'
import type { WuXing } from '@jabberwocky238/bazi-engine'

/**
 * 从X 共用判据（从弱派放宽版）：
 * - 天干不得透比劫/印；藏干比劫/印视为虚根可通融。
 * - 目标类别透干。
 * - 月令非印比。
 * - 地支本气 target 五行 ≥ 1 位。
 */
export function checkCong(ctx: Ctx, target: ShishenCat, targetWx: string): { note: string } | null {
  if (ctx.touCat('比劫')) return null
  if (ctx.touCat('印')) return null
  if (!ctx.touCat(target)) return null
  if (ctx.monthCat === '比劫' || ctx.monthCat === '印') return null
  const zhiSupport = ctx.zhiMainWxCount(targetWx as WuXing)
  if (zhiSupport < 1) return null
  const monthIs = ctx.monthCat === target
  return {
    note: `天干无印比透${monthIs ? `，月令${target}` : ''}，地支 ${targetWx} ${zhiSupport} 位`,
  }
}
