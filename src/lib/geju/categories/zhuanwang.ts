import { WX_GENERATED_BY, type Ctx } from '../ctx'
import type { GejuDraft } from '../types'

/**
 * 专旺共用判据 —— 严格按 md："天干另有至少一位 X 透出"。
 * 除日主外年/月/时干再透同五行至少 1 位 (即全局本五行透 ≥ 2 位)。
 *
 * 曲直/炎上/从革/润下 md 均未把财透列为破条件 — 只忌官杀。
 * 稼穑 md 条件 5 明列"水多冲土"，一位有根可容，二位以上破。
 */
export function checkZhuanWang(
  ctx: Ctx,
  targetWx: string,
  maxCaiTou = Infinity,
): { note: string } | null {
  if (ctx.dayWx !== targetWx) return null
  if (!ctx.deLing) return null
  const selfWx = ctx.dayWx
  const yinWx = WX_GENERATED_BY[selfWx]
  const supportZhi = ctx.zhiMainWxCount(selfWx) + ctx.zhiMainWxCount(yinWx)
  if (supportZhi < 3) return null
  if (ctx.touCat('官杀')) return null
  if (ctx.ganWxCount(targetWx) < 2) return null
  const caiTouN =
    (ctx.tou('正财') ? 1 : 0) + (ctx.tou('偏财') ? 1 : 0)
  if (caiTouN > maxCaiTou) return null
  return {
    note: `地支 ${selfWx}+${yinWx} ${supportZhi} 位 · ${selfWx} 透 ${ctx.ganWxCount(targetWx)} 位${caiTouN ? `，财透${caiTouN}` : '，无官杀'}`,
  }
}

/** 曲直格：甲乙木日主专旺。 */
export function isQuZhiGe(ctx: Ctx): GejuDraft | null {
  const r = checkZhuanWang(ctx, '木')
  return r ? { name: '曲直格', note: r.note } : null
}
/** 炎上格：丙丁火日主专旺。 */
export function isYanShangGe(ctx: Ctx): GejuDraft | null {
  const r = checkZhuanWang(ctx, '火')
  return r ? { name: '炎上格', note: r.note } : null
}
/** 稼穑格：戊己土日主专旺 + 月令辰戌丑未 + 财透 ≤ 1 (水不多冲土)。 */
export function isJiaSeGe(ctx: Ctx): GejuDraft | null {
  if (ctx.dayWx !== '土') return null
  if (!['辰', '戌', '丑', '未'].includes(ctx.monthZhi)) return null
  const r = checkZhuanWang(ctx, '土', 1)
  return r ? { name: '稼穑格', note: `月令 ${ctx.monthZhi} ; ${r.note}` } : null
}
/** 从革格：庚辛金日主专旺。 */
export function isCongGeGe(ctx: Ctx): GejuDraft | null {
  const r = checkZhuanWang(ctx, '金')
  return r ? { name: '从革格', note: r.note } : null
}
/** 润下格：壬癸水日主专旺。 */
export function isRunXiaGe(ctx: Ctx): GejuDraft | null {
  const r = checkZhuanWang(ctx, '水')
  return r ? { name: '润下格', note: r.note } : null
}
