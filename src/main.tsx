import { lazy, Suspense, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

/**
 * 路径分流: /hepan* 加载 HepanApp，其他一律走主盘 App。
 * 主路径保持同步 import — 零额外延迟、与改动前完全一致。
 * /hepan 用 React.lazy 动态 import — 不污染主盘 bundle。
 */
const isHepan = typeof window !== 'undefined'
  && window.location.pathname.startsWith('/hepan')

const HepanApp = lazy(() => import('./hepan/HepanApp'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isHepan
      ? <Suspense fallback={null}><HepanApp /></Suspense>
      : <App />}
  </StrictMode>,
)
