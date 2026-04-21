import { LU, YANG_REN, KUIGANG_DAY, type Ctx } from '../ctx'
import type { GejuDraft } from '../types'

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
 * 建禄格（依 md 四条）：
 *  1. 月支本气为日主之禄。
 *  2. 月令不被冲。(md 还要求"不被合化"，ctx 暂无合化 API，略)
 *  3. 官/财/食伤之一**透干且通根**作为泄/克出口。
 *  4. 身不过旺——比印位数过多且无出口则降格。
 */
export function isJianLuGe(ctx: Ctx): GejuDraft | null {
  if (ctx.monthZhi !== LU[ctx.dayGan]) return null
  if (ctx.monthZhiBeingChong) return null
  const officerRooted = ctx.touCat('官杀') && (ctx.zang('正官') || ctx.zang('七杀'))
  const caiRooted = ctx.touCat('财') && (ctx.zang('正财') || ctx.zang('偏财'))
  const shiShangRooted = ctx.touCat('食伤') && (ctx.zang('食神') || ctx.zang('伤官'))
  if (!officerRooted && !caiRooted && !shiShangRooted) return null
  // md 条件 4：比印叠加致身过旺无泄 → 降格
  if (ctx.countCat('比劫') + ctx.countCat('印') >= 6) return null
  return {
    name: '建禄格',
    note: `月令 ${ctx.monthZhi} 临日主 ${ctx.dayGan} 之禄，带官/财/食伤透根为用`,
  }
}

/**
 * 正官格（依《子平真诠·论正官》5 条）：
 *  1. 月令正官 OR 透 + 月令藏 ✓
 *  2. 不混七杀（天干无七杀透）。
 *  3. 无伤官**紧贴**克正官；若紧贴有伤官须有印制可解。
 *  4. 日主身中偏强（非身弱）。
 *  5. 正官透且通根。
 */
export function isZhengGuanGe(ctx: Ctx): GejuDraft | null {
  if (!monthGeFormed(ctx, '正官')) return null
  if (!ctx.tou('正官')) return null
  if (!ctx.zang('正官')) return null
  if (ctx.tou('七杀')) return null
  if (ctx.tou('伤官') && ctx.adjacentTou('伤官', '正官') && !ctx.touCat('印')) return null
  if (ctx.shenRuo) return null
  return { name: '正官格', note: '月令正官透根，不混杀无伤紧贴，身可任' }
}

/**
 * 七杀格（依《子平真诠·论七杀》5 条）：
 *  1. 月令七杀 OR 透 + 月令藏。
 *  2. 不混正官。
 *  3. 有食神制（紧贴）OR 印化 OR 阳刃敌杀。
 *  4. 日主有根（非极弱）。
 *  5. 制化之神透且通根。
 */
export function isQiShaGe(ctx: Ctx): GejuDraft | null {
  if (!monthGeFormed(ctx, '七杀')) return null
  if (ctx.tou('正官')) return null
  const foodRooted = ctx.tou('食神') && ctx.zang('食神') &&
    ctx.adjacentTou('食神', '七杀')                        // md: 食神紧贴七杀相克
  const yinRooted = ctx.touCat('印') && (ctx.zang('正印') || ctx.zang('偏印'))
  const renJiaSha = ctx.dayYang && ctx.pillars.some(
    (p, i) => i !== 2 && p.zhi === (YANG_REN[ctx.dayGan] ?? ''),
  )
  if (!foodRooted && !yinRooted && !renJiaSha) return null
  // md: 非极弱（允许身略弱及以上）
  if (ctx.level === '身极弱' || ctx.level === '近从弱') return null
  return {
    name: '七杀格',
    note: foodRooted ? '月令七杀 + 食神紧贴制 (透根)' :
          yinRooted ? '月令七杀 + 印化 (透根)' : '月令七杀 + 阳刃敌杀',
  }
}

/**
 * 食神格（依《子平真诠·论食神》5 条必要）：
 *  1. 月令食神 OR 透+月令藏。
 *  2. 食神透干通根。
 *  3. 日主有根**不极弱**。
 *  4. 无偏印紧贴夺食 OR 有财护食。
 *  5. 不混伤官（伤官不透）。
 */
export function isShiShenGe(ctx: Ctx): GejuDraft | null {
  if (!monthGeFormed(ctx, '食神')) return null
  if (!ctx.tou('食神')) return null
  if (!ctx.zang('食神')) return null
  if (ctx.tou('伤官')) return null
  if (ctx.level === '身极弱' || ctx.level === '近从弱') return null
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
 *  1. 月令正财 OR 透+月令藏。
 *  2. 正财透干通根。
 *  3. 日主身强能任财（非身弱）。
 *  4. 无比劫**紧贴**夺财；若有紧贴比劫，须官杀制之。
 */
export function isZhengCaiGe(ctx: Ctx): GejuDraft | null {
  if (!monthGeFormed(ctx, '正财')) return null
  if (!ctx.tou('正财')) return null
  if (!ctx.zang('正财')) return null
  if (ctx.shenRuo) return null
  // md: 紧贴 (月/日 或 日/时) 才论夺财
  const bijieAdjCai =
    ctx.adjacentTou('劫财', '正财') || ctx.adjacentTou('比肩', '正财')
  if (bijieAdjCai && !ctx.touCat('官杀')) return null
  return { name: '正财格', note: '月令正财透根，身可任，比劫紧贴有官杀制' }
}

/**
 * 偏财格（依 md 四条；身强要求**比正财宽松**）：
 *  1. 月令偏财 OR 透+月令藏。
 *  2. 偏财透干通根。
 *  3. 日主身强要求宽松：仅身极弱且无印比帮身时破。
 *  4. 无比劫**紧贴**夺财；若有紧贴比劫，须食伤通关或官杀制之。
 */
export function isPianCaiGe(ctx: Ctx): GejuDraft | null {
  if (!monthGeFormed(ctx, '偏财')) return null
  if (!ctx.tou('偏财')) return null
  if (!ctx.zang('偏财')) return null
  // md: 仅当身极弱 + 无印比帮身才破
  const isExtremelyWeak = ctx.level === '身极弱' || ctx.level === '近从弱'
  if (isExtremelyWeak && ctx.countCat('比劫') + ctx.countCat('印') === 0) return null
  const bijieAdjCai =
    ctx.adjacentTou('劫财', '偏财') || ctx.adjacentTou('比肩', '偏财')
  if (bijieAdjCai && !ctx.touCat('食伤') && !ctx.touCat('官杀')) return null
  return { name: '偏财格', note: '月令偏财透根，身可担，比劫紧贴有食伤/官杀化' }
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
  // md 条件 3: 紧贴财破印，除非比劫隔
  const caiAdjYin =
    ctx.adjacentTou('正财', '正印') || ctx.adjacentTou('偏财', '正印')
  if (caiAdjYin && !ctx.touCat('比劫')) return null
  // md 条件 4: 身极旺 + 无财/食伤泄 → 印闷破
  if (ctx.level === '身极旺' && !ctx.touCat('财') && !ctx.touCat('食伤')) return null
  return { name: '正印格', note: '月令正印透根，无紧贴财破印' }
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
 *  1. 日主阳干。
 *  2. 月令为日主之刃位。
 *  3. 必有官杀制刃（透）。
 *  4. 官杀通根。
 *  5. 若用正官制刃时无伤官克官；若有伤官须有印制。
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
  // md: 用正官制刃时忌伤官 (有印制可解)
  if (ctx.tou('正官') && !ctx.tou('七杀') && ctx.tou('伤官') && !ctx.touCat('印')) return null
  return { name: '阳刃格', note: `月令 ${ctx.monthZhi} 阳刃，官杀透根制之` }
}

/**
 * 魁罡格：日柱为四魁罡 + 身旺 + 原局无财透紧贴日柱。
 * 《三命通会》"身强遇之转荣华，运见财官禄科尽丧"。身弱或财紧贴者破格。
 */
const KUIGANG_FORBIDDEN_WX: Record<string, string> = {
  庚辰: '火', 庚戌: '火', 壬辰: '火', 戊戌: '水',
}
export function isKuiGangGe(ctx: Ctx): GejuDraft | null {
  if (!KUIGANG_DAY.has(ctx.dayGz)) return null
  if (!ctx.shenWang) return null                                // md 条件 2: 身旺
  // md 条件 3: 按日柱分别忌透
  const forbidden = KUIGANG_FORBIDDEN_WX[ctx.dayGz]
  if (forbidden && ctx.touWx(forbidden)) return null
  // md 条件 4: 日支辰/戌互冲
  if (ctx.dayZhi === '辰' && ctx.pillars.some((p, i) => i !== 2 && p.zhi === '戌')) return null
  if (ctx.dayZhi === '戌' && ctx.pillars.some((p, i) => i !== 2 && p.zhi === '辰')) return null
  return { name: '魁罡格', note: `日柱 ${ctx.dayGz} 魁罡 · 身旺 · 无忌透无冲` }
}

/**
 * 壬骑龙背：日柱壬辰 + 再见壬或辰（多壬多辰为贵）+ 辰不被戌冲。
 * 《三命通会》"壬骑龙背，所喜者多壬、多辰"；md 条件 2 要求其他柱再见壬或辰，
 * 仅日柱壬辰降为"一般壬坐辰"不入真格。
 */
export function isRenQiLongBei(ctx: Ctx): GejuDraft | null {
  if (ctx.dayGz !== '壬辰') return null
  // md 条件 2：辰不被戌冲
  const hasXu = ctx.pillars.some((p) => p.zhi === '戌')
  if (hasXu) return null
  // md 条件 3：命局配合——多壬 OR 多辰 OR 金生水 OR 木泄秀
  const otherRen = [ctx.pillars[0], ctx.pillars[1], ctx.pillars[3]]
    .some((p) => p.gan === '壬')
  const otherChen = [ctx.pillars[0].zhi, ctx.pillars[1].zhi, ctx.pillars[3].zhi]
    .includes('辰')
  const hasJin = ctx.touWx('金') || ctx.rootWx('金')
  const hasMu = ctx.touWx('木')
  if (!otherRen && !otherChen && !hasJin && !hasMu) return null
  // md 条件 4：不宜过度火土
  if (ctx.ganWxCount('火') >= 2) return null
  if (ctx.ganWxCount('土') >= 2) return null
  return {
    name: '壬骑龙背',
    note: `日柱壬辰${otherRen ? '+壬' : ''}${otherChen ? '+辰' : ''}${hasJin ? '+金生' : ''}${hasMu ? '+木泄' : ''}`,
  }
}
