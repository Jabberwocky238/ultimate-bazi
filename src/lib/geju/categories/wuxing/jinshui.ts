import type { Ctx } from '../../ctx'
import type { GejuDraft } from '../../types'

/**
 * 金水对：
 *  - 冬月 + 金水齐透 + 无火透 → 金寒水冷 (凶)
 *  - 金白水清 (吉，严格依《穷通宝鉴》)：
 *      ① 庚/辛日主
 *      ② 水透 + 通根 (亥子本气 或 申中壬水长生)
 *      ③ 金有根 (申酉本气)
 *      ④ 无戊己土透干 (忌浊水)
 *      ⑤ 无丙丁火透干 (忌熔金)
 */
export function judgeJinShui(ctx: Ctx): GejuDraft | null {
  if (
    ctx.season === '冬' &&
    (ctx.dayWx === '金' || ctx.dayWx === '水') &&
    ctx.touWx('金') && ctx.touWx('水') &&
    !ctx.touWx('火')
  ) {
    return { name: '金寒水冷', note: '冬月金水并透，火缺调候' }
  }
  if (ctx.dayWx !== '金') return null
  if (ctx.season !== '秋' && ctx.season !== '冬') return null
  const waterTouRoot = ctx.touWx('水') && ctx.rootWx('水')
  if (!waterTouRoot) return null
  if (!ctx.rootWx('金')) return null
  if (ctx.touWx('土')) return null
  if (ctx.touWx('火')) return null
  const monthIsShenYou = ctx.monthZhi === '申' || ctx.monthZhi === '酉'
  return {
    name: '金白水清',
    note: `${ctx.season}月金水并秀${monthIsShenYou ? '，月令秋金当令' : ''}`,
  }
}
