import { readBazi } from '../../hooks'
import type { GejuHit } from '../../types'
import { checkZhuanWang } from './_check'

/**
 * 稼穑格 — 戊己土日主专旺。
 *
 * bazi-skills 6 条 (《渊海子平·稼穑格》《三命通会·稼穑》《滴天髓·从象》):
 *  1. 日主为戊 或 己土
 *  2. 月令为土 — 辰、戌、丑、未之一
 *  3. 地支土气遍布 — 辰戌丑未四库俱全(最典型) OR 至少 3 位土
 *  4. 无甲乙木透干克土 — 天干无木透 + 寅卯本气不成势 (藏支中气无碍)
 *  5. 无重水冲土 — 壬癸不多透 (一位有根尚可，二位以上有根则忌); 亥子本气不成势
 *  6. (助力) 金点缀泄秀 → "稼穑毓秀" 复合贵格 — 金多过度泄土则降格
 *
 *  本 detector: 前 5 条必满足 (依赖 _check + 本文件 monthZhi 守卫 + maxCaiTou=1
 *  近似条件 5 控水)；条件 6 命中则挂 guigeVariant = '稼穑毓秀'。
 *
 * 【岁运】md 内容.md "大运走木水 → 破格":
 *   - 大运 / 流年透木 (官杀克土) → 破格 (suiyunBreak)。
 *   - 大运 / 流年走水 (财冲土库) → 破格。
 *   - 破格大运过后才重新稳回。
 *   当前 detector 仅扫主柱土气, 未把岁运木水叠加。
 */
export function isJiaSeGe(): GejuHit | null {
  const bazi = readBazi()
  if (bazi.dayWx !== '土') return null
  if (!['辰', '戌', '丑', '未'].includes(bazi.monthZhi)) return null
  const r = checkZhuanWang('土', 1)
  if (!r) return null
  const jinN = bazi.ganWxCount('金') + bazi.zhiMainWxCount('金')
  const hasJin = jinN > 0
  return {
    name: '稼穑格',
    note: `月令 ${bazi.monthZhi} ; ${r.note}${hasJin ? ` · 金点缀 ${jinN} 位` : ''}`,
    ...(hasJin ? { guigeVariant: '稼穑毓秀' } : {}),
  }
}
