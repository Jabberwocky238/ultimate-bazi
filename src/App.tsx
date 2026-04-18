import { useBaziStore } from '@/lib/store'
import { BaziForm } from '@@/BaziForm'
import { BaziMeta } from '@@/BaziMeta'
import { BaziChart } from '@@/chart/BaziChart'
import { SkillIndex } from '@@/SkillIndex'
import { SkillPanel } from '@@/SkillPanel'
import { Footer } from '@@/Footer'

function App() {
  const result = useBaziStore((s) => s.result)

  return (
    <main className="mx-auto max-w-7xl px-4 md:px-6 pt-6 md:pt-10 pb-10 md:pb-16">
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">八字排盘</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          公历出生时间 → 四柱、十神、神煞 · 点击任意词条查看释义
        </p>
      </header>

      <div className="grid gap-6 md:gap-8 md:grid-cols-[minmax(0,1fr)_380px] lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="min-w-0">
          <BaziForm />
          <BaziMeta solar={result.solarStr} lunar={result.lunarStr} />
          <BaziChart pillars={result.pillars} />
          <SkillIndex pillars={result.pillars} />
        </section>

        <section className="min-w-0">
          <SkillPanel />
        </section>
      </div>

      <Footer />
    </main>
  )
}

export default App
