import type { ReactNode } from 'react'
import { useBaziStore } from '@/lib/store'
import { skillUrl, type SkillCategory } from '@/lib/skills'

interface Props {
  category: SkillCategory
  name: string
  subtitle?: string
  children: ReactNode
  className?: string
}

export function SkillLink({ category, name, subtitle, children, className }: Props) {
  const focused = useBaziStore((s) => s.focused)
  const setFocused = useBaziStore((s) => s.setFocused)
  const hasSkill = !!skillUrl(category, name)
  const active = focused?.category === category && focused.name === name

  if (!hasSkill) return <span className={className}>{children}</span>

  return (
    <button
      type="button"
      onClick={() => setFocused({ category, name, subtitle })}
      className={[
        'cursor-pointer transition-colors rounded',
        'hover:text-amber-700 dark:hover:text-amber-400',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40',
        active ? 'text-amber-700 dark:text-amber-400' : '',
        className ?? '',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
