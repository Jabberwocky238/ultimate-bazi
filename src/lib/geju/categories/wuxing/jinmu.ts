import type { Ctx } from '../../ctx'
import type { GejuDraft } from '../../types'

/** 金木对 (日主木)：木有根 + 金透有根但不过旺 → 斧斤伐木。
 *  md: 「木有强盛的本根 (日主甲乙木或月令寅卯/亥卯未合木)」
 *      「金有力但不过旺 (理想比例 木3金1-2)」
 *      「庚辛透干有根，但不至于一片金气」
 *      「无过多水生木」「无过多土生金」
 */
export function judgeJinMu(ctx: Ctx): GejuDraft | null {
  if (ctx.dayWx !== '木') return null
  if (!ctx.rootWx('木')) return null
  const jinGanN = ctx.ganWxCount('金')
  const jinZhiN = ctx.zhiMainWxCount('金')
  if (jinGanN === 0 && jinZhiN === 0) return null
  if (jinGanN + jinZhiN > 3) return null
  if (!ctx.touWx('金')) return null
  if (ctx.ganWxCount('水') + ctx.zhiMainWxCount('水') >= 3) return null
  if (ctx.ganWxCount('土') + ctx.zhiMainWxCount('土') >= 3) return null
  return { name: '斧斤伐木', note: '木有根 · 金透根适度 · 金木对立成象' }
}
