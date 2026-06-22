import { PageHeader } from '@/components/layout/PageHeader'
import { AdminCombosTab } from '@/components/admin/AdminCombosTab'
import { AdminDemoControlsTab } from '@/components/admin/AdminDemoControlsTab'
import { AdminToolsTab } from '@/components/admin/AdminToolsTab'
import { AdminTrainingsTab } from '@/components/admin/AdminTrainingsTab'
import { AdminUsersTab } from '@/components/admin/AdminUsersTab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

const ADMIN_TABS = [
  { id: 'tools', label: 'Tools' },
  { id: 'trainings', label: 'Trainings' },
  { id: 'combos', label: 'Combos' },
  { id: 'users', label: 'Users' },
  { id: 'demo', label: 'Demo controls' },
] as const

const tabTriggerClass = cn(
  'flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-4 py-2.5 text-xs shadow-none',
  'data-[state=active]:border-indigo-600 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-none',
)

export function AdminPage() {
  const currentUser = useAuthStore((state) => state.currentUser)

  if (currentUser?.role !== 'Admin') {
    return (
      <>
        <PageHeader title="Access Denied" />
        <p className="text-xs text-stone-500">Only Admin users can access this page.</p>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Admin"
        subtitle="Manage catalog data and demo controls"
        className="mb-5"
      />

      <div className="overflow-hidden rounded-lg border-[0.5px] border-stone-200 bg-white">
        <Tabs defaultValue="tools" className="w-full">
          <TabsList
            variant="line"
            className="h-auto w-full justify-start gap-0 rounded-none border-b border-stone-200 bg-stone-50 p-0"
          >
            {ADMIN_TABS.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className={tabTriggerClass}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="p-5">
            <TabsContent value="tools" className="m-0">
              <AdminToolsTab />
            </TabsContent>
            <TabsContent value="trainings" className="m-0">
              <AdminTrainingsTab />
            </TabsContent>
            <TabsContent value="combos" className="m-0">
              <AdminCombosTab />
            </TabsContent>
            <TabsContent value="users" className="m-0">
              <AdminUsersTab />
            </TabsContent>
            <TabsContent value="demo" className="m-0">
              <AdminDemoControlsTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  )
}
