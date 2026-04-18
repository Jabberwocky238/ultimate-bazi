const LIFE_STATES = [
  '长生', '沐浴', '冠带', '临官', '帝旺', '衰',
  '病', '死', '墓', '绝', '胎', '养',
] as const

const ZHI_ORDER = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

/** 十干长生起点 (子平寄生十二宫，阴干逆行) */
const START: Record<string, { zhi: string; forward: boolean }> = {
  甲: { zhi: '亥', forward: true },
  乙: { zhi: '午', forward: false },
  丙: { zhi: '寅', forward: true },
  丁: { zhi: '酉', forward: false },
  戊: { zhi: '寅', forward: true },
  己: { zhi: '酉', forward: false },
  庚: { zhi: '巳', forward: true },
  辛: { zhi: '子', forward: false },
  壬: { zhi: '申', forward: true },
  癸: { zhi: '卯', forward: false },
}

/**
 * 自坐：天干坐在地支上的十二长生状态
 * e.g. 甲 + 亥 => 长生；壬 + 午 => 胎；癸 + 未 => 墓
 */
export function zizuoState(gan: string, zhi: string): string {
  const info = START[gan]
  if (!info) return ''
  const startIdx = ZHI_ORDER.indexOf(info.zhi)
  const zhiIdx = ZHI_ORDER.indexOf(zhi)
  if (startIdx < 0 || zhiIdx < 0) return ''
  let diff = zhiIdx - startIdx
  if (!info.forward) diff = -diff
  diff = ((diff % 12) + 12) % 12
  return LIFE_STATES[diff]
}

export const ALL_ZIZUO: readonly string[] = LIFE_STATES
