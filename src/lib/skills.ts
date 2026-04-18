export type SkillCategory = 'shishen' | 'shensha' | 'tiangan' | 'dizhi' | 'gongwei'

const PATHS: Record<SkillCategory, Record<string, string>> = {
  shishen: {
    比肩: '十神/比肩.md',
    劫财: '十神/劫财.md',
    食神: '十神/食神.md',
    伤官: '十神/伤官.md',
    偏财: '十神/偏财.md',
    正财: '十神/正财.md',
    七杀: '十神/七杀.md',
    正官: '十神/正官.md',
    偏印: '十神/偏印.md',
    正印: '十神/正印.md',
    日主: '',
  },
  shensha: {
    桃花: '神煞/桃花.md',
    华盖: '神煞/华盖.md',
    羊刃: '神煞/羊刃.md',
    驿马: '神煞/驿马.md',
    红鸾: '神煞/红鸾.md',
    天喜: '神煞/天喜.md',
    十恶大败: '神煞/十恶大败.md',
    天罗地网: '神煞/天罗地网.md',
    太极贵人: '神煞/太极贵人.md',
    阴差阳错: '神煞/阴差阳错.md',
    天乙贵人: '神煞/天乙贵人.md',
    天德贵人: '神煞/天德贵人.md',
    寡宿: '神煞/寡宿.md',
    魁罡: '神煞/魁罡.md',
    童子煞: '神煞/童子煞.md',
    勾绞煞: '神煞/勾绞煞.md',
    吊客: '神煞/吊客.md',
    孤鸾: '神煞/孤鸾.md',
    孤鸾煞: '神煞/孤鸾.md',
  },
  tiangan: {
    甲: '天干/甲木.md',
    乙: '天干/乙木.md',
    丙: '天干/丙火.md',
    丁: '天干/丁火.md',
    戊: '天干/戊土.md',
    己: '天干/己土.md',
    庚: '天干/庚金.md',
  },
  dizhi: {
    亥: '地支/亥水.md',
  },
  gongwei: {
    年柱: '宫位/年柱.md',
    月柱: '宫位/月柱.md',
    时柱: '宫位/时柱.md',
    夫妻宫: '宫位/夫妻宫.md',
  },
}

export function skillUrl(category: SkillCategory, name: string): string | null {
  const rel = PATHS[category]?.[name]
  if (!rel) return null
  return `/bazi-skills/core/${rel}`
}

const cache = new Map<string, Promise<string>>()

export function loadSkill(url: string): Promise<string> {
  const hit = cache.get(url)
  if (hit) return hit
  const p = fetch(url).then((r) => {
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
    return r.text()
  })
  cache.set(url, p)
  return p
}
