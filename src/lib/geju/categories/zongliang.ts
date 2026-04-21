import { LU, yimaFrom, type Ctx } from '../ctx'
import type { GejuDraft } from '../types'
import { SHI_SHEN_CAT } from '../types'

/** 财官印全：财、官(杀)、印 三者皆透干。 */
export function isCaiGuanYinQuan(ctx: Ctx): GejuDraft | null {
  if (!ctx.touCat('财')) return null
  if (!ctx.touCat('官杀')) return null
  if (!ctx.touCat('印')) return null
  return { name: '财官印全', note: '财官印三者透干' }
}

/** 比劫重重：比劫透干 ≥ 2 或 地支主气比劫 ≥ 3。 */
export function isBiJieChongChong(ctx: Ctx): GejuDraft | null {
  const touN = [
    ctx.tou('比肩'), ctx.tou('劫财'),
  ].filter(Boolean).length +
    (ctx.pillars.filter((p, i) => i !== 2 && SHI_SHEN_CAT[p.shishen] === '比劫').length > 1 ? 1 : 0)
  const zhiN = ctx.pillars.filter((p) => SHI_SHEN_CAT[p.hideShishen[0] ?? ''] === '比劫').length
  if (touN < 2 && zhiN < 3) return null
  return { name: '比劫重重', note: `比劫透 ${touN} 位，地支主气 ${zhiN} 位` }
}

/** 禄马同乡：某柱地支既为日主禄又为驿马。 */
export function isLuMaTongXiang(ctx: Ctx): GejuDraft | null {
  const lu = LU[ctx.dayGan]
  const ymY = yimaFrom(ctx.yearZhi)
  const ymD = yimaFrom(ctx.dayZhi)
  for (let i = 0; i < ctx.pillars.length; i++) {
    const p = ctx.pillars[i]
    if (p.zhi === lu && (p.zhi === ymY || p.zhi === ymD)) {
      return { name: '禄马同乡', note: `${['年', '月', '日', '时'][i]}柱 ${p.zhi} 禄马同位` }
    }
  }
  return null
}

/**
 * 以财破印：印过旺成病（印≥3位）+ 财透干通根 + 日主有其他比劫/禄刃可承担。
 * 《子平真诠》"印太多而无财以制，其人多懒惰无成"——用在印盛时，不用在身弱时。
 */
export function isYiCaiPoYin(ctx: Ctx): GejuDraft | null {
  if (ctx.countCat('印') < 3) return null            // 印需成病 (≥3位)
  if (!ctx.touCat('财')) return null
  if (!ctx.zang('正财') && !ctx.zang('偏财')) return null  // 财通根
  if (ctx.shenRuo && ctx.countCat('比劫') === 0) return null
  return { name: '以财破印', note: `印 ${ctx.countCat('印')} 位成病，财透破印` }
}

/** 财多身弱：身弱 + 财透干 ≥ 2 或 财在地支主气 ≥ 2。 */
export function isCaiDuoShenRuo(ctx: Ctx): GejuDraft | null {
  if (!ctx.shenRuo) return null
  const caiTou = ['正财', '偏财'].map((s) => ctx.tou(s) ? 1 : 0 as number)
  const touN = (caiTou[0] + caiTou[1])
  const zhiN = ctx.pillars.filter((p) => SHI_SHEN_CAT[p.hideShishen[0] ?? ''] === '财').length
  if (touN < 2 && zhiN < 2) return null
  return { name: '财多身弱', note: `财透 ${touN} 位，地支主气 ${zhiN} 位` }
}
