import type { Ctx } from '../../ctx'
import type { GejuDraft } from '../../types'

/** 水火对 (md)：
 *  - 既济：水火五行明显 (透+有根) + 势均 + 有木通关
 *    md: 「水透干+亥子有根」「火透干+巳午有根」「两者力量势均」「有木通关」
 *  - 相战：水火皆显 + 势均 + 无木通关 + 无土调和
 *    md: 「无木通关」「无土调和」
 */
export function judgeShuiHuo(ctx: Ctx): GejuDraft | null {
  const shuiShow = ctx.touWx('水') && ctx.rootWx('水')
  const huoShow = ctx.touWx('火') && ctx.rootWx('火')
  if (!shuiShow || !huoShow) return null
  const shuiN = ctx.ganWxCount('水') + ctx.zhiMainWxCount('水')
  const huoN = ctx.ganWxCount('火') + ctx.zhiMainWxCount('火')
  if (Math.abs(shuiN - huoN) > 2) return null
  const muTongGuan = ctx.touWx('木')
  if (muTongGuan) {
    return { name: '水火既济', note: '水火有根势均 · 木通关' }
  }
  const tuDiaohe = ctx.touWx('土')
  if (!tuDiaohe) {
    return { name: '水火相战', note: '水火有根势均 · 无木通关无土调和' }
  }
  return null
}
