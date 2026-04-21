import type { Ctx } from '../../ctx'
import type { GejuDraft } from '../../types'

/**
 * 寒木向阳 (不成对的特殊象法)：冬月木日主 + 木有根 + 火透 + 火不过烈 + 水不过多。
 * md: 「日主为木」「月令为冬」「木有根」「火不过烈」「水不过多」
 */
export function judgeHanMu(ctx: Ctx): GejuDraft | null {
  if (ctx.dayWx !== '木') return null
  if (ctx.season !== '冬') return null
  if (!ctx.touWx('火')) return null
  if (!ctx.rootExt('木')) return null
  if (ctx.ganWxCount('火') >= 3) return null
  if (ctx.zhiMainWxCount('水') >= 3) return null
  return { name: '寒木向阳', note: '冬木有根 · 火透调候 · 水火适度' }
}
