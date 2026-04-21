import { create } from 'zustand'
import type { SkillCategory } from './skills'
import { useBazi } from './bazi'

export interface Pillar {
  label: string
  gz: string
  gan: string
  zhi: string
  ganWuxing: string
  zhiWuxing: string
  wuxing: string
  nayin: string
  hideGans: string[]
  shishen: string
  shishenWuxing: string
  hideShishen: string[]
  hideShishenWuxings: string[]
  shensha: string[]
  zizuo: string
}

export interface BaziResult {
  solarStr: string
  lunarStr: string
  pillars: Pillar[]
  hourKnown: boolean
}

export interface SkillFocus {
  category: SkillCategory
  name: string
  subtitle?: string
}

/** 大运/流年挂进命盘计算的临时"柱" */
export interface ExtraPillar {
  label: '大运' | '流年'
  gan: string
  zhi: string
  shishen: string
  hideShishen: string[]
  gz: string
  desc?: string
}

interface UiState {
  focused: SkillFocus | null
  extraPillars: ExtraPillar[]
  setFocused: (f: SkillFocus | null) => void
  setExtraPillars: (p: ExtraPillar[]) => void
}

export const useBaziStore = create<UiState>((set) => ({
  focused: null,
  extraPillars: [],
  setFocused: (f) => set({ focused: f }),
  setExtraPillars: (p) => set({ extraPillars: p }),
}))

// 输入变化 → 清空大运/流年叠加
useBazi.subscribe((s, prev) => {
  if (
    s.year === prev.year &&
    s.month === prev.month &&
    s.day === prev.day &&
    s.hour === prev.hour &&
    s.minute === prev.minute &&
    s.sex === prev.sex
  ) return
  useBaziStore.setState({ extraPillars: [] })
})
