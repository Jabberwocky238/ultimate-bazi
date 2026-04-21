import type { Ctx } from '../../ctx'
import type { GejuDraft } from '../../types'

/** 土金对：
 *  - 土日主 + 金透通根 + 土有根 + 无木透 → 土金毓秀
 *  - 金日主 + 地支土≥3 + 土透≥2 + 金虚 + 无木救 + 无水救 → 土重金埋
 */
export function judgeTuJin(ctx: Ctx): GejuDraft | null {
  if (ctx.dayWx === '土') {
    if (
      ctx.touWx('金') && ctx.rootWx('金') &&
      ctx.rootWx('土') &&
      !ctx.touWx('木') &&
      ctx.ganWxCount('火') < 2
    ) {
      return { name: '土金毓秀', note: '土厚金透通根，无木克土无重火克金' }
    }
  }
  if (ctx.dayWx === '金') {
    if (
      ctx.zhiMainWxCount('土') >= 3 &&
      ctx.ganWxCount('土') >= 2 &&
      !ctx.rootWx('金') &&
      !ctx.touWx('木') &&
      !ctx.touWx('水') && !ctx.rootWx('水')
    ) {
      return { name: '土重金埋', note: '土 ≥ 3 位压金 · 金虚无根 · 无木水救' }
    }
  }
  return null
}
