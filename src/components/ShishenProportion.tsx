import type { Pillar } from '@/lib/store'
import { SkillLink } from '@@/SkillLink'

const GAN_WEIGHT = 1.0
const HIDDEN_WEIGHTS = [0.6, 0.3, 0.1]

const CAT: Record<string, string> = {
  比肩: '比劫', 劫财: '比劫',
  食神: '食伤', 伤官: '食伤',
  偏财: '财', 正财: '财',
  七杀: '官杀', 正官: '官杀',
  偏印: '印', 正印: '印',
}

const CAT_COLOR: Record<string, string> = {
  比劫: 'bg-slate-500 dark:bg-slate-400',
  食伤: 'bg-emerald-500 dark:bg-emerald-400',
  财: 'bg-amber-500 dark:bg-amber-400',
  官杀: 'bg-rose-500 dark:bg-rose-400',
  印: 'bg-sky-500 dark:bg-sky-400',
}

interface Entry {
  name: string
  count: number
  weight: number
  pct: number
  inGan: boolean
  ganFirstPos: number
}

function compute(pillars: Pillar[]): Entry[] {
  const map = new Map<string, Entry>()
  const ensure = (name: string): Entry => {
    let e = map.get(name)
    if (!e) {
      e = { name, count: 0, weight: 0, pct: 0, inGan: false, ganFirstPos: Infinity }
      map.set(name, e)
    }
    return e
  }

  pillars.forEach((p, i) => {
    if (p.shishen && p.shishen !== '日主') {
      const e = ensure(p.shishen)
      e.weight += GAN_WEIGHT
      e.count += 1
      e.inGan = true
      e.ganFirstPos = Math.min(e.ganFirstPos, i)
    }
    p.hideShishen.forEach((s, j) => {
      if (!s || s === '日主') return
      const e = ensure(s)
      e.weight += HIDDEN_WEIGHTS[j] ?? 0.05
      e.count += 1
    })
  })

  const total = Array.from(map.values()).reduce((sum, e) => sum + e.weight, 0)
  map.forEach((e) => { e.pct = total > 0 ? (e.weight / total) * 100 : 0 })

  return Array.from(map.values())
}

export function ShishenProportion({ pillars }: { pillars: Pillar[] }) {
  const entries = compute(pillars)
  if (!entries.length) return null

  const inGan = entries
    .filter((e) => e.inGan)
    .sort((a, b) => a.ganFirstPos - b.ganFirstPos)
  const hiddenOnly = entries
    .filter((e) => !e.inGan)
    .sort((a, b) => b.count - a.count || b.weight - a.weight)

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-5 shadow-sm">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xs font-medium tracking-[0.25em] uppercase text-slate-500 dark:text-slate-400">
          十神占比
        </h2>
        {/* <span className="text-[11px] text-slate-400 dark:text-slate-500">
          天干 1.0 · 主气 0.6 · 中气 0.3 · 余气 0.1
        </span> */}
      </div>

      {inGan.length > 0 && (
        <Group title="透干" entries={inGan} />
      )}
      {hiddenOnly.length > 0 && (
        <Group title="仅藏干" entries={hiddenOnly} dimmed className={inGan.length ? 'mt-5' : ''} />
      )}
    </section>
  )
}

function Group({
  title,
  entries,
  dimmed,
  className,
}: {
  title: string
  entries: Entry[]
  dimmed?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      <div className="mb-2 text-[11px] tracking-[0.2em] font-medium text-slate-500 dark:text-slate-400">
        {title}
      </div>
      <div className="space-y-2">
        {entries.map((e) => <ProportionBar key={e.name} entry={e} dimmed={dimmed} />)}
      </div>
    </div>
  )
}

function ProportionBar({ entry, dimmed }: { entry: Entry; dimmed?: boolean }) {
  const color = CAT_COLOR[CAT[entry.name] ?? ''] ?? 'bg-slate-400'
  return (
    <div className="flex items-center gap-2 md:gap-3">
      <div className="w-10 md:w-14 shrink-0 text-sm font-medium text-slate-800 dark:text-slate-200">
        <SkillLink category="shishen" name={entry.name}>{entry.name}</SkillLink>
      </div>
      <div className="flex-1 min-w-0 relative h-4 md:h-5 rounded bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 ${color} ${dimmed ? 'opacity-70' : ''} transition-all`}
          style={{ width: `${entry.pct}%` }}
        />
      </div>
      <div className="w-12 md:w-14 shrink-0 text-right text-xs tabular-nums text-slate-600 dark:text-slate-400">
        {entry.pct.toFixed(1)}%
      </div>
      <div className="hidden sm:block w-8 shrink-0 text-right text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
        ×{entry.count}
      </div>
    </div>
  )
}
