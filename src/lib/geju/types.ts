import type { Ctx } from './ctx'

export type GejuQuality = 'good' | 'bad' | 'neutral'
export type GejuCategory = '从格' | '十神格' | '五行格' | '专旺格' | '特殊格' | '正格'

export interface GejuHit {
  name: string
  note: string
  quality: GejuQuality
  category: GejuCategory
}

export type GejuDraft = Pick<GejuHit, 'name' | 'note'>

export type Detector = (ctx: Ctx) => GejuDraft | null

export type ShishenCat = '比劫' | '印' | '食伤' | '财' | '官杀'

export const SHI_SHEN_CAT: Record<string, ShishenCat> = {
  比肩: '比劫', 劫财: '比劫',
  正印: '印', 偏印: '印',
  食神: '食伤', 伤官: '食伤',
  正财: '财', 偏财: '财',
  正官: '官杀', 七杀: '官杀',
}

export const META: Record<string, { quality: GejuQuality; category: GejuCategory }> = {
  // 特殊格
  魁罡格: { quality: 'good', category: '特殊格' },
  三奇格: { quality: 'good', category: '特殊格' },
  三庚格: { quality: 'good', category: '特殊格' },
  化气格: { quality: 'good', category: '特殊格' },
  日德格: { quality: 'good', category: '特殊格' },
  日贵格: { quality: 'good', category: '特殊格' },
  两气成象: { quality: 'neutral', category: '特殊格' },
  五行齐全: { quality: 'neutral', category: '特殊格' },
  天元一气: { quality: 'good', category: '特殊格' },
  帝王命造: { quality: 'good', category: '特殊格' },
  壬骑龙背: { quality: 'good', category: '特殊格' },
  禄马同乡: { quality: 'good', category: '特殊格' },
  日照江河: { quality: 'good', category: '特殊格' },
  寒木向阳: { quality: 'good', category: '特殊格' },

  // 正格
  建禄格: { quality: 'good', category: '正格' },
  阳刃格: { quality: 'neutral', category: '正格' },
  七杀格: { quality: 'good', category: '正格' },
  食神格: { quality: 'good', category: '正格' },
  伤官格: { quality: 'good', category: '正格' },
  正财格: { quality: 'good', category: '正格' },
  偏财格: { quality: 'good', category: '正格' },
  正印格: { quality: 'good', category: '正格' },
  偏印格: { quality: 'good', category: '正格' },
  正官格: { quality: 'good', category: '正格' },

  // 十神格 (吉)
  官印相生: { quality: 'good', category: '十神格' },
  杀印相生: { quality: 'good', category: '十神格' },
  食神制杀: { quality: 'good', category: '十神格' },
  伤官合杀: { quality: 'good', category: '十神格' },
  伤官生财: { quality: 'good', category: '十神格' },
  食神生财: { quality: 'good', category: '十神格' },
  伤官佩印: { quality: 'good', category: '十神格' },
  食伤泄秀: { quality: 'good', category: '十神格' },

  财官印全: { quality: 'good', category: '特殊格' },
  羊刃驾杀: { quality: 'neutral', category: '特殊格' },
  羊刃劫财: { quality: 'neutral', category: '特殊格' },
  身杀两停: { quality: 'neutral', category: '特殊格' },

  // 十神格 (凶/中性)
  官杀混杂: { quality: 'bad', category: '十神格' },
  食伤混杂: { quality: 'bad', category: '十神格' },
  伤官见官: { quality: 'bad', category: '十神格' },
  枭神夺食: { quality: 'bad', category: '十神格' },
  以财破印: { quality: 'bad', category: '十神格' },
  财多身弱: { quality: 'bad', category: '十神格' },
  比劫重重: { quality: 'bad', category: '十神格' },
  劫财见财: { quality: 'bad', category: '十神格' },

  // 专旺格
  曲直格: { quality: 'good', category: '专旺格' },
  炎上格: { quality: 'good', category: '专旺格' },
  稼穑格: { quality: 'good', category: '专旺格' },
  从革格: { quality: 'good', category: '专旺格' },
  润下格: { quality: 'good', category: '专旺格' },

  // 从格
  从财格: { quality: 'good', category: '从格' },
  从杀格: { quality: 'good', category: '从格' },
  从儿格: { quality: 'good', category: '从格' },
  从官格: { quality: 'good', category: '从格' },
  从旺格: { quality: 'good', category: '从格' },
  从强格: { quality: 'good', category: '从格' },
  从势格: { quality: 'good', category: '从格' },

  // 五行格 (吉)
  木火通明: { quality: 'good', category: '五行格' },
  水木清华: { quality: 'good', category: '五行格' },
  水火既济: { quality: 'good', category: '五行格' },
  土金毓秀: { quality: 'good', category: '五行格' },
  金火铸印: { quality: 'good', category: '五行格' },
  金白水清: { quality: 'good', category: '五行格' },
  火土夹带: { quality: 'good', category: '五行格' },
  木疏厚土: { quality: 'good', category: '五行格' },
  斧斤伐木: { quality: 'good', category: '五行格' },

  // 五行格 (凶)
  木火相煎: { quality: 'bad', category: '五行格' },
  木多火塞: { quality: 'bad', category: '五行格' },
  水火相战: { quality: 'bad', category: '五行格' },
  水多木漂: { quality: 'bad', category: '五行格' },
  水冷木寒: { quality: 'bad', category: '五行格' },
  金寒水冷: { quality: 'bad', category: '五行格' },
  火旺金衰: { quality: 'bad', category: '五行格' },
  火多金熔: { quality: 'bad', category: '五行格' },
  火炎土燥: { quality: 'bad', category: '五行格' },
  土重金埋: { quality: 'bad', category: '五行格' },
}
