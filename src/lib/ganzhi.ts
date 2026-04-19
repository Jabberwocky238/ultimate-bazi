/**
 * 天干地支作用定性分析 —— 严格依据：
 *   - bazi-skills/core/天干地支/合/{天干五合,地支六合,地支三合,半三合,地支拱合,争合,妒合,地支暗合,相害}.md
 *   - bazi-skills/core/天干地支/会/{地支三会,会总论}.md
 *   - bazi-skills/core/天干地支/冲/{天干相冲,地支相冲总论,子午冲}.md
 *   - bazi-skills/core/天干地支/克/{天干相克,地支相破相绝}.md
 *   - bazi-skills/core/天干地支/刑/{地支相刑总论,丑未戌三刑,寅巳申三刑,子卯刑,自刑}.md
 *   - bazi-skills/core/天干地支/墓库/{墓库总论,开库,闭库,出库}.md
 *
 * 定性分析 —— 不加权打分；按 md 判定"成立 / 合绊 / 化 / 紧贴 / 隔位"等状态。
 * 合冲刑害同时发生时的优先级裁断 md 明文提示需人工再审。
 */

import type { Pillar } from './store'
import { ganWuxing, zhiWuxing } from './wuxing'

export type Pos = '年' | '月' | '日' | '时'
const POS_NAMES: Pos[] = ['年', '月', '日', '时']

/** 紧贴 = 相邻位（差 1）*/
function adjacent(i: number, j: number): boolean {
  return Math.abs(i - j) === 1
}
function posRange(idxs: number[]): string {
  return idxs.map((i) => POS_NAMES[i]).join('')
}

// ————————————————————————————————————————————————————————
// 基础对照表（全部来自 md 原文）
// ————————————————————————————————————————————————————————

/** 天干五合：[gan1, gan2, 化气五行] */
const WUHE: Array<[string, string, string, string]> = [
  ['甲', '己', '土', '中正之合'],
  ['乙', '庚', '金', '仁义之合'],
  ['丙', '辛', '水', '威制之合'],
  ['丁', '壬', '木', '淫昵之合'],
  ['戊', '癸', '火', '无情之合'],
]

/** 天干相冲：4 组 (戊己不冲) */
const GAN_CHONG: Array<[string, string]> = [
  ['甲', '庚'], ['乙', '辛'], ['丙', '壬'], ['丁', '癸'],
]

/** 地支六合：[zhi1, zhi2, 化气, 别名] */
const LIUHE: Array<[string, string, string, string]> = [
  ['子', '丑', '土', '泥合'],
  ['寅', '亥', '木', '破合'],
  ['卯', '戌', '火', '淫合'],
  ['辰', '酉', '金', '荣合'],
  ['巳', '申', '水', '贤合'],
  ['午', '未', '火土', '和合'],
]

/** 地支三合：[长生, 帝旺, 墓库, 化气] */
const SANHE: Array<[string, string, string, string]> = [
  ['亥', '卯', '未', '木'],
  ['寅', '午', '戌', '火'],
  ['巳', '酉', '丑', '金'],
  ['申', '子', '辰', '水'],
]

/** 地支三会：[三支, 化气, 方位] */
const SANHUI: Array<[string[], string, string]> = [
  [['寅', '卯', '辰'], '木', '东方'],
  [['巳', '午', '未'], '火', '南方'],
  [['申', '酉', '戌'], '金', '西方'],
  [['亥', '子', '丑'], '水', '北方'],
]

/** 地支六冲 */
const ZHI_CHONG: Array<[string, string]> = [
  ['子', '午'], ['卯', '酉'], ['寅', '申'], ['巳', '亥'], ['辰', '戌'], ['丑', '未'],
]

/** 六害 (穿) */
const LIUHAI: Array<[string, string, string]> = [
  ['子', '未', '世家之害'],
  ['丑', '午', '官鬼相害'],
  ['寅', '巳', '两强相害'],
  ['申', '亥', '争嗔之害'],
  ['卯', '辰', '欺凌之害'],
  ['酉', '戌', '嫉妒之害'],
]

/** 六破 */
const LIUPO: Array<[string, string, string]> = [
  ['子', '酉', '四帝旺之破'],
  ['卯', '午', '四帝旺之破'],
  ['寅', '亥', '四长生之破'],
  ['巳', '申', '四长生之破'],
  ['辰', '丑', '四墓库之破'],
  ['未', '戌', '四墓库之破'],
]

/** 相绝 (四组) */
const XIANGJUE: Array<[string, string, string]> = [
  ['寅', '酉', '金克木'],
  ['卯', '申', '金克木'],
  ['子', '巳', '火绝'],
  ['午', '亥', '合绝'],
]

/** 自刑 */
const ZIXING = new Set(['辰', '午', '酉', '亥'])

/** 墓库 */
const MUKU: Record<string, { benqi: string; zhongqi: string; muqi: string; muqiWx: string; name: string }> = {
  辰: { benqi: '戊', zhongqi: '乙', muqi: '癸', muqiWx: '水', name: '水库' },
  未: { benqi: '己', zhongqi: '丁', muqi: '乙', muqiWx: '木', name: '木库' },
  戌: { benqi: '戊', zhongqi: '辛', muqi: '丁', muqiWx: '火', name: '火库' },
  丑: { benqi: '己', zhongqi: '癸', muqi: '辛', muqiWx: '金', name: '金库' },
}

/** 日主对应墓库运（墓库总论.md） */
// const RIZHU_MU: Record<string, string> = {
//   甲: '未', 乙: '未',
//   丙: '戌', 丁: '戌',
//   戊: '戌', 己: '戌',
//   庚: '丑', 辛: '丑',
//   壬: '辰', 癸: '辰',
// }

/** 天干冲开天库 (开库.md)：丁癸→辰戌; 乙辛→未丑 */
const TIAN_CHONG_OPEN: Record<string, string[]> = {
  '丁癸': ['辰', '戌'],
  '乙辛': ['未', '丑'],
}
/** 天干合闭天库 (闭库.md) */
const TIAN_HE_CLOSE: Record<string, string> = {
  '戊癸': '辰', '乙庚': '未', '丁壬': '戌', '丙辛': '丑',
}

// ————————————————————————————————————————————————————————
// Finding 结构
// ————————————————————————————————————————————————————————

export type FindingKind =
  | '天干五合' | '天干相冲' | '天干相克'
  | '地支六合' | '地支三合' | '半三合' | '拱合' | '地支三会'
  | '地支六冲' | '地支三刑' | '自刑'
  | '地支相害' | '地支相破' | '地支相绝'
  | '墓库' | '争合' | '妒合'

export type FindingQuality = 'good' | 'bad' | 'neutral'

export interface Finding {
  kind: FindingKind
  name: string               // 如 "甲己合" / "子午冲" / "寅午戌 火局" / "丑未戌 三刑"
  positions: string          // 位置组合，如 "年月"
  close: boolean             // 是否紧贴（所有柱差 ≤ 1）
  transformed?: boolean      // 合 / 三合化气是否成立
  state: string              // 状态文字："化火"/"合绊"/"实冲"/"拱出午火"/"开库"
  note: string               // 补充说明
  mdKey?: string             // SkillLink category=jichu 的 name
  quality: FindingQuality    // 一般定性（非打分）
}

// ————————————————————————————————————————————————————————
// 辅助：索引天干 / 地支位置
// ————————————————————————————————————————————————————————

interface GanSlot { pos: number; gan: string }
interface ZhiSlot { pos: number; zhi: string }

function collectGans(pillars: Pillar[]): GanSlot[] {
  return pillars.map((p, i) => ({ pos: i, gan: p.gan })).filter((x) => x.gan)
}
function collectZhis(pillars: Pillar[]): ZhiSlot[] {
  return pillars.map((p, i) => ({ pos: i, zhi: p.zhi })).filter((x) => x.zhi)
}

/** 天干透出某五行？（任一柱天干五行匹配） */
function isGanTou(pillars: Pillar[], wx: string): boolean {
  return pillars.some((p) => ganWuxing(p.gan) === wx)
}

/** 某柱地支五行 (或化气五行) */
function zhiWxAt(p: Pillar): string { return zhiWuxing(p.zhi) }

// ————————————————————————————————————————————————————————
// 天干五合
// ————————————————————————————————————————————————————————

function detectTianganHe(pillars: Pillar[]): Finding[] {
  const out: Finding[] = []
  const gans = collectGans(pillars)
  for (const [g1, g2, hua, qing] of WUHE) {
    const m1 = gans.filter((g) => g.gan === g1)
    const m2 = gans.filter((g) => g.gan === g2)
    if (m1.length === 0 || m2.length === 0) continue
    // 争合：两个相同天干同合一个
    if (m1.length >= 2 && m2.length >= 1) {
      out.push({
        kind: '争合', name: `争合 ${g1}${g1}${g2}`,
        positions: [...m1, ...m2].sort((a, b) => a.pos - b.pos).map((s) => POS_NAMES[s.pos]).join(''),
        close: false, state: '力涣不专', note: '两个相同天干争合一字 —— 感情纠葛、合作拆散、财来财去',
        mdKey: '争合', quality: 'bad',
      })
      continue
    }
    if (m2.length >= 2 && m1.length >= 1) {
      out.push({
        kind: '争合', name: `争合 ${g2}${g2}${g1}`,
        positions: [...m2, ...m1].sort((a, b) => a.pos - b.pos).map((s) => POS_NAMES[s.pos]).join(''),
        close: false, state: '力涣不专', note: '两个相同天干争合一字 —— 感情纠葛、合作拆散、财来财去',
        mdKey: '争合', quality: 'bad',
      })
      continue
    }
    // 基本合：取距离最近的一对
    const pair = m1.flatMap((a) => m2.map((b) => ({ a, b, gap: Math.abs(a.pos - b.pos) }))).sort((x, y) => x.gap - y.gap)[0]
    const close = adjacent(pair.a.pos, pair.b.pos)
    // 合化条件：紧贴 + (化气五行 == 某柱地支五行 / 月令地支五行 / 能生化气)
    const huaSingle = hua.includes('土') ? '土' : hua.includes('金') ? '金' : hua.includes('水') ? '水' : hua.includes('木') ? '木' : '火'
    let canHua = false
    if (close) {
      // 同住地支 (pair 两柱地支)
      const zwA = zhiWxAt(pillars[pair.a.pos])
      const zwB = zhiWxAt(pillars[pair.b.pos])
      // 月令地支
      const zwM = zhiWxAt(pillars[1])
      const supports = (zw: string) => zw === huaSingle || generates(zw, huaSingle)
      canHua = supports(zwA) || supports(zwB) || supports(zwM)
    }
    out.push({
      kind: '天干五合',
      name: `${g1}${g2} 合`,
      positions: posRange([pair.a.pos, pair.b.pos].sort()),
      close,
      transformed: canHua,
      state: canHua ? `化${huaSingle}` : close ? '合绊' : '远合 (隔位)',
      note: canHua
        ? `${qing} · 地支 / 月令 引化，合化成 ${huaSingle}`
        : close
          ? `${qing} · 紧贴相合但地支不引化，贪合忘克、两干力减`
          : `${qing} · 隔位虚合，作用微弱`,
      mdKey: undefined,
      quality: canHua ? 'neutral' : close ? 'neutral' : 'neutral',
    })
  }
  return out
}

function generates(from: string, to: string): boolean {
  const gen: Record<string, string> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }
  return gen[from] === to
}

// ————————————————————————————————————————————————————————
// 天干相冲 / 相克
// ————————————————————————————————————————————————————————

function detectTianganChong(pillars: Pillar[]): Finding[] {
  const out: Finding[] = []
  const gans = collectGans(pillars)
  for (const [g1, g2] of GAN_CHONG) {
    const A = gans.filter((g) => g.gan === g1)
    const B = gans.filter((g) => g.gan === g2)
    for (const a of A) for (const b of B) {
      const close = adjacent(a.pos, b.pos)
      out.push({
        kind: '天干相冲',
        name: `${g1}${g2} 冲`,
        positions: posRange([a.pos, b.pos].sort()),
        close,
        state: close ? '紧冲' : '隔冲',
        note: `天干相冲 —— ${close ? '紧贴力大，突发变化' : '隔位力弱，作用渐进'}；冲忌为吉，冲用为凶`,
        mdKey: undefined,
        quality: 'bad',
      })
    }
  }
  return out
}

function detectTianganKe(pillars: Pillar[]): Finding[] {
  // 仅列"无情之克" (同性相克)；有情之克即五合已列
  const out: Finding[] = []
  const WUQING: Array<[string, string]> = [
    ['甲', '戊'], ['乙', '己'],
    ['丙', '庚'], ['丁', '辛'],
    ['戊', '壬'], ['己', '癸'],
    ['庚', '甲'], ['辛', '乙'],
    ['壬', '丙'], ['癸', '丁'],
  ]
  const gans = collectGans(pillars)
  const seen = new Set<string>()
  for (const [g1, g2] of WUQING) {
    const A = gans.filter((g) => g.gan === g1)
    const B = gans.filter((g) => g.gan === g2)
    for (const a of A) for (const b of B) {
      if (!adjacent(a.pos, b.pos)) continue   // 无情之克需紧贴才论
      const key = [a.pos, b.pos].sort().join('-') + `:${g1}${g2}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({
        kind: '天干相克',
        name: `${g1}${g2} 克`,
        positions: posRange([a.pos, b.pos].sort()),
        close: true,
        state: '无情之克',
        note: '同性相克，刚烈冷酷、难调和',
        quality: 'bad',
      })
    }
  }
  return out
}

// ————————————————————————————————————————————————————————
// 地支六合
// ————————————————————————————————————————————————————————

function detectDizhiLiuhe(pillars: Pillar[]): Finding[] {
  const out: Finding[] = []
  const zhis = collectZhis(pillars)
  for (const [z1, z2, hua, alias] of LIUHE) {
    const A = zhis.filter((z) => z.zhi === z1)
    const B = zhis.filter((z) => z.zhi === z2)
    for (const a of A) for (const b of B) {
      const close = adjacent(a.pos, b.pos)
      const targetWx = hua.split('').filter((c) => ['木', '火', '土', '金', '水'].includes(c))
      const canHua = close && targetWx.some((w) => isGanTou(pillars, w))
      out.push({
        kind: '地支六合',
        name: `${z1}${z2} 合`,
        positions: posRange([a.pos, b.pos].sort()),
        close,
        transformed: canHua,
        state: canHua ? `化${hua}` : close ? '合绊' : '远合',
        note: `${alias} · ${canHua ? '天干透化气，合化成立' : close ? '紧贴合绊但天干无引化' : '隔位虚合'}`,
        quality: 'neutral',
      })
    }
  }
  return out
}

// ————————————————————————————————————————————————————————
// 地支三合 / 半三合 / 拱合
// ————————————————————————————————————————————————————————

function detectDizhiSanhe(pillars: Pillar[]): Finding[] {
  const out: Finding[] = []
  const zhiSet = pillars.map((p) => p.zhi)
  for (const [a, b, c, hua] of SANHE) {
    const iA = zhiSet.indexOf(a)
    const iB = zhiSet.indexOf(b)
    const iC = zhiSet.indexOf(c)
    const have = [iA >= 0, iB >= 0, iC >= 0]
    const count = have.filter(Boolean).length
    if (count === 3) {
      const pos = [iA, iB, iC].sort((x, y) => x - y)
      const close = adjacent(pos[0], pos[1]) && adjacent(pos[1], pos[2])
      const zhongqiAtMonth = iB === 1  // 中神占月令
      const canHua = zhongqiAtMonth && isGanTou(pillars, hua)
      out.push({
        kind: '地支三合',
        name: `${a}${b}${c} ${hua}局`,
        positions: posRange(pos),
        close,
        transformed: canHua,
        state: canHua ? `化${hua}` : '三合成局 (未化气)',
        note: canHua
          ? '中神占月令且天干透化气 → 真三合，气势磅礴'
          : !zhongqiAtMonth
            ? `中神 ${b} 未占月令，合而不化`
            : `天干无 ${hua} 透出，合而不化`,
        quality: 'neutral',
      })
    } else if (count === 2) {
      // 半三合 / 拱合
      const positions: number[] = []
      if (iA >= 0) positions.push(iA)
      if (iB >= 0) positions.push(iB)
      if (iC >= 0) positions.push(iC)
      positions.sort((x, y) => x - y)
      const close = adjacent(positions[0], positions[1])
      // 半三合 = 含中神；拱合 = 长生+墓 (缺中神)
      if (iB >= 0) {
        // 含中神 → 半三合
        const kind = iA >= 0 ? '生地半合' : '墓地半合'
        const canHua = close && isGanTou(pillars, hua)
        out.push({
          kind: '半三合',
          name: `${iA >= 0 ? a : c}${b} ${kind}`,
          positions: posRange(positions),
          close,
          transformed: canHua,
          state: canHua ? `化${hua}` : close ? '半合' : '远半合',
          note: `${hua}局${kind}${canHua ? '，天干透化气' : close ? '，待补 ' + (iA >= 0 ? c : a) : '，位置较远'}`,
          quality: 'neutral',
        })
      } else if (iA >= 0 && iC >= 0) {
        // 拱合 = 长生 + 墓 缺中神
        const YIN_GAN: Record<string, string> = { 木: '乙', 火: '丁', 金: '辛', 水: '癸' }
        const needGan = YIN_GAN[hua]
        const canGong = close && needGan && pillars.some((p) => p.gan === needGan)
        out.push({
          kind: '拱合',
          name: `${a}${c} 拱 ${b}`,
          positions: posRange(positions),
          close,
          transformed: canGong,
          state: canGong ? `拱出 ${b}` : close ? '虚拱' : '远拱',
          note: `${hua}局${canGong ? `，透 ${needGan} 引化，原局论生克之外可见拱之${b}` : `，需透 ${needGan} 方能拱出`}`,
          quality: 'neutral',
        })
      }
    }
  }
  return out
}

// ————————————————————————————————————————————————————————
// 地支三会
// ————————————————————————————————————————————————————————

function detectDizhiSanhui(pillars: Pillar[]): Finding[] {
  const out: Finding[] = []
  const zhiSet = pillars.map((p) => p.zhi)
  for (const [trio, hua, fang] of SANHUI) {
    const idxs = trio.map((z) => zhiSet.indexOf(z))
    if (idxs.every((i) => i >= 0)) {
      const canHua = isGanTou(pillars, hua)
      out.push({
        kind: '地支三会',
        name: `${trio.join('')} ${fang}${hua}局`,
        positions: posRange(idxs.sort((a, b) => a - b)),
        close: false,
        transformed: canHua,
        state: canHua ? `会${hua}` : '三会 (未化气)',
        note: canHua
          ? `${fang}方局，天干透 ${hua} 引化，力量最大但最不稳定`
          : `${fang}方局已聚，但天干未透 ${hua}`,
        quality: 'neutral',
      })
    }
  }
  return out
}

// ————————————————————————————————————————————————————————
// 地支六冲
// ————————————————————————————————————————————————————————

function detectDizhiChong(pillars: Pillar[]): Finding[] {
  const out: Finding[] = []
  const zhis = collectZhis(pillars)
  for (const [z1, z2] of ZHI_CHONG) {
    const A = zhis.filter((z) => z.zhi === z1)
    const B = zhis.filter((z) => z.zhi === z2)
    for (const a of A) for (const b of B) {
      const close = adjacent(a.pos, b.pos)
      const mukuChong = ['辰戌', '丑未'].includes(z1 + z2) || ['辰戌', '丑未'].includes(z2 + z1)
      const extraNote = z1 + z2 === '子午' || z2 + z1 === '子午'
        ? '水火对冲，心肾不交'
        : z1 + z2 === '卯酉' || z2 + z1 === '卯酉'
          ? '阴木阴金，肝肺神经'
          : ['寅申', '巳亥'].includes(z1 + z2) || ['寅申', '巳亥'].includes(z2 + z1)
            ? '驿马冲，变动 · 居住与职业俱变'
            : mukuChong
              ? '墓库冲 —— 冲开墓库，藏干暗动'
              : ''
      out.push({
        kind: '地支六冲',
        name: `${z1}${z2} 冲`,
        positions: posRange([a.pos, b.pos].sort()),
        close,
        state: close ? '紧冲' : '隔冲',
        note: `${extraNote}${extraNote ? ' · ' : ''}${close ? '紧贴力大' : '隔位力弱'}；冲忌为吉，冲用为凶`,
        quality: 'bad',
      })
    }
  }
  return out
}

// ————————————————————————————————————————————————————————
// 三刑 / 自刑
// ————————————————————————————————————————————————————————

function detectDizhiXing(pillars: Pillar[]): Finding[] {
  const out: Finding[] = []
  const zhiSet = pillars.map((p) => p.zhi)
  const presenceIdx = (zhi: string): number => zhiSet.indexOf(zhi)

  // 丑未戌 三刑
  const iC = presenceIdx('丑'), iW = presenceIdx('未'), iX = presenceIdx('戌')
  if (iC >= 0 && iW >= 0 && iX >= 0) {
    const idxs = [iC, iW, iX].sort((a, b) => a - b)
    const close = adjacent(idxs[0], idxs[1]) && adjacent(idxs[1], idxs[2])
    const touTu = isGanTou(pillars, '土')
    out.push({
      kind: '地支三刑', name: '丑未戌 三刑',
      positions: posRange(idxs), close,
      state: close && touTu ? '成立' : close ? '紧贴但天干无土' : '齐全但位置散',
      note: '恃势之刑 · 土越刑越旺，伤藏干癸水、辛金、乙木；脾胃皮肤',
      mdKey: '丑未戌三刑', quality: 'bad',
    })
  } else {
    // 半刑 (两支)
    for (const [a, b] of [['丑', '未'], ['丑', '戌'], ['未', '戌']]) {
      const iA = presenceIdx(a), iB = presenceIdx(b)
      if (iA >= 0 && iB >= 0) {
        // 丑未已归入六冲；未戌已归入六破；丑戌 纯三刑的一分支
        if (a === '未' && b === '戌') {
          out.push({
            kind: '地支三刑', name: `${a}${b} 半刑`,
            positions: posRange([iA, iB].sort((x, y) => x - y)),
            close: adjacent(iA, iB),
            state: '半刑 (丑未戌 缺一)',
            note: '恃势之刑未齐 · 岁运补丑 → 三刑齐发',
            mdKey: '丑未戌三刑', quality: 'bad',
          })
        }
      }
    }
  }

  // 寅巳申 三刑
  const iY = presenceIdx('寅'), iS = presenceIdx('巳'), iShen = presenceIdx('申')
  if (iY >= 0 && iS >= 0 && iShen >= 0) {
    const idxs = [iY, iS, iShen].sort((a, b) => a - b)
    const close = adjacent(idxs[0], idxs[1]) && adjacent(idxs[1], idxs[2])
    out.push({
      kind: '地支三刑', name: '寅巳申 三刑',
      positions: posRange(idxs), close,
      state: close ? '成立' : '齐全但位置散',
      note: '无恩之刑 · 驿马三支互刑，事业环境频变、恩情难续，防牢狱血光',
      mdKey: '寅巳申三刑', quality: 'bad',
    })
  } else {
    // 寅巳、巳申、寅申半刑
    for (const [a, b, label] of [['寅', '巳', '寅巳 半刑'], ['巳', '申', '巳申 半刑'], ['寅', '申', '寅申 半刑']]) {
      const iA = presenceIdx(a), iB = presenceIdx(b)
      if (iA >= 0 && iB >= 0) {
        // 巳申 已归入六合; 寅申已归入六冲；寅巳 纯刑
        if (a === '寅' && b === '巳') {
          out.push({
            kind: '地支三刑', name: label,
            positions: posRange([iA, iB].sort((x, y) => x - y)),
            close: adjacent(iA, iB),
            state: '半刑 (寅巳申 缺一)',
            note: '岁运补申 → 三刑齐发',
            mdKey: '寅巳申三刑', quality: 'bad',
          })
        }
      }
    }
  }

  // 子卯 刑
  const iZi = presenceIdx('子'), iMao = presenceIdx('卯')
  if (iZi >= 0 && iMao >= 0) {
    out.push({
      kind: '地支三刑', name: '子卯 刑',
      positions: posRange([iZi, iMao].sort((a, b) => a - b)),
      close: adjacent(iZi, iMao),
      state: '成立',
      note: '无礼之刑 · 母子相刑，水生木变相克；桃花纠纷、肝胆神经',
      mdKey: '子卯刑', quality: 'bad',
    })
  }

  // 自刑
  const counter: Record<string, number[]> = {}
  pillars.forEach((p, i) => {
    if (ZIXING.has(p.zhi)) {
      counter[p.zhi] = counter[p.zhi] || []
      counter[p.zhi].push(i)
    }
  })
  for (const zhi of Object.keys(counter)) {
    const idxs = counter[zhi]
    if (idxs.length >= 2) {
      const wx = zhiWuxing(zhi)
      const touBenqi = isGanTou(pillars, wx)
      const description: Record<string, string> = {
        辰: '水库碰撞 · 委屈内积、自我贬低；脾胃消化、抑郁',
        午: '火焰合一 · 脾气暴躁、完美主义；心血管眼睛、焦虑失眠',
        酉: '刀刃互磨 · 冷漠不切实际；肺呼吸、外伤手术',
        亥: '江河泛滥 · 忧郁沉溺；肾泌尿内分泌、情绪困扰',
      }
      out.push({
        kind: '自刑', name: `${zhi}${zhi} 自刑`,
        positions: posRange(idxs),
        close: idxs.some((a, i) => i > 0 && adjacent(idxs[i - 1], a)),
        state: touBenqi ? '透本气 · 力加倍' : '本气不透',
        note: description[zhi] ?? '',
        mdKey: '自刑', quality: 'bad',
      })
    }
  }

  return out
}

// ————————————————————————————————————————————————————————
// 六害 / 六破 / 相绝
// ————————————————————————————————————————————————————————

function detectDizhiHai(pillars: Pillar[]): Finding[] {
  const out: Finding[] = []
  const zhis = collectZhis(pillars)
  for (const [a, b, title] of LIUHAI) {
    const A = zhis.filter((z) => z.zhi === a)
    const B = zhis.filter((z) => z.zhi === b)
    for (const x of A) for (const y of B) {
      out.push({
        kind: '地支相害',
        name: `${a}${b} 害 (穿)`,
        positions: posRange([x.pos, y.pos].sort()),
        close: adjacent(x.pos, y.pos),
        state: title,
        note: (() => {
          const extras: Record<string, string> = {
            '子未': '对骨肉六亲最不利',
            '丑午': '官杀失效；易怒或残疾',
            '寅巳': '既合既刑又相害，庚金六亲注意',
            '申亥': '对婚姻最凶；动荡变故',
            '卯辰': '年轻欺压年长；腰脚筋骨',
            '酉戌': '嫉妒克害；头面生疮聋哑',
          }
          return extras[a + b] ?? ''
        })(),
        mdKey: '相害',
        quality: 'bad',
      })
    }
  }
  return out
}

function detectDizhiPo(pillars: Pillar[]): Finding[] {
  const out: Finding[] = []
  const zhis = collectZhis(pillars)
  for (const [a, b, title] of LIUPO) {
    const A = zhis.filter((z) => z.zhi === a)
    const B = zhis.filter((z) => z.zhi === b)
    for (const x of A) for (const y of B) {
      out.push({
        kind: '地支相破',
        name: `${a}${b} 破`,
        positions: posRange([x.pos, y.pos].sort()),
        close: adjacent(x.pos, y.pos),
        state: title,
        note: '破 —— 力量比冲弱、比害弱，只作参考',
        quality: 'bad',
      })
    }
  }
  return out
}

function detectDizhiJue(pillars: Pillar[]): Finding[] {
  const out: Finding[] = []
  const zhis = collectZhis(pillars)
  for (const [a, b, ke] of XIANGJUE) {
    const A = zhis.filter((z) => z.zhi === a)
    const B = zhis.filter((z) => z.zhi === b)
    for (const x of A) for (const y of B) {
      out.push({
        kind: '地支相绝',
        name: `${a}${b} 绝`,
        positions: posRange([x.pos, y.pos].sort()),
        close: adjacent(x.pos, y.pos),
        state: ke,
        note: '相绝 —— 力量最弱；表现为合绝无情、意外伤损',
        quality: 'bad',
      })
    }
  }
  return out
}

// ————————————————————————————————————————————————————————
// 墓库分析（开/闭）
// ————————————————————————————————————————————————————————

function detectMuku(pillars: Pillar[]): Finding[] {
  const out: Finding[] = []
  const zhiSet = pillars.map((p) => p.zhi)
  for (const zhi of Object.keys(MUKU)) {
    const idx = zhiSet.indexOf(zhi)
    if (idx < 0) continue
    const ku = MUKU[zhi]
    const touMuqi = pillars.some((p) => p.gan === ku.muqi)
    // 冲开：被其对冲支 (辰↔戌, 丑↔未) 冲
    const chongPair: Record<string, string> = { 辰: '戌', 戌: '辰', 丑: '未', 未: '丑' }
    const chongIdx = zhiSet.indexOf(chongPair[zhi])
    const beingChong = chongIdx >= 0
    // 刑开 (丑戌 / 戌未 / 寅巳申 / 辰辰午午...)——本节只论库被冲/刑打开
    const xingOpen = (zhi === '丑' && zhiSet.includes('戌')) ||
                     (zhi === '戌' && zhiSet.includes('未')) ||
                     (zhi === '未' && zhiSet.includes('丑'))
    // 天干冲开天库：丁癸 / 乙辛 (开库.md)
    const ganHas = (g: string) => pillars.some((p) => p.gan === g)
    let tianChongOpen = false
    let tianChongNote = ''
    for (const pair of Object.keys(TIAN_CHONG_OPEN)) {
      if (TIAN_CHONG_OPEN[pair].includes(zhi) && ganHas(pair[0]) && ganHas(pair[1]) && touMuqi) {
        tianChongOpen = true
        tianChongNote = `天干 ${pair} 冲开天库`
        break
      }
    }
    // 天干合闭天库：戊癸/乙庚/丁壬/丙辛
    let tianHeClose = false
    let tianHeNote = ''
    for (const pair of Object.keys(TIAN_HE_CLOSE)) {
      if (TIAN_HE_CLOSE[pair] === zhi && ganHas(pair[0]) && ganHas(pair[1]) && touMuqi) {
        tianHeClose = true
        tianHeNote = `天干 ${pair} 合闭天库`
        break
      }
    }

    let state = '静库'
    let note = ''
    if (touMuqi && !beingChong && !xingOpen && !tianHeClose) {
      state = '自动开库'
      note = `${ku.muqi}(${ku.muqiWx}) 透干无冲克 → 不入库，源源提供 ${ku.muqiWx} 力`
    } else if (beingChong || xingOpen) {
      state = '冲/刑开库'
      note = `${beingChong ? `遇${chongPair[zhi]}冲` : '丑戌未刑'} → 强行开库，${ku.muqi}(${ku.muqiWx}) 动`
    } else if (tianChongOpen) {
      state = '天干冲开'
      note = tianChongNote
    } else if (tianHeClose) {
      state = '天干合闭'
      note = tianHeNote + ` → ${ku.muqiWx} 被封`
    } else if (!touMuqi) {
      state = '闭库'
      note = `${ku.muqi}(${ku.muqiWx}) 未透 → 库中 ${ku.muqiWx} 封存，需岁运冲开`
    }

    out.push({
      kind: '墓库',
      name: `${zhi} · ${ku.name}`,
      positions: POS_NAMES[idx],
      close: false,
      state,
      note,
      quality: 'neutral',
    })
  }
  return out
}

// ————————————————————————————————————————————————————————
// 主入口
// ————————————————————————————————————————————————————————

export interface GanZhiAnalysis {
  tianganHe: Finding[]
  tianganChong: Finding[]
  tianganKe: Finding[]
  liuhe: Finding[]
  sanhe: Finding[]
  sanhui: Finding[]
  chong: Finding[]
  xing: Finding[]
  hai: Finding[]
  po: Finding[]
  jue: Finding[]
  muku: Finding[]
}

export function analyzeGanZhi(pillars: Pillar[]): GanZhiAnalysis | null {
  if (pillars.length !== 4) return null
  return {
    tianganHe: detectTianganHe(pillars),
    tianganChong: detectTianganChong(pillars),
    tianganKe: detectTianganKe(pillars),
    liuhe: detectDizhiLiuhe(pillars),
    sanhe: detectDizhiSanhe(pillars),
    sanhui: detectDizhiSanhui(pillars),
    chong: detectDizhiChong(pillars),
    xing: detectDizhiXing(pillars),
    hai: detectDizhiHai(pillars),
    po: detectDizhiPo(pillars),
    jue: detectDizhiJue(pillars),
    muku: detectMuku(pillars),
  }
}
