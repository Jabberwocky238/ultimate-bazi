import type { Pillar } from '../store'
import { buildCtx } from './ctx'
import { META, type GejuHit, type GejuDraft, type Detector } from './types'

export type { GejuQuality, GejuCategory, GejuHit } from './types'

import * as zhengge from './categories/zhengge'
import * as guansha from './categories/guansha'
import * as shishang from './categories/shishang'
import * as yangren from './categories/yangren'
import * as zongliang from './categories/zongliang'
import * as wuxing from './categories/wuxing'
import * as zhuanwang from './categories/zhuanwang'
import * as conge from './categories/conge'
import * as teshu from './categories/teshu'

export const DETECTORS: Record<string, Detector> = {
  // 正格 (月令单一十神)
  建禄格: zhengge.isJianLuGe,
  阳刃格: zhengge.isYangRenGe,
  正官格: zhengge.isZhengGuanGe,
  七杀格: zhengge.isQiShaGe,
  食神格: zhengge.isShiShenGe,
  伤官格: zhengge.isShangGuanGe,
  正财格: zhengge.isZhengCaiGe,
  偏财格: zhengge.isPianCaiGe,
  正印格: zhengge.isZhengYinGe,
  偏印格: zhengge.isPianYinGe,
  魁罡格: zhengge.isKuiGangGe,
  壬骑龙背: zhengge.isRenQiLongBei,
  // 官杀
  官杀混杂: guansha.isGuanShaHunZa,
  官印相生: guansha.isGuanYinXiangSheng,
  杀印相生: guansha.isShaYinXiangSheng,
  // 食伤
  食神制杀: shishang.isShiShenZhiSha,
  枭神夺食: shishang.isXiaoShenDuoShi,
  伤官见官: shishang.isShangGuanJianGuan,
  伤官合杀: shishang.isShangGuanHeSha,
  伤官生财: shishang.isShangGuanShengCai,
  伤官佩印: shishang.isShangGuanPeiYin,
  食伤混杂: shishang.isShiShangHunZa,
  食伤泄秀: shishang.isShiShangXieXiu,
  // 羊刃
  羊刃驾杀: yangren.isYangRenJiaSha,
  羊刃劫财: yangren.isYangRenJieCai,
  // 总量
  财官印全: zongliang.isCaiGuanYinQuan,
  比劫重重: zongliang.isBiJieChongChong,
  禄马同乡: zongliang.isLuMaTongXiang,
  以财破印: zongliang.isYiCaiPoYin,
  财多身弱: zongliang.isCaiDuoShenRuo,
  // 五行象法 (成对判定，key 为对关系标识)
  水火对: wuxing.judgeShuiHuo,   // → 水火既济 / 水火相战
  木火对: wuxing.judgeMuHuo,     // → 木火相煎 / 木火通明 / 木多火塞
  土金对: wuxing.judgeTuJin,     // → 土金毓秀 / 土重金埋
  火金对: wuxing.judgeHuoJin,    // → 火多金熔 / 火旺金衰 / 金火铸印
  火土对: wuxing.judgeHuoTu,     // → 火土夹带 / 火炎土燥
  水木对: wuxing.judgeShuiMu,    // → 水木清华 / 水多木漂 / 水冷木寒
  金水对: wuxing.judgeJinShui,   // → 金寒水冷 / 金白水清
  木土对: wuxing.judgeMuTu,      // → 木疏厚土
  金木对: wuxing.judgeJinMu,     // → 斧斤伐木
  寒木向阳: wuxing.judgeHanMu,
  日照江河: wuxing.judgeRiZhao,
  // 专旺 (五行分五格)
  曲直格: zhuanwang.isQuZhiGe,
  炎上格: zhuanwang.isYanShangGe,
  稼穑格: zhuanwang.isJiaSeGe,
  从革格: zhuanwang.isCongGeGe,
  润下格: zhuanwang.isRunXiaGe,
  // 从格
  从财格: conge.isCongCaiGe,
  从杀格: conge.isCongShaGe,
  从儿格: conge.isCongErGe,
  从官格: conge.isCongGuanGe,
  从旺格: conge.isCongWangGe,
  从强格: conge.isCongQiangGe,
  从势格: conge.isCongShiGe,
  // 特殊格
  三奇格: teshu.isSanQiGe,
  三庚格: teshu.isSanGengGe,
  两气成象: teshu.isLiangQiChengXiang,
  五行齐全: teshu.isWuXingQiQuan,
  化气格: teshu.isHuaQiGe,
  天元一气: teshu.isTianYuanYiQi,
  日德格: teshu.isRiDeGe,
  日贵格: teshu.isRiGuiGe,
  身杀两停: teshu.isShenShaLiangTing,
  劫财见财: teshu.isJieCaiJianCai,
  帝王命造: teshu.isDiWangMingZao,
}

function enrich(d: GejuDraft): GejuHit {
  const m = META[d.name] ?? { quality: 'neutral' as const, category: '特殊格' as const }
  return { ...d, quality: m.quality, category: m.category }
}

export function detectGeju(pillars: Pillar[]): GejuHit[] {
  if (pillars.length !== 4) return []
  const ctx = buildCtx(pillars)
  const hits: GejuHit[] = []
  for (const detect of Object.values(DETECTORS)) {
    const h = detect(ctx)
    if (!h) continue
    hits.push(enrich(h))
  }
  return hits
}
