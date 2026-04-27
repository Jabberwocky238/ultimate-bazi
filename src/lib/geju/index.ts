import { create } from 'zustand'
import { ganWuxing, zhiWuxing, type Pillar as EnginePillar, type WuXing } from '@jabberwocky238/bazi-engine'
import type { Pillar } from '../store'
import type { Ctx, Detector, GejuHit, GejuQuality, GejuCategory, DaYunMeta } from './types'
import { useBazi } from '../shishen'
import { useShishen } from '../shishen'
import { useStrength } from '../strength'

export type { Ctx, GejuQuality, GejuCategory, GejuHit, DaYunMeta } from './types'

import * as zhengge from './categories/zhengge'
import * as guansha from './categories/guansha'
import * as shishang from './categories/shishang'
import * as yangren from './categories/yangren'
import * as zongliang from './categories/zongliang'
import * as wuxing from './categories/wuxing'
import * as zhuanwang from './categories/zhuanwang'
import * as congge from './categories/congge'
import * as teshu from './categories/teshu'

export const DETECTORS: Record<string, [Detector, GejuQuality, GejuCategory]> = {
  // 正格 (月令单一十神)
  建禄格: [zhengge.isJianLuGe, 'good', '正格'],
  阳刃格: [zhengge.isYangRenGe, 'good', '正格'],
  正官格: [zhengge.isZhengGuanGe, 'good', '正格'],
  七杀格: [zhengge.isQiShaGe, 'good', '正格'],
  食神格: [zhengge.isShiShenGe, 'good', '正格'],
  伤官格: [zhengge.isShangGuanGe, 'good', '正格'],
  正财格: [zhengge.isZhengCaiGe, 'good', '正格'],
  偏财格: [zhengge.isPianCaiGe, 'good', '正格'],
  正印格: [zhengge.isZhengYinGe, 'good', '正格'],
  偏印格: [zhengge.isPianYinGe, 'good', '正格'],
  
  // 官杀
  官杀混杂: [guansha.isGuanShaHunZa, 'bad', '十神格'],
  官印相生: [guansha.isGuanYinXiangSheng, 'good', '十神格'],
  杀印相生: [guansha.isShaYinXiangSheng, 'good', '十神格'],
  // 食伤
  食神制杀: [shishang.isShiShenZhiSha, 'good', '十神格'],
  枭神夺食: [shishang.isXiaoShenDuoShi, 'bad', '十神格'],
  伤官见官: [shishang.isShangGuanJianGuan, 'bad', '十神格'],
  伤官合杀: [shishang.isShangGuanHeSha, 'good', '十神格'],
  伤官生财: [shishang.isShangGuanShengCai, 'good', '十神格'],
  食神生财: [shishang.isShiShenShengCai, 'good', '十神格'],
  伤官佩印: [shishang.isShangGuanPeiYin, 'good', '十神格'],
  食伤混杂: [shishang.isShiShangHunZa, 'bad', '十神格'],
  食伤泄秀: [shishang.isShiShangXieXiu, 'good', '十神格'],
  劫财见财: [teshu.isJieCaiJianCai, 'bad', '十神格'],
  // 羊刃
  羊刃驾杀: [yangren.isYangRenJiaSha, 'neutral', '特殊格'],
  羊刃劫财: [yangren.isYangRenJieCai, 'neutral', '特殊格'],
  // 总量
  财官印全: [zongliang.isCaiGuanYinQuan, 'good', '特殊格'],
  比劫重重: [zongliang.isBiJieChongChong, 'bad', '十神格'],
  禄马同乡: [zongliang.isLuMaTongXiang, 'good', '特殊格'],
  以财破印: [zongliang.isYiCaiPoYin, 'bad', '十神格'],
  财多身弱: [zongliang.isCaiDuoShenRuo, 'bad', '十神格'],
  // 五行象法 / 两气成象 (per-pattern)
  水火既济: [wuxing.isShuiHuoJiJi, 'good', '五行格'],
  水火相战: [wuxing.isShuiHuoXiangZhan, 'bad', '五行格'],
  木火相煎: [wuxing.isMuHuoXiangJian, 'bad', '五行格'],
  木火通明: [wuxing.isMuHuoTongMing, 'good', '五行格'],
  木多火塞: [wuxing.isMuDuoHuoSai, 'bad', '五行格'],
  土金毓秀: [wuxing.isTuJinYuXiu, 'good', '五行格'],
  土重金埋: [wuxing.isTuZhongJinMai, 'bad', '五行格'],
  火多金熔: [wuxing.isHuoDuoJinRong, 'bad', '五行格'],
  火旺金衰: [wuxing.isHuoWangJinShuai, 'bad', '五行格'],
  金火铸印: [wuxing.isJinHuoZhuYin, 'good', '五行格'],
  火土夹带: [wuxing.isHuoTuJiaDai, 'good', '五行格'],
  火炎土燥: [wuxing.isHuoYanTuZao, 'bad', '五行格'],
  水多木漂: [wuxing.isShuiDuoMuPiao, 'bad', '五行格'],
  水冷木寒: [wuxing.isShuiLengMuHan, 'bad', '五行格'],
  水木清华: [wuxing.isShuiMuQingHua, 'good', '五行格'],
  金寒水冷: [wuxing.isJinHanShuiLeng, 'bad', '五行格'],
  金白水清: [wuxing.isJinBaiShuiQing, 'good', '五行格'],
  木疏厚土: [wuxing.isMuShuHouTu, 'good', '五行格'],
  斧斤伐木: [wuxing.isFuJinFaMu, 'good', '五行格'],
  寒木向阳: [wuxing.judgeHanMu, 'good', '特殊格'],
  日照江河: [wuxing.judgeRiZhao, 'good', '特殊格'],
  // 专旺
  曲直格: [zhuanwang.isQuZhiGe, 'good', '专旺格'],
  炎上格: [zhuanwang.isYanShangGe, 'good', '专旺格'],
  稼穑格: [zhuanwang.isJiaSeGe, 'good', '专旺格'],
  从革格: [zhuanwang.isCongGeGe, 'good', '专旺格'],
  润下格: [zhuanwang.isRunXiaGe, 'good', '专旺格'],
  // 从格 (名称以 bazi-skills md 目录名为准)
  弃命从财: [congge.isCongCaiGe, 'good', '从格'],
  弃命从煞: [congge.isCongShaGe, 'good', '从格'],
  弃命从势: [congge.isCongShiGe, 'good', '从格'],
  从儿格: [congge.isCongErGe, 'good', '从格'],
  // 以下 detector 无 md 文档 (2025-1 从格重组时已删)：
  // 从官格: [congge.isCongGuanGe, 'good', '从格'],
  // 从旺格: [congge.isCongWangGe, 'good', '从格'],
  // 从强格: [congge.isCongQiangGe, 'good', '从格'],
  // 特殊格
  魁罡格: [zhengge.isKuiGangGe, 'good', '特殊格'],
  三奇格: [teshu.isSanQiGe, 'good', '特殊格'],
  三庚格: [teshu.isSanGengGe, 'good', '特殊格'],
  化气格: [teshu.isHuaQiGe, 'good', '特殊格'],
  天元一气: [teshu.isTianYuanYiQi, 'good', '特殊格'],
  日德格: [teshu.isRiDeGe, 'good', '特殊格'],
  日贵格: [teshu.isRiGuiGe, 'good', '特殊格'],
  身杀两停: [teshu.isShenShaLiangTing, 'neutral', '特殊格'],
  帝王命造: [teshu.isDiWangMingZao, 'good', '特殊格'],
  壬骑龙背: [zhengge.isRenQiLongBei, 'good', '特殊格'],
}

export type GejuOutput = GejuHit & { quality: GejuQuality, category: GejuCategory }

interface DetectExtras {
  dayun?: Pillar
  liunian?: Pillar
  daYunMeta?: DaYunMeta
}

/**
 * 由当前 useBazi / useShishen / useStrength 状态 + extras 现场拼出 ctx。
 * 替代原 lib/geju/ctx.ts 的 Ctx class —— 数据/方法都已分散到三个 store。
 */
function composeCtx(extras: DetectExtras): Ctx | null {
  const bazi = useBazi.getState()
  if (bazi.pillars.length !== 4) return null
  const shishen = useShishen.getState()
  const strength = useStrength.getState()
  const [year, month, day, hour] = bazi.pillars
  const extraArr: Pillar[] = []
  if (extras.dayun) extraArr.push(extras.dayun)
  if (extras.liunian) extraArr.push(extras.liunian)
  return {
    // useBazi
    pillars: { year, month, day, hour, dayun: extras.dayun, liunian: extras.liunian },
    season: bazi.season,
    dayYang: bazi.dayYang,
    dayGan: bazi.dayGan as Ctx['dayGan'],
    dayZhi: bazi.dayZhi as Ctx['dayZhi'],
    dayGz: bazi.dayGz,
    dayWx: bazi.dayWx as Ctx['dayWx'],
    yearZhi: bazi.yearZhi as Ctx['yearZhi'],
    monthZhi: bazi.monthZhi as Ctx['monthZhi'],
    monthCat: bazi.monthCat,
    monthZhiBeingChong: bazi.monthZhiBeingChong,
    mainArr: bazi.mainArr,
    ganSet: bazi.ganSet,
    ganWxCount: bazi.ganWxCount,
    zhiMainWxCount: bazi.zhiMainWxCount,
    touWx: bazi.touWx,
    rootWx: bazi.rootWx,
    rootExt: bazi.rootExt,
    // useShishen
    ganSs: shishen.ganSs,
    mainZhiArr: shishen.mainZhiArr,
    allZhiArr: shishen.allZhiArr,
    tou: shishen.tou,
    touCat: shishen.touCat,
    zang: shishen.zang,
    has: shishen.has,
    hasCat: shishen.hasCat,
    mainAt: shishen.mainAt,
    strong: shishen.strong,
    strongCat: shishen.strongCat,
    countOf: shishen.countOf,
    countCat: shishen.countCat,
    adjacentTou: shishen.adjacentTou,
    // useStrength
    strength: strength.analysis,
    level: strength.level,
    deLing: strength.deLing,
    deDi: strength.deDi,
    deShi: strength.deShi,
    shenWang: strength.shenWang,
    shenRuo: strength.shenRuo,
    // extras
    extraArr,
    extraPillars: extraArr,
    daYunMeta: extras.daYunMeta ?? null,
    extraGanWxCount: (wx: WuXing) =>
      extraArr.filter((p) => ganWuxing(p.gan as EnginePillar['gan']) === wx).length,
    extraZhiMainWxCount: (wx: WuXing) =>
      extraArr.filter((p) => zhiWuxing(p.zhi as EnginePillar['zhi']) === wx).length,
  }
}

export function detectGeju(extras: DetectExtras = {}): GejuOutput[] {
  const ctx = composeCtx(extras)
  if (!ctx) return []
  const hits: GejuOutput[] = []
  for (const [detect, quality, category] of Object.values(DETECTORS)) {
    const h = detect(ctx)
    if (!h) continue
    hits.push({ ...h, quality, category })
  }
  return hits
}

// ————————————————————————————————————————————————————————
// useGeju — 自动跟随 useBazi.pillars 重算原局格局 (不含岁运)。
// 岁运叠加判定仍由调用方 (GejuPanel) 直接调 detectGeju 完成。
// ————————————————————————————————————————————————————————

interface GejuStore {
  hits: GejuOutput[]
}

export const useGeju = create<GejuStore>()(() => ({
  hits: detectGeju(),
}))

useBazi.subscribe((s, prev) => {
  if (s.pillars === prev.pillars) return
  useGeju.setState({ hits: detectGeju() })
})
