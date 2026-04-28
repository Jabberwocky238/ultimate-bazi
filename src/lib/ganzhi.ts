/**
 * 合冲刑害 · extras (大运/流年/流月) 引化分析。
 *
 * 引擎 analyzeGanZhi 只接 4 主柱 (POS_NAMES 硬编码)。本层在引擎结果之
 * 上叠加岁运扫描：
 *   1. 列出 extras × 4 主柱两两的合/冲/刑/害/破/克 (extra 字段)。
 *   2. 标记原局冲突被 extras 引化 —— 当 extras 与冲突参与方组成
 *      六合 / 半三合 时视为合解 (dissolved)。三合三会需三柱齐到，
 *      此层未做整体合局判断。
 */
import {
  analyzeGanZhi,
  ganWuxing,
  type Pillar as EnginePillar,
  type Finding,
  type FindingKind,
  type GanZhiAnalysis,
  type Gan,
  type WuXing,
} from '@jabberwocky238/bazi-engine'
import type { Pillar } from './store'
import { CHONG_PAIR } from './shared'

// ————————————————————————————————————————————————————————
// 关系表（extras 与主柱两两关系所需）
// ————————————————————————————————————————————————————————

const LIU_HE_PARTNER: Record<string, string> = {
  子: '丑', 丑: '子', 寅: '亥', 亥: '寅',
  卯: '戌', 戌: '卯', 辰: '酉', 酉: '辰',
  巳: '申', 申: '巳', 午: '未', 未: '午',
}
const LIU_HE_WX: Record<string, string> = {
  子丑: '土', 寅亥: '木', 卯戌: '火',
  辰酉: '金', 巳申: '水', 午未: '土',
}
const LIU_HAI: Record<string, string> = {
  子: '未', 未: '子', 丑: '午', 午: '丑',
  寅: '巳', 巳: '寅', 卯: '辰', 辰: '卯',
  申: '亥', 亥: '申', 酉: '戌', 戌: '酉',
}
const LIU_PO: Record<string, string> = {
  子: '酉', 酉: '子', 卯: '午', 午: '卯',
  寅: '亥', 亥: '寅', 巳: '申', 申: '巳',
  辰: '丑', 丑: '辰', 戌: '未', 未: '戌',
}
const SAN_HE_GROUPS: { zhis: Set<string>; wx: WuXing }[] = [
  { zhis: new Set(['申','子','辰']), wx: '水' },
  { zhis: new Set(['亥','卯','未']), wx: '木' },
  { zhis: new Set(['寅','午','戌']), wx: '火' },
  { zhis: new Set(['巳','酉','丑']), wx: '金' },
]
const SAN_HUI_GROUPS: { zhis: Set<string>; wx: WuXing }[] = [
  { zhis: new Set(['寅','卯','辰']), wx: '木' },
  { zhis: new Set(['巳','午','未']), wx: '火' },
  { zhis: new Set(['申','酉','戌']), wx: '金' },
  { zhis: new Set(['亥','子','丑']), wx: '水' },
]
const SANXING_GROUPS: Set<string>[] = [
  new Set(['寅','巳','申']),
  new Set(['丑','戌','未']),
]
const ZIXING_SET = new Set(['辰','午','酉','亥'])
const ZIKAO: Record<string, string> = { 子: '卯', 卯: '子' }
const TIAN_HE: Record<string, [string, WuXing]> = {
  甲: ['己','土'], 己: ['甲','土'],
  乙: ['庚','金'], 庚: ['乙','金'],
  丙: ['辛','水'], 辛: ['丙','水'],
  丁: ['壬','木'], 壬: ['丁','木'],
  戊: ['癸','火'], 癸: ['戊','火'],
}
const KE_NEXT: Record<WuXing, WuXing> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' }
const POS_LABELS = ['年','月','日','时'] as const
type PosLabel = typeof POS_LABELS[number]

// ————————————————————————————————————————————————————————
// 类型
// ————————————————————————————————————————————————————————

export type ExtraSourceLabel = '大运' | '流年' | '流月'

export interface ExtraGanZhiInput {
  label: ExtraSourceLabel
  gan: string
  zhi: string
  /** 干支字符串，如 "甲子"。 */
  gz: string
}

export type ExtraInteractionKind =
  | '六合' | '半三合' | '半三会'
  | '六冲' | '六害' | '六破' | '相刑' | '自刑'
  | '天干五合' | '天干相克'

export interface ExtraInteraction {
  kind: ExtraInteractionKind
  source: { label: ExtraSourceLabel; gz: string }
  /** 与命局哪柱关联。 */
  target: PosLabel
  targetGz: string
  /** 化气五行（合的产物；冲/刑无）。 */
  huaWx?: WuXing
  note: string
}

export interface DissolvedMark {
  /** 原 finding 的 kind，用于显示分类。 */
  kind: FindingKind
  /** 原 finding 的 name，用于在 UI 中匹配。 */
  name: string
  /** 由谁引化。 */
  by: { label: ExtraSourceLabel; gz: string; via: string }
}

export interface GanZhiWithExtras {
  base: GanZhiAnalysis
  /** extras 引入的新合冲刑害关系（按 source/target 两两）。 */
  extra: ExtraInteraction[]
  /** 原局冲/刑/害/破/克被 extras 引化（按 base finding.name 匹配）。 */
  dissolved: DissolvedMark[]
}

// ————————————————————————————————————————————————————————
// 两两查表
// ————————————————————————————————————————————————————————

function checkZhiPair(a: string, b: string):
  | { kind: ExtraInteractionKind; huaWx?: WuXing; note: string }
  | null {
  if (a === b && ZIXING_SET.has(a)) return { kind: '自刑', note: `${a}${b}自刑` }
  if (LIU_HE_PARTNER[a] === b) {
    const huaWx = (LIU_HE_WX[`${a}${b}`] ?? LIU_HE_WX[`${b}${a}`]) as WuXing | undefined
    return { kind: '六合', huaWx, note: `${a}${b}六合${huaWx ?? ''}` }
  }
  if (CHONG_PAIR[a] === b) return { kind: '六冲', note: `${a}${b}相冲` }
  if (LIU_HAI[a] === b) return { kind: '六害', note: `${a}${b}相害` }
  if (LIU_PO[a] === b) return { kind: '六破', note: `${a}${b}相破` }
  if (ZIKAO[a] === b) return { kind: '相刑', note: `${a}${b}相刑` }
  for (const sx of SANXING_GROUPS) {
    if (sx.has(a) && sx.has(b) && a !== b) return { kind: '相刑', note: `${a}${b}相刑` }
  }
  for (const sh of SAN_HE_GROUPS) {
    if (sh.zhis.has(a) && sh.zhis.has(b) && a !== b) {
      return { kind: '半三合', huaWx: sh.wx, note: `${a}${b}半三合${sh.wx}` }
    }
  }
  for (const sh of SAN_HUI_GROUPS) {
    if (sh.zhis.has(a) && sh.zhis.has(b) && a !== b) {
      return { kind: '半三会', huaWx: sh.wx, note: `${a}${b}半三会${sh.wx}` }
    }
  }
  return null
}

function checkGanPair(a: string, b: string):
  | { kind: ExtraInteractionKind; huaWx?: WuXing; note: string }
  | null {
  const he = TIAN_HE[a]
  if (he && he[0] === b) return { kind: '天干五合', huaWx: he[1], note: `${a}${b}合化${he[1]}` }
  const aWx = ganWuxing(a as Gan) as WuXing | undefined
  const bWx = ganWuxing(b as Gan) as WuXing | undefined
  if (aWx && bWx) {
    if (KE_NEXT[aWx] === bWx) return { kind: '天干相克', note: `${a}克${b}` }
    if (KE_NEXT[bWx] === aWx) return { kind: '天干相克', note: `${b}克${a}` }
  }
  return null
}

// ————————————————————————————————————————————————————————
// 主入口
// ————————————————————————————————————————————————————————

const CONFLICT_KINDS: FindingKind[] = [
  '天干相冲', '天干相克',
  '地支相冲', '地支相刑', '地支相害', '地支相破',
]

/** 扫描 extras × 主柱两两关系，得出 extra 列表。 */
function scanExtras(pillars: Pillar[], extras: ExtraGanZhiInput[]): ExtraInteraction[] {
  const out: ExtraInteraction[] = []
  for (const e of extras) {
    for (let i = 0; i < pillars.length && i < 4; i++) {
      const p = pillars[i]
      if (!p?.gan || !p?.zhi) continue
      const g = checkGanPair(e.gan, p.gan)
      if (g) out.push({
        kind: g.kind, source: { label: e.label, gz: e.gz },
        target: POS_LABELS[i], targetGz: `${p.gan}${p.zhi}`,
        huaWx: g.huaWx, note: g.note,
      })
      const z = checkZhiPair(e.zhi, p.zhi)
      if (z) out.push({
        kind: z.kind, source: { label: e.label, gz: e.gz },
        target: POS_LABELS[i], targetGz: `${p.gan}${p.zhi}`,
        huaWx: z.huaWx, note: z.note,
      })
    }
  }
  return out
}

/** 检查每条原局冲突，是否被 extras 拉去合 → dissolved。 */
function scanDissolved(
  pillars: Pillar[],
  extras: ExtraGanZhiInput[],
  base: GanZhiAnalysis,
): DissolvedMark[] {
  const out: DissolvedMark[] = []
  for (const k of CONFLICT_KINDS) {
    const list = base[k as keyof GanZhiAnalysis] as Finding[] | undefined
    if (!list) continue
    for (const f of list) {
      const idxs: number[] = []
      for (const ch of f.positions) {
        const i = POS_LABELS.indexOf(ch as PosLabel)
        if (i >= 0) idxs.push(i)
      }
      const zhis = new Set<string>()
      const gans = new Set<string>()
      for (const i of idxs) {
        const p = pillars[i]
        if (p?.zhi) zhis.add(p.zhi)
        if (p?.gan) gans.add(p.gan)
      }
      for (const e of extras) {
        const via = findDissolveVia(k, e, zhis, gans)
        if (via) out.push({ kind: k, name: f.name, by: { label: e.label, gz: e.gz, via } })
      }
    }
  }
  return out
}

function findDissolveVia(
  kind: FindingKind,
  e: ExtraGanZhiInput,
  zhis: Set<string>,
  gans: Set<string>,
): string | null {
  if (kind.startsWith('地支')) {
    for (const z of zhis) {
      if (LIU_HE_PARTNER[e.zhi] === z) {
        const w = LIU_HE_WX[`${e.zhi}${z}`] ?? LIU_HE_WX[`${z}${e.zhi}`] ?? ''
        return `${e.zhi}${z}六合${w}`
      }
      for (const sh of SAN_HE_GROUPS) {
        if (sh.zhis.has(e.zhi) && sh.zhis.has(z) && e.zhi !== z) {
          return `${e.zhi}${z}半三合${sh.wx}`
        }
      }
    }
  }
  if (kind.startsWith('天干')) {
    for (const g of gans) {
      const he = TIAN_HE[e.gan]
      if (he && he[0] === g) return `${e.gan}${g}合化${he[1]}`
    }
  }
  return null
}

export function analyzeGanZhiWithExtras(
  pillars: Pillar[],
  extras: ExtraGanZhiInput[],
): GanZhiWithExtras | null {
  const base = analyzeGanZhi(pillars as EnginePillar[])
  if (!base) return null
  return {
    base,
    extra: scanExtras(pillars, extras),
    dissolved: scanDissolved(pillars, extras, base),
  }
}
