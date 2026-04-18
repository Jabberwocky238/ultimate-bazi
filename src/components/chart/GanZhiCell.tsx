import { WUXING_TEXT, WUXING_BORDER, WUXING_FROM } from '@/lib/wuxing'
import { SkillLink } from '@@/SkillLink'

export function GanZhiCell({
  gan,
  zhi,
  ganWuxing,
  zhiWuxing,
}: {
  gan: string
  zhi: string
  ganWuxing: string
  zhiWuxing: string
}) {
  return (
    <td
      className={[
        'border-b border-r last:border-r-0 border-slate-200 dark:border-slate-800',
        'bg-gradient-to-b to-transparent border-t-[3px] py-3 md:py-4',
        WUXING_BORDER[ganWuxing] ?? 'border-slate-300',
        WUXING_FROM[ganWuxing] ?? '',
      ].join(' ')}
    >
      <div className="text-4xl md:text-5xl font-bold leading-none tracking-wider">
        <div className={WUXING_TEXT[ganWuxing] ?? ''}>
          <SkillLink category="tiangan" name={gan}>{gan}</SkillLink>
        </div>
        <div className={`mt-1 ${WUXING_TEXT[zhiWuxing] ?? ''}`}>
          <SkillLink category="dizhi" name={zhi}>{zhi}</SkillLink>
        </div>
      </div>
    </td>
  )
}
