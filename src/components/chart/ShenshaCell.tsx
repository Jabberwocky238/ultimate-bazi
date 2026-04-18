import { SkillLink } from '@@/SkillLink'
import { isInauspicious } from '@/lib/wuxing'

export function ShenshaCell({ items }: { items: string[] }) {
  return (
    <td className="border-r last:border-r-0 border-slate-200 dark:border-slate-800 p-2.5">
      {items.length ? (
        <div className="flex flex-wrap justify-center gap-1">
          {items.map((s) => (
            <SkillLink key={s} category="shensha" name={s} className={chipCls(s)}>
              {s}
            </SkillLink>
          ))}
        </div>
      ) : (
        <span className="text-slate-400 dark:text-slate-600">—</span>
      )}
    </td>
  )
}

function chipCls(name: string): string {
  const base = 'text-xs px-2 py-0.5 rounded-full whitespace-nowrap border'
  return isInauspicious(name)
    ? `${base} bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30`
    : `${base} bg-amber-600/10 text-amber-700 dark:text-amber-400 border-amber-600/30`
}
