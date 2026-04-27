import { useBazi } from '@/lib'
import { BaziForm } from '@@/BaziForm'
import { BaziMeta } from '@@/BaziMeta'
import { BaziChart } from '@@/chart/BaziChart'
import { SkillIndex } from '@@/SkillIndex'
import { SkillPanel } from '@@/SkillPanel'
import { BasicsPanel } from '@@/BasicsPanel'
import { ShishenProportion } from '@@/ShishenProportion'
import { DayMasterRelations } from '@@/DayMasterRelations'
import { GejuPanel } from '@@/GejuPanel'
import { DaYunPanel } from '@@/DaYunPanel'
import { BalancePanel } from '@@/BalancePanel'
import { StrengthPanel } from '@@/StrengthPanel'
import { XiyongPanel } from '@@/XiyongPanel'
import { GanZhiPanel } from '@@/GanZhiPanel'
import { Footer } from '@@/Footer'
import { ErrorBoundary } from '@@/ErrorBoundary'

function App() {
  const solarStr = useBazi((s) => s.solarStr)
  const trueSolarStr = useBazi((s) => s.trueSolarStr)
  const lunarStr = useBazi((s) => s.lunarStr)
  const pillars = useBazi((s) => s.pillars)

  return (
    <ErrorBoundary name="App">
      <main className="mx-auto max-w-7xl px-3 md:px-6 pt-5 md:pt-10 pb-10 md:pb-16">
        <header className="mb-5 md:mb-6">
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight">八字排盘</h1>
          <p className="mt-1 text-xs md:text-sm text-slate-500 dark:text-slate-400">
            公历出生时间 → 四柱、十神、神煞 · 点击任意词条查看释义
          </p>
        </header>

        <div className="grid gap-5 md:gap-6 md:grid-cols-[minmax(0,6fr)_minmax(0,4fr)]">
          <section className="min-w-0">
            <ErrorBoundary name="BaziForm"><BaziForm /></ErrorBoundary>
            <ErrorBoundary name="BaziMeta"><BaziMeta solar={solarStr} trueSolar={trueSolarStr} lunar={lunarStr} /></ErrorBoundary>
            <ErrorBoundary name="BaziChart"><BaziChart pillars={pillars} /></ErrorBoundary>
            <ErrorBoundary name="DayMasterRelations"><DayMasterRelations /></ErrorBoundary>
            <ErrorBoundary name="GejuPanel"><GejuPanel /></ErrorBoundary>
            <ErrorBoundary name="DaYunPanel"><DaYunPanel /></ErrorBoundary>
            <ErrorBoundary name="ShishenProportion"><ShishenProportion pillars={pillars} /></ErrorBoundary>
            <ErrorBoundary name="StrengthPanel"><StrengthPanel /></ErrorBoundary>
            <ErrorBoundary name="GanZhiPanel"><GanZhiPanel /></ErrorBoundary>
            <ErrorBoundary name="XiyongPanel"><XiyongPanel /></ErrorBoundary>
            {/* <BalancePanel /> */}
            <ErrorBoundary name="SkillIndex"><SkillIndex pillars={pillars} /></ErrorBoundary>
            <ErrorBoundary name="BasicsPanel"><BasicsPanel /></ErrorBoundary>
          </section>

          <section className="min-w-0">
            <ErrorBoundary name="SkillPanel"><SkillPanel /></ErrorBoundary>
          </section>
        </div>

        <ErrorBoundary name="Footer"><Footer /></ErrorBoundary>
      </main>
    </ErrorBoundary>
  )
}

export default App
