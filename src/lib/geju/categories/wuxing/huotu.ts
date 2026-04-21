import type { Ctx } from '../../ctx'
import type { GejuDraft } from '../../types'

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
