import { cellBase } from '@/lib/ui'
import { SkillLink } from '@@/SkillLink'

export function HideShishenCell({ items }: { items: string[] }) {
  if (!items.length) return <td className={cellBase}>—</td>
  return (
    <td className={cellBase}>
      <div className="flex flex-wrap justify-center gap-x-1.5 gap-y-0.5">
        {items.map((s, idx) => (
          <SkillLink key={idx} category="shishen" name={s}>{s}</SkillLink>
        ))}
      </div>
    </td>
  )
}
