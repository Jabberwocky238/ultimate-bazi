import { cellBase } from '@/lib/ui'
import { SkillLink } from '@@/SkillLink'

export function ShishenCell({ shishen }: { shishen: string }) {
  return (
    <td className={cellBase}>
      <SkillLink
        category="shishen"
        name={shishen}
        className="font-medium text-slate-800 dark:text-slate-200"
      >
        {shishen}
      </SkillLink>
    </td>
  )
}
