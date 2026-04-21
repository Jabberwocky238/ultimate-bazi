import type { Ctx } from '../../ctx'
import type { GejuDraft } from '../../types'

/** 木土对 (日主土)：土极厚 + 木有根能疏 + 木不过旺 + 无重金克木。
 *  md: 「土极为厚实：天干戊己透出且多、地支辰戌丑未见两个以上」
 *      「木有力疏土：甲乙透干、有根能真的扎进土里」
 *      「木不过旺：理想比例 土 3 木 1-2」
 *      「无重金克木：金若过多 → 克断木」
 */
export function judgeMuTu(ctx: Ctx): GejuDraft | null {
  if (ctx.dayWx !== '土') return null
  if (ctx.zhiMainWxCount('土') < 2) return null
  if (ctx.ganWxCount('土') < 1) return null
  if (!ctx.touWx('木')) return null
  if (!ctx.rootExt('木')) return null
  if (ctx.ganWxCount('木') > 2) return null
  if (ctx.ganWxCount('金') >= 2) return null
  return { name: '木疏厚土', note: '土厚 · 木透有根疏土 · 无重金克木' }
}
