import { useBaziStore } from './store'
import './App.css'

function App() {
  const year = useBaziStore((s) => s.year)
  const month = useBaziStore((s) => s.month)
  const day = useBaziStore((s) => s.day)
  const hour = useBaziStore((s) => s.hour)
  const sex = useBaziStore((s) => s.sex)
  const result = useBaziStore((s) => s.result)
  const setDate = useBaziStore((s) => s.setDate)
  const syncToUrl = useBaziStore((s) => s.syncToUrl)

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setDate({
      year: Number(form.get('year')),
      month: Number(form.get('month')),
      day: Number(form.get('day')),
      hour: Number(form.get('hour')),
      sex: Number(form.get('sex')) === 0 ? 0 : 1,
    })
    syncToUrl()
  }

  return (
    <main className="bazi-app">
      <h1>八字计算</h1>

      <form className="bazi-form" onSubmit={onSubmit}>
        <label>
          年 <input name="year" type="number" defaultValue={year} />
        </label>
        <label>
          月 <input name="month" type="number" min={1} max={12} defaultValue={month} />
        </label>
        <label>
          日 <input name="day" type="number" min={1} max={31} defaultValue={day} />
        </label>
        <label>
          时 <input name="hour" type="number" min={0} max={23} defaultValue={hour} />
        </label>
        <label>
          性别
          <select name="sex" defaultValue={sex}>
            <option value={1}>男</option>
            <option value={0}>女</option>
          </select>
        </label>
        <button type="submit">计算</button>
      </form>

      <section className="bazi-meta">
        <div>公历：{result.solarStr}</div>
        <div>农历：{result.lunarStr}</div>
      </section>

      <table className="bazi-table">
        <thead>
          <tr>
            <th></th>
            <th>年柱</th>
            <th>月柱</th>
            <th>日柱</th>
            <th>时柱</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>干支</th>
            {result.pillars.map((p) => (
              <td key={p.label} className="gz">{p.gz}</td>
            ))}
          </tr>
          <tr>
            <th>天干</th>
            {result.pillars.map((p) => (
              <td key={p.label}>{p.gan}</td>
            ))}
          </tr>
          <tr>
            <th>地支</th>
            {result.pillars.map((p) => (
              <td key={p.label}>{p.zhi}</td>
            ))}
          </tr>
          <tr>
            <th>五行</th>
            {result.pillars.map((p) => (
              <td key={p.label}>{p.wuxing}</td>
            ))}
          </tr>
          <tr>
            <th>纳音</th>
            {result.pillars.map((p) => (
              <td key={p.label}>{p.nayin}</td>
            ))}
          </tr>
          <tr>
            <th>藏干</th>
            {result.pillars.map((p) => (
              <td key={p.label}>{p.hide}</td>
            ))}
          </tr>
          <tr>
            <th>十神</th>
            {result.pillars.map((p) => (
              <td key={p.label}>{p.shishen}</td>
            ))}
          </tr>
          <tr>
            <th>藏干十神</th>
            {result.pillars.map((p) => (
              <td key={p.label}>{p.hideShishen.join('、')}</td>
            ))}
          </tr>
          <tr>
            <th>神煞</th>
            {result.pillars.map((p) => (
              <td key={p.label} className="shensha">
                {p.shensha.length ? p.shensha.map((s) => <div key={s}>{s}</div>) : '—'}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </main>
  )
}

export default App
