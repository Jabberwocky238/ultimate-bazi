import type { Ctx } from '../ctx'
import type { GejuDraft } from '../types'

/**
 * 食神制杀（依 md "成立条件"）：
 *  1. 七杀透干通根
 *  2. 食神透干通根
 *  3. 食神与七杀位置相邻
 *  4. 无枭印紧贴克食神（除非财救）
 *  5. 身中至身强
 */
export function isShiShenZhiSha(ctx: Ctx): GejuDraft | null {
  if (!ctx.tou('七杀')) return null
  if (!ctx.zang('七杀')) return null                        // 杀通根
  if (!ctx.tou('食神')) return null
  if (!ctx.zang('食神')) return null                        // 食通根
  if (!ctx.adjacentTou('食神', '七杀')) return null         // 紧贴
  if (ctx.tou('偏印') && ctx.adjacentTou('偏印', '食神') && !ctx.touCat('财')) return null
  if (ctx.shenRuo) return null                               // md: 身中至身强
  return { name: '食神制杀', note: '身非弱 · 食神七杀双透根紧贴，无枭夺食' }
}

/**
 * 枭神夺食：偏印透 + 食神存在 + 无财救 + 无伤官夺命（月令伤官且伤官透干则本格为伤官佩印）。
 * 互斥：月令伤官 + 伤官透干 → 结构为伤官格，偏印作佩印用，不作枭印夺食论。
 */
export function isXiaoShenDuoShi(ctx: Ctx): GejuDraft | null {
  if (!ctx.tou('偏印')) return null
  if (!ctx.has('食神')) return null
  if (ctx.touCat('财')) return null
  if (ctx.mainAt('伤官').includes(1) && ctx.tou('伤官')) return null
  return { name: '枭神夺食', note: '偏印透克食神，无财救' }
}

/** 伤官见官：伤官与正官都透干 + 相邻 + 无印制(印不透)。 */
export function isShangGuanJianGuan(ctx: Ctx): GejuDraft | null {
  if (!ctx.tou('伤官') || !ctx.tou('正官')) return null
  if (!ctx.adjacentTou('伤官', '正官')) return null
  if (ctx.touCat('印')) return null
  if (ctx.touCat('财')) return null
  return { name: '伤官见官', note: '伤官正官紧贴且无救' }
}

/**
 * 伤官合杀：日主为阴干 + 伤官与七杀**都透干** + 位置紧贴 + **无争合**。
 * 《渊海子平》：五合只在天干，阳干无此结构。
 * 《滴天髓·通神论》"合之力以紧贴为真"。md 明文："无争合"——伤官或七杀再现一位即破。
 */
export function isShangGuanHeSha(ctx: Ctx): GejuDraft | null {
  if (ctx.dayYang) return null
  if (!ctx.tou('伤官') || !ctx.tou('七杀')) return null
  if (!ctx.adjacentTou('伤官', '七杀')) return null
  const shangN = ctx.pillars.filter((p, i) => i !== 2 && p.shishen === '伤官').length
  const shaN = ctx.pillars.filter((p, i) => i !== 2 && p.shishen === '七杀').length
  if (shangN > 1 || shaN > 1) return null
  return { name: '伤官合杀', note: `阴日主 ${ctx.dayGan} 伤官七杀紧贴双透五合，无争合` }
}

/**
 * 伤官生财：身强 + 伤官透通根 + 财通根紧贴 + 印不透(以免克伤) + 无正官紧贴。
 * md 明文："身强才能用伤官生财 —— 身弱转入伤官佩印"；"原局无正官紧贴"。
 */
export function isShangGuanShengCai(ctx: Ctx): GejuDraft | null {
  if (!ctx.tou('伤官')) return null
  if (!ctx.strongCat('财')) return null
  if (ctx.touCat('印')) return null
  if (!ctx.shenWang) return null                              // md: 必身强
  if (ctx.tou('正官') && ctx.adjacentTou('伤官', '正官')) return null
  return { name: '伤官生财', note: '身强 · 伤官透生财 · 无印阻无官紧贴' }
}

/**
 * 伤官佩印：伤官透干通根 + 印透干通根 + **身弱**（专为身弱用印） + 财不透破印。
 * 《子平真诠》"伤官用印，身弱有力"。身旺用财，身弱用印 —— 这里限身弱。
 */
export function isShangGuanPeiYin(ctx: Ctx): GejuDraft | null {
  if (!ctx.tou('伤官')) return null
  if (!ctx.zang('伤官')) return null                 // 伤官通根
  if (!ctx.touCat('印')) return null
  if (ctx.touCat('财')) return null                  // 财透破印
  if (ctx.shenWang) return null                      // 身旺则不用印而应用财
  return { name: '伤官佩印', note: '身弱伤官透，印透制伤化气' }
}

/** 食伤混杂：食神与伤官同时透干。 */
export function isShiShangHunZa(ctx: Ctx): GejuDraft | null {
  if (!(ctx.tou('食神') && ctx.tou('伤官'))) return null
  return { name: '食伤混杂', note: '食神伤官双透' }
}

/** 食伤泄秀：身旺 + 食伤透干 + 无偏印透(避免夺食)。 */
export function isShiShangXieXiu(ctx: Ctx): GejuDraft | null {
  if (!ctx.shenWang) return null
  if (!(ctx.tou('食神') || ctx.tou('伤官'))) return null
  if (ctx.tou('偏印')) return null
  return { name: '食伤泄秀', note: '身旺见食伤透泄秀' }
}
