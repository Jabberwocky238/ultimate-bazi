import { useEffect, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useBaziStore } from '@/lib/store'
import { loadSkill, skillUrl } from '@/lib/skills'

const CATEGORY_LABEL: Record<string, string> = {
  shishen: '十神',
  shensha: '神煞',
  tiangan: '天干',
  dizhi: '地支',
  gongwei: '宫位',
  geju: '格局',
}

export function SkillPanel() {
  const focused = useBaziStore((s) => s.focused)
  const setFocused = useBaziStore((s) => s.setFocused)
  const [md, setMd] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!focused) {
      setMd(null)
      setErr(null)
      return
    }
    const url = skillUrl(focused.category, focused.name)
    if (!url) return
    setMd(null)
    setErr(null)
    loadSkill(url).then(setMd).catch((e) => setErr(String(e)))
  }, [focused])

  return (
    <aside
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-6rem)] md:sticky md:top-6"
    >
      <header className="flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
        <div className="min-w-0">
          {focused ? (
            <>
              <div className="text-[11px] tracking-[0.25em] uppercase text-slate-500 dark:text-slate-400">
                {CATEGORY_LABEL[focused.category] ?? focused.category}
                {focused.subtitle ? ` · ${focused.subtitle}` : ''}
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 truncate">
                {focused.name}
              </h2>
            </>
          ) : (
            <>
              <div className="text-[11px] tracking-[0.25em] uppercase text-slate-500 dark:text-slate-400">
                释义
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                选一个词条
              </h2>
            </>
          )}
        </div>
        {focused && (
          <button
            type="button"
            onClick={() => setFocused(null)}
            className="shrink-0 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 px-2 py-1 rounded"
            aria-label="关闭释义"
          >
            清除
          </button>
        )}
      </header>

      <div className="overflow-y-auto px-5 py-4">
        {!focused && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            点击左侧命盘的任意 <b className="text-slate-700 dark:text-slate-200">十神</b> /{' '}
            <b className="text-slate-700 dark:text-slate-200">天干地支</b> /{' '}
            <b className="text-slate-700 dark:text-slate-200">神煞</b>{' '}
            词条即可在此处看到详细释义。
          </p>
        )}
        {focused && err && (
          <div className="text-sm text-red-500">加载失败：{err}</div>
        )}
        {focused && !md && !err && (
          <div className="text-sm text-slate-500">加载中…</div>
        )}
        {focused && md && (
          <article className="prose-bazi">
            <Markdown remarkPlugins={[remarkGfm]}>{md}</Markdown>
          </article>
        )}
      </div>
    </aside>
  )
}
