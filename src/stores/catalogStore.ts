import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SEED_COMBOS } from '@/data/seedCombos'
import { SEED_TOOLS } from '@/data/seedTools'
import { SEED_TRAININGS } from '@/data/seedTrainings'
import type { Tool, ToolCombo, Training } from '@/types'

type CatalogStore = {
  tools: Tool[]
  trainings: Training[]
  combos: ToolCombo[]
  addTool: (tool: Omit<Tool, 'id'>) => Tool
  updateTool: (id: string, patch: Partial<Omit<Tool, 'id'>>) => void
  deleteTool: (id: string) => void
  addTraining: (training: Omit<Training, 'id'>) => Training
  updateTraining: (id: string, patch: Partial<Omit<Training, 'id'>>) => void
  deleteTraining: (id: string) => void
  addCombo: (combo: Omit<ToolCombo, 'id'>) => ToolCombo
  updateCombo: (id: string, patch: Partial<Omit<ToolCombo, 'id'>>) => void
  deleteCombo: (id: string) => void
  resetCatalog: () => void
}

const seedCatalog = (): Pick<CatalogStore, 'tools' | 'trainings' | 'combos'> => ({
  tools: structuredClone(SEED_TOOLS),
  trainings: structuredClone(SEED_TRAININGS),
  combos: structuredClone(SEED_COMBOS),
})

export const useCatalogStore = create<CatalogStore>()(
  persist(
    (set) => ({
      ...seedCatalog(),
      addTool: (tool) => {
        const created: Tool = { ...tool, id: `tool-${nanoid(8)}` }
        set((state) => ({ tools: [...state.tools, created] }))
        return created
      },
      updateTool: (id, patch) => {
        set((state) => ({
          tools: state.tools.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        }))
      },
      deleteTool: (id) => {
        set((state) => ({
          tools: state.tools.filter((t) => t.id !== id),
        }))
      },
      addTraining: (training) => {
        const created: Training = { ...training, id: `trn-${nanoid(8)}` }
        set((state) => ({ trainings: [...state.trainings, created] }))
        return created
      },
      updateTraining: (id, patch) => {
        set((state) => ({
          trainings: state.trainings.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        }))
      },
      deleteTraining: (id) => {
        set((state) => ({
          trainings: state.trainings.filter((t) => t.id !== id),
        }))
      },
      addCombo: (combo) => {
        const created: ToolCombo = { ...combo, id: `combo-${nanoid(8)}` }
        set((state) => ({ combos: [...state.combos, created] }))
        return created
      },
      updateCombo: (id, patch) => {
        set((state) => ({
          combos: state.combos.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }))
      },
      deleteCombo: (id) => {
        set((state) => ({
          combos: state.combos.filter((c) => c.id !== id),
        }))
      },
      resetCatalog: () => set(seedCatalog()),
    }),
    {
      name: 'gcs-ai-portal-catalog',
      partialize: (state) => ({
        tools: state.tools,
        trainings: state.trainings,
        combos: state.combos,
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<Pick<CatalogStore, 'tools' | 'trainings' | 'combos'>> | undefined
        if (!saved?.tools?.length || !saved?.trainings?.length || !saved?.combos?.length) {
          return current
        }
        return { ...current, ...saved }
      },
    },
  ),
)
