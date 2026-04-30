/**
 * 合盘 - 喜用神匹配 (核心算法之一).
 *
 *  双方各算 SideXiyong, 然后:
 *    aPrimaryFromB = B 给 A 提供"用神五行" 多少位 (干 + 地支本气)
 *    bPrimaryFromA = A 给 B 提供"用神五行" 多少位
 *    aAvoidFromB   = B 带给 A 多少 "忌神五行"
 *    aTiaohouFromB = (若 A 调候硬约束) B 提供调候五行多少位
 *
 *  scoreMatch 综合上述指标输出 0-100 的合度分.
 */
import { ganWuxing, zhiWuxing, type WuXing } from '@jabberwocky238/bazi-engine'
import type { Pillar } from '../store'
import type { XiyongAnalysis } from '../xiyong'

/**
 * 统计某 Pillar[] 中天干 + 地支本气 中各五行的出现位数 (不含藏中/余气).
 */
export function wxDistribution(pillars: Pillar[]): Record<WuXing, number> {
  const cnt: Record<WuXing, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 }
  for (const p of pillars) {
    const gw = ganWuxing(p.gan) as WuXing | undefined
    if (gw) cnt[gw] += 1
    const zw = zhiWuxing(p.zhi) as WuXing | undefined
    if (zw) cnt[zw] += 1
  }
  return cnt
}

/** 一方对另一方"贡献"指定五行的位数 (干 + 地支本气). */
export function wxSupply(provider: Pillar[], target: WuXing): number {
  return wxDistribution(provider)[target] ?? 0
}

/** 双向用神供给 / 调候补足 / 忌神冲撞 数据. */
export interface XiyongMatch {
  /** A 喜用 B 提供位数 */
  aPrimaryFromB: number
  aSecondaryFromB: number
  bPrimaryFromA: number
  bSecondaryFromA: number
  /** A 忌神 B 提供位数 (>0 即有损) */
  aAvoidFromB: number
  bAvoidFromA: number
  /** A 调候用神 B 提供位数 (仅 A 调候硬约束才有意义) */
  aTiaohouFromB: number
  bTiaohouFromA: number
}

export function computeXiyongMatch(
  aPillars: Pillar[], aXy: XiyongAnalysis | null,
  bPillars: Pillar[], bXy: XiyongAnalysis | null,
): XiyongMatch {
  const safeSupply = (provider: Pillar[], wx: WuXing | null) =>
    wx ? wxSupply(provider, wx) : 0
  const sumAvoid = (provider: Pillar[], wxs: WuXing[]) =>
    wxs.reduce((s, w) => s + wxSupply(provider, w), 0)
  return {
    aPrimaryFromB:   safeSupply(bPillars, aXy?.primaryWx ?? null),
    aSecondaryFromB: safeSupply(bPillars, aXy?.secondaryWx ?? null),
    bPrimaryFromA:   safeSupply(aPillars, bXy?.primaryWx ?? null),
    bSecondaryFromA: safeSupply(aPillars, bXy?.secondaryWx ?? null),
    aAvoidFromB:     sumAvoid(bPillars, aXy?.avoidWx ?? []),
    bAvoidFromA:     sumAvoid(aPillars, bXy?.avoidWx ?? []),
    aTiaohouFromB:   aXy?.tiaohou.required ? safeSupply(bPillars, aXy.tiaohou.wx) : 0,
    bTiaohouFromA:   bXy?.tiaohou.required ? safeSupply(aPillars, bXy.tiaohou.wx) : 0,
  }
}

/**
 * 综合评分 (粗略, 0-100):
 *   50 (基线)
 *   + 双向用神供给 (主用神 ×12 / 喜神 ×6)
 *   + 调候补足 (×8)
 *   - 忌神冲撞 (×4)
 */
export function scoreMatch(m: XiyongMatch): number {
  const supply = m.aPrimaryFromB * 12 + m.aSecondaryFromB * 6
              + m.bPrimaryFromA * 12 + m.bSecondaryFromA * 6
  const tiao = m.aTiaohouFromB * 8 + m.bTiaohouFromA * 8
  const avoid = m.aAvoidFromB * 4 + m.bAvoidFromA * 4
  const raw = 50 + supply + tiao - avoid
  return Math.max(0, Math.min(100, Math.round(raw)))
}
