import { useMemo, useState } from 'react'
import {
  type Pillar,
  analyzeHepanCrossBoth,
  type AnyFinding,
  type CrossFindings,
  type PillarPos,
} from '@/lib'
import { KIND_TONE } from '@@/css'

interface Props {
  a: Pillar[]
  aName: string
  b: Pillar[]
  bName: string
}

const POS_LIST: PillarPos[] = ['年', '月', '日', '时']

export function HepanCrossPanel({ a, aName, b, bName }: Props) {
  const [open, setOpen] = useState(true)

  const both = useMemo(
    () => analyzeHepanCrossBoth(a, aName, b, bName),
    [a, aName, b, bName],
  )
  if (!both) return null

  // 合并 union 总览 — 双向 finding 通常对称, 用 finding 引用去重.
  const union = useMemo(() => {
    const seen = new Set<AnyFinding>()
    const merge = (...lists: AnyFinding[][]): AnyFinding[] => {
      const out: AnyFinding[] = []
      for (const list of lists) for (const f of list) {
        if (!seen.has(f)) { seen.add(f); out.push(f) }
      }
      return out
    }
    return {
      he:        merge(both.aFromB.all.he, both.bFromA.all.he),
      chong:     merge(both.aFromB.all.chong, both.bFromA.all.chong),
      xinghaipo: merge(both.aFromB.all.xinghaipo, both.bFromA.all.xinghaipo),
      ke:        merge(both.aFromB.all.ke, both.bFromA.all.ke),
    }
  }, [both])
  const totalUnion = union.he.length + union.chong.length + union.xinghaipo.length + union.ke.length

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 md:p-5 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-3 flex-wrap text-left ${open ? 'mb-4' : ''}`}
      >
        <span className="flex items-baseline gap-2">
          <span className={`text-[11px] inline-block transition-transform ${open ? 'rotate-90' : ''}`}>▸</span>
          <h2 className="text-xs font-medium tracking-[0.25em] uppercase text-slate-500 dark:text-slate-400">
            干支互动 · {aName} ↔ {bName}
          </h2>
        </span>
        <div className="flex items-baseline gap-2 text-xs">
          <span className="text-emerald-700 dark:text-emerald-400">合 {union.he.length}</span>
          <span className="text-rose-700 dark:text-rose-400">冲 {union.chong.length}</span>
          <span className="text-amber-700 dark:text-amber-400">刑害破 {union.xinghaipo.length}</span>
          <span className="text-amber-700 dark:text-amber-400">克 {union.ke.length}</span>
        </div>
      </button>

      {open && (
        <div className="space-y-5">
          {totalUnion === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {aName} 与 {bName} 无明显跨盘干支互动 (各柱仍展示, 便于对照)
            </p>
          )}

          {/* 双向各柱拆 — 左右两列 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] tracking-[0.2em] font-medium text-slate-500 dark:text-slate-400 uppercase mb-2">
                {aName} 受 {bName} 影响 — 按柱拆
              </div>
              <div className="grid grid-cols-1 gap-2">
                {POS_LIST.map((pos) => (
                  <PillarCrossCard key={`a-${pos}`} pos={pos} cross={both.aFromB.byPillar[pos]} otherName={bName} />
                ))}
              </div>
            </div>
            <div>
              <div className="text-[11px] tracking-[0.2em] font-medium text-slate-500 dark:text-slate-400 uppercase mb-2">
                {bName} 受 {aName} 影响 — 按柱拆
              </div>
              <div className="grid grid-cols-1 gap-2">
                {POS_LIST.map((pos) => (
                  <PillarCrossCard key={`b-${pos}`} pos={pos} cross={both.bFromA.byPillar[pos]} otherName={aName} />
                ))}
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 dark:text-slate-600 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800">
            按柱拆: 自身年/月/日/时 受对方哪几柱合冲刑害.
            合多缘深 / 冲多摩擦 / 刑害破暗耗 / 克为单向压制.
          </p>
        </div>
      )}
    </section>
  )
}

function PillarCrossCard({
  pos, cross, otherName,
}: { pos: PillarPos; cross: CrossFindings; otherName: string }) {
  const tone = cross.total === 0
    ? 'border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-950/30'
    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
  return (
    <div className={`rounded-lg border px-3 py-2 ${tone}`}>
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{pos} 柱</span>
        <span className="flex items-baseline gap-1.5 text-[10px] tabular-nums">
          <span className="text-emerald-700 dark:text-emerald-400">合 {cross.he.length}</span>
          <span className="text-rose-700 dark:text-rose-400">冲 {cross.chong.length}</span>
          <span className="text-amber-700 dark:text-amber-400">刑害 {cross.xinghaipo.length}</span>
          <span className="text-amber-700 dark:text-amber-400">克 {cross.ke.length}</span>
        </span>
      </div>
      {cross.total === 0 ? (
        <div className="text-[11px] text-slate-400 dark:text-slate-600 italic">{otherName} 不动其分</div>
      ) : (
        <div className="flex flex-col gap-1">
          {[...cross.he, ...cross.chong, ...cross.xinghaipo, ...cross.ke].map((f, i) => (
            <FindingChip key={`${f.kind}-${f.positions}-${i}`} f={f} />
          ))}
        </div>
      )}
    </div>
  )
}

function FindingChip({ f }: { f: AnyFinding }) {
  return (
    <div className={`rounded-md border px-2 py-1 text-[11px] leading-relaxed ${KIND_TONE[f.kind]}`}>
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span className="text-[9px] opacity-70 font-medium">{f.kind}</span>
        <span className="font-bold text-xs">{f.name}</span>
        <span className="text-[9px] opacity-80 tabular-nums">[{f.positions}]</span>
      </div>
    </div>
  )
}
