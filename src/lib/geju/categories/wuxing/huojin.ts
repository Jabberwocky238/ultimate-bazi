import type { Ctx } from '../../ctx'
import type { GejuDraft } from '../../types'

/** 火金对 (日主金)：
 *  - 火过盛 + 金无根 + 无水救 + 无土通关 + 无金比劫 → 火多金熔
 *  - 火透 ≥ 2 + 金无根 + 无土通关 → 火旺金衰
 *  - 金有根 + 火透有根但不过旺 → 金火铸印
 */
export function judgeHuoJin(ctx: Ctx): GejuDraft | null {
  if (ctx.dayWx !== '金') return null
  const huoHeavy = ctx.ganWxCount('火') >= 2 && ctx.zhiMainWxCount('火') >= 1
  const huoDuo = ctx.ganWxCount('火') >= 2
  const jinRoot = ctx.rootWx('金')
  const huoTou = ctx.touWx('火')
  const huoRoot = ctx.rootWx('火')
  const hasShui = ctx.touWx('水') || ctx.rootWx('水')
  const hasTu = ctx.touWx('土')
  const hasBijie = ctx.ganWxCount('金') >= 2
  if (huoHeavy && !jinRoot && !hasShui && !hasTu && !hasBijie) {
    return { name: '火多金熔', note: '火极盛 · 金无根无水无土无比劫救' }
  }
  if (huoDuo && !jinRoot && !hasTu) {
    return { name: '火旺金衰', note: '火多透 · 金无根 · 无土通关' }
  }
  const huoOver = ctx.ganWxCount('火') >= 3
  if (jinRoot && huoTou && huoRoot && !huoOver) {
    return { name: '金火铸印', note: '金有根 · 火透坐根不过旺 · 得火锻炼' }
  }
  return null
}
