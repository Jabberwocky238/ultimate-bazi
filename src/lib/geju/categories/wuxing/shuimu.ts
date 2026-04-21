import type { Ctx } from '../../ctx'
import type { GejuDraft } from '../../types'

/** 水木对 (日主水或木)：
 *  - 木日主 + 水极盛 + 木无根 → 水多木漂 (凶)
 *  - 木日主 + 冬月 + 水多 + 无火 → 水冷木寒 (凶)
 *  - 水透 + 木透 + 无金透 + 无厚土克水 → 水木清华 (吉)
 */
export function judgeShuiMu(ctx: Ctx): GejuDraft | null {
  if (ctx.dayWx !== '水' && ctx.dayWx !== '木') return null

  if (ctx.dayWx === '木') {
    const shuiMany = ctx.ganWxCount('水') >= 2 || ctx.zhiMainWxCount('水') >= 3
    const muRootless = ctx.zhiMainWxCount('木') === 0
    const wuTu = !ctx.touWx('土')
    const wuHuo = !ctx.touWx('火')
    if (shuiMany && muRootless && wuTu && wuHuo) {
      return { name: '水多木漂', note: '水盛 · 木无根 · 无土制水无火泄木' }
    }
    if (
      ctx.season === '冬' &&
      (ctx.ganWxCount('水') >= 2 || ctx.zhiMainWxCount('水') >= 2) &&
      !ctx.touWx('火') &&
      !ctx.touWx('土')
    ) {
      return { name: '水冷木寒', note: '冬月水旺 · 无火调候 · 无土制水' }
    }
  }

  if (!ctx.touWx('水') || !ctx.touWx('木')) return null
  if (ctx.touWx('金')) return null
  if (ctx.zhiMainWxCount('土') >= 2) return null
  // 互斥：火透且有根 (含中气) → 让位木火通明
  if (ctx.touWx('火') && ctx.rootExt('火')) return null
  return { name: '水木清华', note: '水生木且木透，无金克无重土塞水' }
}
