import { useState } from 'react'
import { HOUR_UNKNOWN } from '@/lib'
import { useBaziInput, type BaziInputMode } from '@@/stores'
import { inputCls, labelCls, primaryBtn } from '@@/css'
import { SaveLoadControls } from '@@/SaveLoadControls'

function isValidDate(y: number, m: number, d: number): boolean {
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return false
  if (m < 1 || m > 12 || d < 1) return false
  const dt = new Date(0, 0, 1)
  dt.setFullYear(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
}

const TABS: { key: BaziInputMode; label: string }[] = [
  { key: 'gregorian',     label: '公历' },
  { key: 'trueSolar',     label: '真太阳时' },
  { key: 'gregorianLong', label: '公历 + 经度' },
  { key: 'bazi',          label: '八字直输' },
]

export function BaziForm() {
  const mode = useBaziInput((s) => s.mode)
  const year = useBaziInput((s) => s.year)
  const month = useBaziInput((s) => s.month)
  const day = useBaziInput((s) => s.day)
  const hour = useBaziInput((s) => s.hour)
  const minute = useBaziInput((s) => s.minute)
  const longitude = useBaziInput((s) => s.longitude)
  const bazi = useBaziInput((s) => s.bazi)
  const sex = useBaziInput((s) => s.sex)
  const setMode = useBaziInput((s) => s.setMode)
  const setDate = useBaziInput((s) => s.setDate)
  const setLongitude = useBaziInput((s) => s.setLongitude)
  const setBaziGz = useBaziInput((s) => s.setBaziGz)
  const syncToUrl = useBaziInput((s) => s.syncToUrl)

  const [hourUnknown, setHourUnknown] = useState(hour === HOUR_UNKNOWN)

  const onSubmitGregorianLike = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const y = Number(f.get('year'))
    const m = Number(f.get('month'))
    const d = Number(f.get('day'))
    if (!isValidDate(y, m, d)) {
      alert(`参数有误：${y} 年 ${m} 月没有第 ${d} 天`)
      return
    }
    setDate({
      year: y,
      month: m,
      day: d,
      hour: hourUnknown ? HOUR_UNKNOWN : Number(f.get('hour')),
      minute: hourUnknown ? 0 : Number(f.get('minute')),
      sex: Number(f.get('sex')) === 0 ? 0 : 1,
    })
    if (mode === 'gregorianLong') {
      setLongitude(Number(f.get('lng')))
    }
    syncToUrl()
  }

  const onSubmitBazi = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const gz = (k: string) => String(f.get(k) ?? '').trim()
    const y = gz('bazi-y'), m = gz('bazi-m'), d = gz('bazi-d'), h = gz('bazi-h')
    if (y.length !== 2 || m.length !== 2 || d.length !== 2) {
      alert('年/月/日 三柱必填, 各 2 字干支 (如 甲子)')
      return
    }
    if (h !== '' && h.length !== 2) {
      alert('时柱填 2 字干支或留空表示未知')
      return
    }
    const sx = Number(f.get('sex')) === 0 ? 0 : 1
    setBaziGz([y, m, d, h], sx)
    syncToUrl()
  }

  const hourInputValue = hour === HOUR_UNKNOWN ? 0 : hour

  return (
    <div className="relative z-30 mb-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm overflow-hidden">
      {/* tab 栏 */}
      <div className="flex flex-wrap gap-px border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        {TABS.map((t) => {
          const active = mode === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setMode(t.key)}
              className={[
                'px-3 py-2 text-xs md:text-sm transition tracking-wider',
                active
                  ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 font-medium border-b-2 border-amber-500'
                  : 'text-slate-500 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-400 border-b-2 border-transparent',
              ].join(' ')}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* 表单 */}
      {mode === 'bazi' ? (
        <form
          key={`bazi-${bazi.join('|')}-${sex}`}
          onSubmit={onSubmitBazi}
          className="flex flex-wrap items-end gap-3 p-4 md:p-5"
        >
          <label className={labelCls}>年柱<input name="bazi-y" defaultValue={bazi[0]} placeholder="甲子" maxLength={2} className={inputCls + ' w-16 md:w-20 text-center'} /></label>
          <label className={labelCls}>月柱<input name="bazi-m" defaultValue={bazi[1]} placeholder="甲子" maxLength={2} className={inputCls + ' w-16 md:w-20 text-center'} /></label>
          <label className={labelCls}>日柱<input name="bazi-d" defaultValue={bazi[2]} placeholder="甲子" maxLength={2} className={inputCls + ' w-16 md:w-20 text-center'} /></label>
          <label className={labelCls}>时柱<input name="bazi-h" defaultValue={bazi[3]} placeholder="甲子 / 留空" maxLength={2} className={inputCls + ' w-20 md:w-24 text-center'} /></label>
          <label className={labelCls}>
            性别
            <select name="sex" defaultValue={sex} className={inputCls}>
              <option value={1}>男</option>
              <option value={0}>女</option>
            </select>
          </label>
          <button type="submit" className={primaryBtn}>排盘</button>
          <SaveLoadControls />
          <span className="w-full text-[10px] text-slate-400 dark:text-slate-600 leading-relaxed">
            八字直输模式: 跳过公历/农历计算, 直接由 4 干支推十神 / 神煞 / 格局; 大运不可计算 (无日期)。
          </span>
        </form>
      ) : (
        <form
          key={`${mode}-${year}-${month}-${day}-${hour}-${minute}-${longitude}-${sex}`}
          onSubmit={onSubmitGregorianLike}
          className="flex flex-wrap items-end gap-3 p-4 md:p-5"
        >
          <label className={labelCls}>年<input name="year" type="number" defaultValue={year} className={inputCls} /></label>
          <label className={labelCls}>月<input name="month" type="number" min={1} max={12} defaultValue={month} className={inputCls} /></label>
          <label className={labelCls}>日<input name="day" type="number" min={1} max={31} defaultValue={day} className={inputCls} /></label>
          <label className={labelCls}>
            时
            <input
              name="hour"
              type="number"
              min={0}
              max={23}
              defaultValue={hourInputValue}
              disabled={hourUnknown}
              className={inputCls + (hourUnknown ? ' opacity-40 cursor-not-allowed' : '')}
            />
          </label>
          <label className={labelCls}>
            分
            <input
              name="minute"
              type="number"
              min={0}
              max={59}
              defaultValue={minute}
              disabled={hourUnknown}
              className={inputCls + (hourUnknown ? ' opacity-40 cursor-not-allowed' : '')}
            />
          </label>
          {mode === 'gregorianLong' && (
            <label className={labelCls}>
              经度°E
              <input
                name="lng"
                type="number"
                step="0.01"
                min={-180}
                max={180}
                defaultValue={longitude}
                className={inputCls + ' w-20'}
              />
            </label>
          )}
          <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 pb-2 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={hourUnknown}
              onChange={(e) => setHourUnknown(e.currentTarget.checked)}
              className="accent-amber-700"
            />
            时柱未知
          </label>
          <label className={labelCls}>
            性别
            <select name="sex" defaultValue={sex} className={inputCls}>
              <option value={1}>男</option>
              <option value={0}>女</option>
            </select>
          </label>
          <button type="submit" className={primaryBtn}>排盘</button>
          <SaveLoadControls />
          {mode === 'trueSolar' && (
            <span className="w-full text-[10px] text-slate-400 dark:text-slate-600 leading-relaxed">
              真太阳时模式: 输入视作已修正的真太阳时, 时柱按输入时辰直接划分, 不再做均时差/经度修正。
            </span>
          )}
          {mode === 'gregorianLong' && (
            <span className="w-full text-[10px] text-slate-400 dark:text-slate-600 leading-relaxed">
              公历 + 经度: 自动应用均时差(仅太阳轨道) + 经度差 (与 120°E 差 1° = ±4 分钟) → 真太阳时, 再排时柱。
            </span>
          )}
          {mode === 'gregorian' && (
            <span className="w-full text-[10px] text-slate-400 dark:text-slate-600 leading-relaxed">
              公历模式: 直接以 wall clock 排盘 (现代多数算法), 真太阳时仅作参考显示。
            </span>
          )}
        </form>
      )}
    </div>
  )
}
