import type { Pillar } from '@/lib/store'
import { cellBase } from '@/lib/ui'
import { Row } from './Row'
import { ShishenCell } from './ShishenCell'
import { GanZhiCell } from './GanZhiCell'
import { HideShishenCell } from './HideShishenCell'
import { ShenshaCell } from './ShenshaCell'

export function BaziChart({ pillars }: { pillars: Pillar[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm">
      <table className="w-full text-center min-w-[520px]">
        <thead>
          <tr className="bg-slate-50/70 dark:bg-slate-950/40">
            <th className="w-20"></th>
            {pillars.map((p) => (
              <th
                key={p.label}
                className="py-3 text-xs font-medium tracking-[0.25em] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800"
              >
                {p.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <Row label="十神">
            {pillars.map((p) => <ShishenCell key={p.label} shishen={p.shishen} />)}
          </Row>
          <Row label="干支">
            {pillars.map((p) => (
              <GanZhiCell
                key={p.label}
                gan={p.gan}
                zhi={p.zhi}
                ganWuxing={p.ganWuxing}
                zhiWuxing={p.zhiWuxing}
              />
            ))}
          </Row>
          <Row label="藏干">
            {pillars.map((p) => <td key={p.label} className={cellBase}>{p.hide}</td>)}
          </Row>
          <Row label="藏干十神">
            {pillars.map((p) => <HideShishenCell key={p.label} items={p.hideShishen} />)}
          </Row>
          <Row label="五行">
            {pillars.map((p) => <td key={p.label} className={cellBase}>{p.wuxing}</td>)}
          </Row>
          <Row label="纳音">
            {pillars.map((p) => <td key={p.label} className={cellBase}>{p.nayin}</td>)}
          </Row>
          <Row label="神煞" last>
            {pillars.map((p) => <ShenshaCell key={p.label} items={p.shensha} />)}
          </Row>
        </tbody>
      </table>
    </div>
  )
}
