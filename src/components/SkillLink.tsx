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
        'cursor-pointer rounded transition-[box-shadow,filter] duration-150',
        'hover:shadow-[0_0_14px_-1px_currentColor] hover:drop-shadow-[0_0_3px_currentColor]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40',
        active ? 'shadow-[0_0_14px_-1px_currentColor] drop-shadow-[0_0_3px_currentColor]' : '',
        className ?? '',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
