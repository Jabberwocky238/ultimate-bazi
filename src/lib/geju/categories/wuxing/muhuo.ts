import type { Ctx } from '../../ctx'
import type { GejuDraft } from '../../types'

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
    const muMany = ctx.zhiMainWxCount('木') >= 3
    const huoWeak = !ctx.rootWx('火') || ctx.zhiMainWxCount('火') < 2
    const wuJin = !ctx.touWx('金') || ctx.ganWxCount('金') < 2
    if (muMany && huoWeak && wuJin) {
      return { name: '木多火塞', note: '木多压火 · 火弱无根 · 无金疏通' }
    }
  }
  return null
}
