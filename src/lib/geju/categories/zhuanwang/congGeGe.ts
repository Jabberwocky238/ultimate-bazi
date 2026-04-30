import { readBazi } from '../../hooks'
import type { GejuHit } from '../../types'
import { checkZhuanWang } from './_check'

/**
 * 从革格 — 庚辛金日主专旺。
 *
 * bazi-skills 6 条 (《渊海子平·从革格》《穷通宝鉴·庚金章》《滴天髓·从象》):
 *  1. 日主为庚 或 辛金
 *  2. 地支会成金局 — 巳酉丑三合 OR 申酉戌三会 (半合勉强成立)
 *  3. 天干多透金 — 日主外另透庚/辛 ≥ 1 位; 戊己土生金更佳 (土生金助势)
 *  4. 无丙丁火透干熔金 — 天干无火透 + 巳午本气不成势
 *  5. 无甲乙木过重对抗 — 木为金之财, 一位无根尚可; 寅卯本气不成势
 *  6. (助力) 水秀气 → "金白水清" 复合贵格 (《穷通宝鉴》"庚金逢壬水")
 *      水多过度泄金则降格
 *
 *  本 detector: 前 5 条必满足 (依赖 _check, 其中 maxCaiTou = 0 对应严判
 *  条件 5"无木对抗"——比 md 略严)；条件 6 命中则挂 guigeVariant。
 *
 *  注意: md 明确称该贵格为"金白水清"，本代码字段 guigeVariant 写为
 *  "剑如秋水" 与 md 不同名。
 */
export function isCongGeGe(): GejuHit | null {
  const bazi = readBazi()
  const r = checkZhuanWang('金')
  if (!r) return null
  const shuiN = bazi.ganWxCount('水') + bazi.zhiMainWxCount('水')
  const hasShui = shuiN > 0
  return {
    name: '从革格',
    note: `${r.note}${hasShui ? ` · 水泄秀 ${shuiN} 位` : ''}`,
    ...(hasShui ? { guigeVariant: '剑如秋水' } : {}),
  }
}
