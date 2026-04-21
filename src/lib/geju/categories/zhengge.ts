import { LU, YANG_REN, KUIGANG_DAY, type Ctx } from '../ctx'
import type { GejuDraft } from '../types'
import { SHI_SHEN_CAT } from '../types'

/**
 * 通用"月令X格"工厂：
 *   - 月令主气为 target 十神 OR (target 透干 + 月令地支藏 target)
 *   - 返回基础成立的草稿；具体格局的额外条件由调用方再判。
 */
function monthGeFormed(ctx: Ctx, target: string): boolean {
  const monthMain = ctx.pillars[1].hideShishen[0] ?? ''
  if (monthMain === target) return true
  const monthHide = ctx.pillars[1].hideShishen.includes(target)
  return ctx.tou(target) && monthHide
}

/**
 * 建禄格：月支本气为日主之禄 + 原局有官/财/食伤作为泄克出口 + **月支不被冲**。
 * 依《子平真诠》："禄格用官，干头透出为奇；其次财生官，其次伤官佩印……
 *   日元既旺，则宜泄宜克"。无泄克出口者只是"空身强"，不入贵格。
 * md 明文："月支不被冲、不被合化为他五行；六冲忌讳"。
 */
export function isJianLuGe(ctx: Ctx): GejuDraft | null {
  if (ctx.monthZhi !== LU[ctx.dayGan]) return null
  if (ctx.monthZhiBeingChong) return null           // 月支被冲 → 破
  const hasOutlet =
    ctx.touCat('官杀') || ctx.touCat('财') || ctx.touCat('食伤')
  if (!hasOutlet) return null
  return {
    name: '建禄格',
    note: `月令 ${ctx.monthZhi} 临日主 ${ctx.dayGan} 之禄，带官杀/财/食伤为用`,
  }
}

/**
 * 正官格（依《子平真诠·论正官》5 条）：
 *  1. 月令正官 OR 透 + 月令藏 ✓
 *  2. 不混七杀 ✓
 *  3. 无伤官紧贴 ✓
 *  4. 日主身中偏强 (非身弱)
 *  5. 正官通根 (非虚透)
 */
export function isZhengGuanGe(ctx: Ctx): GejuDraft | null {
  if (!monthGeFormed(ctx, '正官')) return null
  if (!ctx.tou('正官')) return null
  if (!ctx.zang('正官')) return null                 // 条件 5：通根
  if (ctx.tou('七杀')) return null                    // 条件 2：不混
  if (ctx.tou('伤官')) return null                    // 条件 3：无伤
  if (ctx.shenRuo) return null                        // 条件 4：身非弱
  return { name: '正官格', note: '月令正官透根，不混杀无伤，身可任' }
}

/**
 * 七杀格（依《子平真诠·论七杀》5 条）：
 *  1. 月令七杀 OR 透 + 月令藏 ✓
 *  2. 不混正官 ✓
 *  3. 有食神制 OR 印化 ✓
 *  4. 日主有根 (非极弱)
 *  5. 制化之神通根 (食神或印透且有根)
 */
export function isQiShaGe(ctx: Ctx): GejuDraft | null {
  if (!monthGeFormed(ctx, '七杀')) return null
  if (ctx.tou('正官')) return null                        // 不混官
  const foodRooted = ctx.tou('食神') && ctx.zang('食神')  // 食神透通根
  const yinRooted = ctx.touCat('印') && (ctx.zang('正印') || ctx.zang('偏印'))
  if (!foodRooted && !yinRooted) return null              // 制化有根
  if (ctx.shenRuo) return null                            // md: 身中至身强
  return {
    name: '七杀格',
    note: `月令七杀 + ${foodRooted ? '食神制 (透根)' : '印化 (透根)'}`,
  }
}

/**
 * 食神格（依《子平真诠·论食神》5 条必要 + 1 条升格）：
 *  1. 月令食神 OR 透+月令藏 ✓
 *  2. 食神透干通根 ✓
 *  3. 日主有根不极弱 ✓
 *  4. **无偏印紧贴夺食 OR 有财护食** (md 允许偏印不紧贴)
 *  5. 不混伤官 ✓
 */
export function isShiShenGe(ctx: Ctx): GejuDraft | null {
  if (!monthGeFormed(ctx, '食神')) return null
  if (!ctx.tou('食神')) return null
  if (!ctx.zang('食神')) return null
  if (ctx.tou('伤官')) return null                          // 不混伤
  if (ctx.shenRuo) return null                               // md: 身中至身强
  const xiaoDuoShi =
    ctx.tou('偏印') &&
    ctx.adjacentTou('偏印', '食神') &&
    !ctx.touCat('财')
  if (xiaoDuoShi) return null
  return { name: '食神格', note: '月令食神透根，不混伤，无枭夺食' }
}

/**
 * 伤官格：月令伤官 + 伤官透根 + 无正官 + 不混食神 + 身非极弱(伤泄身)。
 * 《子平真诠》"伤官见官为祸"；"伤官须有制或有印化"。
 */
export function isShangGuanGe(ctx: Ctx): GejuDraft | null {
  if (!monthGeFormed(ctx, '伤官')) return null
  if (!ctx.tou('伤官')) return null
  if (!ctx.zang('伤官')) return null
  if (ctx.tou('正官')) return null
  if (ctx.tou('食神')) return null                   // 不混食
  if (ctx.shenRuo) return null                        // md: 身中至身强
  return { name: '伤官格', note: '月令伤官透根，无官可见，不混食' }
}

/**
 * 正财格（依《子平真诠·论正财/论财》）：
 *  1. 月令正财 OR 透+月令藏 ✓
 *  2. 正财透干通根 ✓
 *  3. 日主身强能任财 (非身弱) ✓
 *  4. **无比劫紧贴夺财**；若有比劫，须**官杀制之**。
 */
export function isZhengCaiGe(ctx: Ctx): GejuDraft | null {
  if (!monthGeFormed(ctx, '正财')) return null
  if (!ctx.tou('正财')) return null
  if (!ctx.zang('正财')) return null
  if (ctx.shenRuo) return null
  if ((ctx.tou('劫财') || ctx.tou('比肩')) && !ctx.touCat('官杀')) return null
  return { name: '正财格', note: '月令正财透根，身可任，比劫有官杀制' }
}

/**
 * 偏财格（同正财，且偏财更忌比劫）：
 *  1. 月令偏财 OR 透+月令藏 ✓
 *  2. 偏财透干通根 ✓
 *  3. 日主身强 ✓
 *  4. **无比劫紧贴夺财**；若有比劫，须**食伤通关 或 官杀制之**。
 */
export function isPianCaiGe(ctx: Ctx): GejuDraft | null {
  if (!monthGeFormed(ctx, '偏财')) return null
  if (!ctx.tou('偏财')) return null
  if (!ctx.zang('偏财')) return null
  if (ctx.shenRuo) return null
  const hasBiJie = ctx.tou('劫财') || ctx.tou('比肩')
  if (hasBiJie && !ctx.touCat('食伤') && !ctx.touCat('官杀')) return null
  return { name: '偏财格', note: '月令偏财透根，身可任，比劫有食伤/官杀化' }
}

/**
 * 正印格（依《子平真诠·论印绶》）：
 *  1. 月令正印 OR 透+月令藏 ✓
 *  2. 正印透干通根 ✓
 *  3. **无财星紧贴破印**；若有财，须**比劫隔之** (正偏财均破印)
 *  4. 日主身弱或身中 (忌身强，印反闷气机)
 */
export function isZhengYinGe(ctx: Ctx): GejuDraft | null {
  if (!monthGeFormed(ctx, '正印')) return null
  if (!ctx.tou('正印')) return null
  if (!ctx.zang('正印')) return null
  if (ctx.touCat('财') && !ctx.touCat('比劫')) return null
  if (ctx.level === '身极旺') return null
  return { name: '正印格', note: '月令正印透根，无财紧贴破印' }
}

/**
 * 偏印格（依《子平真诠·论偏印》5 条）：
 *  1. 月令偏印 OR 透+月令藏 ✓
 *  2. 偏印透干通根 ✓
 *  3. **无食神紧贴被克**；若有食神紧贴须**财护食**
 *  4. 日主不过强
 *  5. 偏印不过重 (天干 + 主气合计 ≤ 2 位)
 */
export function isPianYinGe(ctx: Ctx): GejuDraft | null {
  if (!monthGeFormed(ctx, '偏印')) return null
  if (!ctx.tou('偏印')) return null
  if (!ctx.zang('偏印')) return null
  const xiao = ctx.tou('偏印') && ctx.adjacentTou('偏印', '食神') && !ctx.touCat('财')
  if (xiao) return null
  const ganCount = ctx.pillars.filter((p) => p.shishen === '偏印').length
  const mainCount = ctx.mainAt('偏印').length
  if (ganCount + mainCount > 2) return null
  if (ctx.level === '身极旺') return null
  return { name: '偏印格', note: '月令偏印透根，量不过重，食神有护' }
}

/**
 * 阳刃格（依《子平真诠·论阳刃》5 条）：
 *  1. 日主阳干 ✓
 *  2. 月令为刃 ✓
 *  3. **必有官杀制** (透干) ✓
 *  4. **官杀通根** (非虚透)
 *  5. 若取正官制刃，**无伤官** (否则伤官见官反坏)
 */
export function isYangRenGe(ctx: Ctx): GejuDraft | null {
  if (!ctx.dayYang) return null
  if (ctx.monthZhi !== YANG_REN[ctx.dayGan]) return null
  if (ctx.monthZhiBeingChong) return null
  if (!ctx.touCat('官杀')) return null
  const gwRooted =
    (ctx.tou('正官') && ctx.zang('正官')) ||
    (ctx.tou('七杀') && ctx.zang('七杀'))
  if (!gwRooted) return null
  if (ctx.tou('正官') && !ctx.tou('七杀') && ctx.tou('伤官')) return null
  return { name: '阳刃格', note: `月令 ${ctx.monthZhi} 阳刃，官杀透根制之` }
}

/**
 * 魁罡格：日柱为四魁罡 + 身旺 + 原局无财透紧贴日柱。
 * 《三命通会》"身强遇之转荣华，运见财官禄科尽丧"。身弱或财紧贴者破格。
 */
export function isKuiGangGe(ctx: Ctx): GejuDraft | null {
  if (!KUIGANG_DAY.has(ctx.dayGz)) return null
  if (ctx.shenRuo) return null
  const adjCai =
    SHI_SHEN_CAT[ctx.pillars[1].shishen] === '财' ||
    SHI_SHEN_CAT[ctx.pillars[3].shishen] === '财'
  if (adjCai) return null
  return { name: '魁罡格', note: `日柱 ${ctx.dayGz} 魁罡，身强不犯财官` }
}

/**
 * 壬骑龙背：日柱壬辰 + 再见壬或辰（多壬多辰为贵）+ 辰不被戌冲。
 * 《三命通会》"壬骑龙背，所喜者多壬、多辰"；md 条件 2 要求其他柱再见壬或辰，
 * 仅日柱壬辰降为"一般壬坐辰"不入真格。
 */
export function isRenQiLongBei(ctx: Ctx): GejuDraft | null {
  if (ctx.dayGz !== '壬辰') return null
  const otherRen = [ctx.pillars[0], ctx.pillars[1], ctx.pillars[3]]
    .some((p) => p.gan === '壬')
  const otherChen = [ctx.pillars[0].zhi, ctx.pillars[1].zhi, ctx.pillars[3].zhi]
    .includes('辰')
  if (!otherRen && !otherChen) return null
  const hasXu = ctx.pillars.some((p) => p.zhi === '戌')
  if (hasXu) return null
  return {
    name: '壬骑龙背',
    note: `日柱壬辰${otherRen ? '，再透壬' : ''}${otherChen ? '，再见辰' : ''}`,
  }
}
