export const WUXING_TEXT: Record<string, string> = {
  木: 'text-wood',
  火: 'text-fire',
  土: 'text-earth',
  金: 'text-metal',
  水: 'text-water',
}

export const WUXING_BORDER: Record<string, string> = {
  木: 'border-wood/60',
  火: 'border-fire/60',
  土: 'border-earth/60',
  金: 'border-metal/60',
  水: 'border-water/60',
}

export const WUXING_FROM: Record<string, string> = {
  木: 'from-wood/15',
  火: 'from-fire/15',
  土: 'from-earth/15',
  金: 'from-metal/15',
  水: 'from-water/15',
}

const GAN_WUXING: Record<string, string> = {
  甲: '木', 乙: '木',
  丙: '火', 丁: '火',
  戊: '土', 己: '土',
  庚: '金', 辛: '金',
  壬: '水', 癸: '水',
}

const ZHI_WUXING: Record<string, string> = {
  子: '水', 亥: '水',
  寅: '木', 卯: '木',
  巳: '火', 午: '火',
  申: '金', 酉: '金',
  辰: '土', 戌: '土', 丑: '土', 未: '土',
}

export function ganWuxing(gan: string): string {
  return GAN_WUXING[gan] ?? ''
}

export function zhiWuxing(zhi: string): string {
  return ZHI_WUXING[zhi] ?? ''
}

export function isInauspicious(name: string): boolean {
  return /煞|刃|空亡|孤辰|寡宿/.test(name)
}
