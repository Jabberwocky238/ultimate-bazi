import { readBazi } from '../../hooks'
import type { GejuHit } from '../../types'
import { checkZhuanWang } from './_check'

/**
 * 润下格 — 壬癸水日主专旺。
 *
 * bazi-skills 6 条 (《渊海子平·润下格》《穷通宝鉴·壬水章》《滴天髓·从象》):
 *  1. 日主为壬 或 癸水
 *  2. 地支会成水局 — 申子辰三合 OR 亥子丑三会 (半合勉强成立)
 *  3. 天干多透水 — 日主外另透壬/癸 ≥ 1 位; 庚辛金生水更佳 (源源不绝)
 *  4. 无戊己土透干克水 — 天干无土透 + 辰戌丑未本气不成势 (藏支中气无碍)
 *  5. 无重火蒸水 — 丙丁不多透 (一位无根尚可，微火调候反喜); 巳午本气不成势
 *  6. (助力) 金生不断 / 微木泄秀 → "金白水清" / "水木清华" 复合贵格
 *      木多过度泄水则降格
 *
 *  本 detector: 前 5 条必满足 (依赖 _check, 其中 maxCaiTou = 0 对应严判
 *  条件 5"无重火蒸水"——比 md "一位无根尚可、微火反喜" 略严)；
 *  条件 6 命中则挂 guigeVariant = '润下清华'。
 */
export function isRunXiaGe(): GejuHit | null {
  const bazi = readBazi()
  const r = checkZhuanWang('水')
  if (!r) return null
  const muN = bazi.ganWxCount('木') + bazi.zhiMainWxCount('木')
  const jinN = bazi.ganWxCount('金') + bazi.zhiMainWxCount('金')
  const hasExtra = muN > 0 || jinN > 0
  const tags: string[] = []
  if (muN > 0) tags.push(`木泄秀 ${muN} 位`)
  if (jinN > 0) tags.push(`金生水 ${jinN} 位`)
  return {
    name: '润下格',
    note: `${r.note}${hasExtra ? ` · ${tags.join(' / ')}` : ''}`,
    ...(hasExtra ? { guigeVariant: '润下清华' } : {}),
  }
}
