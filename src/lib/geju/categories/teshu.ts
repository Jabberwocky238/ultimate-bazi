import { CHONG_PAIR, type Ctx } from '../ctx'
import type { GejuDraft } from '../types'
import { ganWuxing } from '../../wuxing'
import { isCaiGuanYinQuan } from './zongliang'
import { isGuanShaHunZa } from './guansha'
import { isShangGuanJianGuan, isXiaoShenDuoShi } from './shishang'
import { checkZhuanWang } from './zhuanwang'

/**
 * 三奇格 —— md：天干四位中同时含某一组三奇 (乙丙丁 / 甲戊庚 / 壬癸辛) 全部；
 *   「顺排」: 三奇按 年月日时 顺序出现；「中间字必须在中间位」。
 */
const SAN_QI: Array<[string, string, string]> = [
  ['乙', '丙', '丁'],
  ['甲', '戊', '庚'],
  ['壬', '癸', '辛'],
]
export function isSanQiGe(ctx: Ctx): GejuDraft | null {
  const gans = ctx.pillars.map((p) => p.gan)
  for (const trio of SAN_QI) {
    const positions = trio.map((g) => gans.indexOf(g))
    if (positions.some((p) => p < 0)) continue
    const sorted = [...positions].sort((a, b) => a - b)
    if (positions.join() !== sorted.join()) return null
    return { name: '三奇格', note: `天干顺排 ${trio.join('')} 三奇` }
  }
  return null
}

/**
 * 三庚格 —— md：「天干四位中至少三位为庚金」+ 「庚金为日主喜用」。
 *   庚金为用 = 日主为甲乙木 (庚为官杀 需有根以任官) 或 丙丁火 (庚为财)；
 *   日主为庚辛金 (庚为比劫) → md 明文: 「庚金为忌神 → 破格」。
 */
export function isSanGengGe(ctx: Ctx): GejuDraft | null {
  const gengN = ctx.pillars.filter((p) => p.gan === '庚').length
  if (gengN < 3) return null
  if (ctx.dayWx === '金') return null
  if (ctx.dayWx === '木' && ctx.shenRuo) return null
  return { name: '三庚格', note: `天干庚 ${gengN} 位 · 日主${ctx.dayGan}为用` }
}

/**
 * 两气成象 —— md：「命局中只有两种五行势均力敌且相生有情」。
 * 条件：只有两种五行出现 (天干+地支主气) + 两者为相生关系 (非相克)。
 */
export function isLiangQiChengXiang(ctx: Ctx): GejuDraft | null {
  const wxSet = new Set<string>()
  for (const p of ctx.pillars) {
    const gw = ganWuxing(p.gan)
    if (gw) wxSet.add(gw)
    const zw = ctx.pillars.find((x) => x === p) && ganWuxing(p.hideGans[0] ?? '')
    if (zw) wxSet.add(zw)
  }
  if (wxSet.size !== 2) return null
  const [a, b] = [...wxSet]
  const GEN: Record<string, string> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }
  if (GEN[a] !== b && GEN[b] !== a) return null
  const aN = ctx.ganWxCount(a) + ctx.zhiMainWxCount(a)
  const bN = ctx.ganWxCount(b) + ctx.zhiMainWxCount(b)
  if (Math.abs(aN - bN) > 2) return null
  return { name: '两气成象', note: `只见 ${a}${b} 两五行且势均相生` }
}

/**
 * 五行齐全 —— md：「八字天干地支(含藏干)中木火土金水全部出现」。
 */
export function isWuXingQiQuan(ctx: Ctx): GejuDraft | null {
  const wxSet = new Set<string>()
  for (const p of ctx.pillars) {
    const gw = ganWuxing(p.gan)
    if (gw) wxSet.add(gw)
    for (const h of p.hideGans) {
      const hw = ganWuxing(h)
      if (hw) wxSet.add(hw)
    }
  }
  const WX = ['木', '火', '土', '金', '水']
  if (!WX.every((w) => wxSet.has(w))) return null
  return { name: '五行齐全', note: '木火土金水齐全' }
}

/**
 * 化气格 —— md：「日干与月干或日干与时干形成五合」
 *          「化神在月令当令或局中极旺」
 *          「化干(日主之原本五行)无根」。
 */
const HE_MAP: Record<string, { partner: string; huaWx: string }> = {
  甲: { partner: '己', huaWx: '土' }, 己: { partner: '甲', huaWx: '土' },
  乙: { partner: '庚', huaWx: '金' }, 庚: { partner: '乙', huaWx: '金' },
  丙: { partner: '辛', huaWx: '水' }, 辛: { partner: '丙', huaWx: '水' },
  丁: { partner: '壬', huaWx: '木' }, 壬: { partner: '丁', huaWx: '木' },
  戊: { partner: '癸', huaWx: '火' }, 癸: { partner: '戊', huaWx: '火' },
}
export function isHuaQiGe(ctx: Ctx): GejuDraft | null {
  const info = HE_MAP[ctx.dayGan]
  if (!info) return null
  const monthGan = ctx.pillars[1].gan
  const hourGan = ctx.pillars[3].gan
  if (monthGan !== info.partner && hourGan !== info.partner) return null
  if (ctx.rootWx(ctx.dayWx)) return null
  const monthWx = ganWuxing(ctx.pillars[1].hideGans[0] ?? '')
  const huaStrong = monthWx === info.huaWx || ctx.zhiMainWxCount(info.huaWx) >= 2
  if (!huaStrong) return null
  const sameN = ctx.pillars.filter((p) => p.gan === ctx.dayGan).length
  if (sameN > 1) return null
  return { name: '化气格', note: `${ctx.dayGan}${info.partner} 合化${info.huaWx} · 化干无根 · 化神旺` }
}

/** 天元一气 —— md：「年月日时四柱之干同为一字」。 */
export function isTianYuanYiQi(ctx: Ctx): GejuDraft | null {
  const g = ctx.pillars[0].gan
  if (!g) return null
  if (!ctx.pillars.every((p) => p.gan === g)) return null
  return { name: '天元一气', note: `四柱天干同为 ${g}` }
}

/**
 * 日德格 —— md：「日柱为五日德之一：甲寅/丙辰/戊辰/庚辰/壬戌」
 *          + 「叠见：除日柱外另见一位」+ 「日支不被冲」。
 */
const RI_DE = new Set(['甲寅', '丙辰', '戊辰', '庚辰', '壬戌'])
export function isRiDeGe(ctx: Ctx): GejuDraft | null {
  if (!RI_DE.has(ctx.dayGz)) return null
  const others = [ctx.pillars[0].gz, ctx.pillars[1].gz, ctx.pillars[3].gz]
  if (!others.some((gz) => RI_DE.has(gz))) return null
  const dzChong = CHONG_PAIR[ctx.dayZhi as string]
  if (dzChong && [ctx.pillars[0].zhi, ctx.pillars[1].zhi, ctx.pillars[3].zhi].includes(dzChong)) {
    return null
  }
  return { name: '日德格', note: `日柱 ${ctx.dayGz} · 叠见日德 · 日支不冲` }
}

/**
 * 日贵格 —— md：「日柱为四日贵之一：丁亥/丁酉/癸巳/癸卯」+ 「贵人不被冲破合去」。
 */
const RI_GUI = new Set(['丁亥', '丁酉', '癸巳', '癸卯'])
export function isRiGuiGe(ctx: Ctx): GejuDraft | null {
  if (!RI_GUI.has(ctx.dayGz)) return null
  const dzChong = CHONG_PAIR[ctx.dayZhi as string]
  if (dzChong && [ctx.pillars[0].zhi, ctx.pillars[1].zhi, ctx.pillars[3].zhi].includes(dzChong)) {
    return null
  }
  return { name: '日贵格', note: `日柱 ${ctx.dayGz} · 天乙贵人不冲` }
}

/**
 * 身杀两停 —— md：「日主有根有扶」「七杀透干通根」「身杀旺度相当」「无官杀混杂」。
 * 采用 shenWang + 七杀通根 + 无正官，作为"力量势均"的定性近似。
 */
export function isShenShaLiangTing(ctx: Ctx): GejuDraft | null {
  if (!ctx.shenWang) return null
  if (!ctx.tou('七杀')) return null
  if (!ctx.zang('七杀')) return null
  if (ctx.tou('正官')) return null
  return { name: '身杀两停', note: '身旺 · 七杀透根 · 官杀不混' }
}

/**
 * 劫财见财 —— md：「劫财透干通根 + 财星透干 + 财弱于比劫 + 无官无食伤救」。
 */
export function isJieCaiJianCai(ctx: Ctx): GejuDraft | null {
  if (!ctx.tou('劫财')) return null
  if (!ctx.zang('劫财')) return null
  if (!ctx.touCat('财')) return null
  if (ctx.countCat('比劫') <= ctx.countCat('财')) return null
  if (ctx.touCat('官杀')) return null
  if (ctx.touCat('食伤')) return null
  return { name: '劫财见财', note: '劫财透根 · 财弱无官食救 · 夺财' }
}

/**
 * 帝王命造 —— md：「格局清纯不混杂」+ 「五行流通或气势纯粹二者居其一」
 *            + 「日主立得住」+ 「无致命破格」。
 */
export function isDiWangMingZao(ctx: Ctx): GejuDraft | null {
  if (ctx.shenRuo && !ctx.deLing) return null
  const hasFull = isCaiGuanYinQuan(ctx) !== null
  const hasZhuan = !!checkZhuanWang(ctx, ctx.dayWx)
  if (!hasFull && !hasZhuan) return null
  if (isGuanShaHunZa(ctx) !== null) return null
  if (isShangGuanJianGuan(ctx) !== null) return null
  if (isXiaoShenDuoShi(ctx) !== null) return null
  return { name: '帝王命造', note: '格局清纯 · 流通或专旺 · 日主立得住' }
}
