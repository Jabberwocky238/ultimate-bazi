/**
 * 五行象法 —— 按"两五行对关系"分组。每对 judge 函数返回**至多一个**名号,
 * 同一对内的不同子格天然互斥 (定性分支决定落在哪个子格)。
 *
 * `judgeHanMu` / `judgeRiZhao` 不属成对判定，但同属五行象法一并归在此目录。
 */
export { judgeShuiHuo } from './shuihuo'
export { judgeMuHuo } from './muhuo'
export { judgeTuJin } from './tujin'
export { judgeHuoJin } from './huojin'
export { judgeHuoTu } from './huotu'
export { judgeShuiMu } from './shuimu'
export { judgeJinShui } from './jinshui'
export { judgeMuTu } from './mutu'
export { judgeJinMu } from './jinmu'
export { judgeHanMu } from './hanmu'
export { judgeRiZhao } from './rizhao'
