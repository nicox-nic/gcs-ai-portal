import { useState } from 'react'
import { AlertTriangle, Database, FolderKanban, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { clearAllLocalData } from '@/stores/bootstrapStores'
import { useCatalogStore } from '@/stores/catalogStore'
import { useProfileStore } from '@/stores/profileStore'
import { useProjectsStore } from '@/stores/projectsStore'

type DemoAction = 'catalog' | 'projects' | 'profiles' | 'all' | null

export function AdminDemoControlsTab() {
  const resetCatalog = useCatalogStore((state) => state.resetCatalog)
  const resetProjects = useProjectsStore((state) => state.resetProjects)
  const resetProfiles = useProfileStore((state) => state.resetProfiles)

  const [pendingAction, setPendingAction] = useState<DemoAction>(null)

  const handleConfirm = () => {
    if (pendingAction === 'catalog') {
      resetCatalog()
      toast.success('Catalog reset to seed data.')
    } else if (pendingAction === 'projects') {
      resetProjects()
      toast.success('Projects reset to seed data.')
    } else if (pendingAction === 'profiles') {
      resetProfiles()
      toast.success('Profiles reset to seed data.')
    } else if (pendingAction === 'all') {
      clearAllLocalData()
      return
    }
    setPendingAction(null)
  }

  const dialogCopy =
    pendingAction === 'catalog'
      ? {
          title: 'Reset catalog to seed?',
          description: (
            <>
              This will replace all tools, trainings, and combos with the original seed catalog.
              Any additions or edits you made in Admin will be lost. This action cannot be undone.
            </>
          ),
          confirmLabel: 'Reset catalog',
        }
      : pendingAction === 'projects'
        ? {
            title: 'Reset projects to seed?',
            description: (
              <>
                This will replace all projects, lifecycle states, tool stacks, and audit logs with
                the original seed projects. This action cannot be undone.
              </>
            ),
            confirmLabel: 'Reset projects',
          }
        : pendingAction === 'profiles'
          ? {
              title: 'Reset profiles to seed?',
              description: (
                <>
                  This will restore user profiles to the seed defaults (Submitter + Data Engineering
                  completed; others incomplete). This action cannot be undone.
                </>
              ),
              confirmLabel: 'Reset profiles',
            }
          : pendingAction === 'all'
            ? {
                title: 'Clear all local data?',
                description: (
                  <>
                    This is the most destructive action available. It wipes authentication state,
                    profiles, the entire catalog, and all projects from localStorage, then reloads
                    the page. You will be signed out and every demo change will be permanently lost.
                    This action cannot be undone.
                  </>
                ),
                confirmLabel: 'Clear everything',
              }
            : {
                title: '',
                description: '',
                confirmLabel: 'Confirm',
              }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border-[0.5px] border-stone-200 bg-white p-4 transition-shadow hover:shadow-md">
          <div className="mb-2 flex items-center gap-2">
            <Database className="h-4 w-4 text-indigo-600" />
            <h3 className="text-xs font-medium text-stone-900">Reset catalog to seed</h3>
          </div>
          <p className="mb-4 text-[11px] leading-relaxed text-stone-600">
            Restore tools, trainings, and combos to their original seed values. Useful when catalog
            edits need a clean slate. This cannot be undone.
          </p>
          <Button
            type="button"
            variant="outline"
            className="h-9 w-full text-xs"
            onClick={() => setPendingAction('catalog')}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset catalog
          </Button>
        </div>

        <div className="rounded-lg border-[0.5px] border-stone-200 bg-white p-4 transition-shadow hover:shadow-md">
          <div className="mb-2 flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-indigo-600" />
            <h3 className="text-xs font-medium text-stone-900">Reset projects to seed</h3>
          </div>
          <p className="mb-4 text-[11px] leading-relaxed text-stone-600">
            Restore all demo projects, lifecycle progress, recommendations, and audit history to
            seed data. This cannot be undone.
          </p>
          <Button
            type="button"
            variant="outline"
            className="h-9 w-full text-xs"
            onClick={() => setPendingAction('projects')}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset projects
          </Button>
        </div>

        <div className="rounded-lg border-[0.5px] border-stone-200 bg-white p-4 transition-shadow hover:shadow-md">
          <div className="mb-2 flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-indigo-600" />
            <h3 className="text-xs font-medium text-stone-900">Reset profiles to seed</h3>
          </div>
          <p className="mb-4 text-[11px] leading-relaxed text-stone-600">
            Restore skill / tool-chain profiles to seed defaults so first-login setup can be demoed
            again. This cannot be undone.
          </p>
          <Button
            type="button"
            variant="outline"
            className="h-9 w-full text-xs"
            onClick={() => setPendingAction('profiles')}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset profiles
          </Button>
        </div>

        <div className="rounded-lg border-[0.5px] border-red-200 bg-red-50/40 p-4">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <h3 className="text-xs font-medium text-stone-900">Clear all local data</h3>
          </div>
          <p className="mb-4 text-[11px] leading-relaxed text-stone-600">
            Wipe auth, profiles, catalog, and projects from localStorage and reload the app. Use
            this for a completely fresh demo environment. This cannot be undone.
          </p>
          <Button
            type="button"
            variant="destructive"
            className="h-9 w-full text-xs"
            onClick={() => setPendingAction('all')}
          >
            Clear all local data
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null)
        }}
        title={dialogCopy.title}
        description={dialogCopy.description}
        confirmLabel={dialogCopy.confirmLabel}
        variant="destructive"
        onConfirm={handleConfirm}
      />
    </>
  )
}
