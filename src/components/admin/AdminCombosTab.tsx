import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  AdminDataTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeadCell,
} from '@/components/admin/AdminDataTable'
import { ComboFormDialog } from '@/components/admin/ComboFormDialog'
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { TableRow } from '@/components/ui/table'
import { useCatalogStore } from '@/stores/catalogStore'
import type { ToolCombo } from '@/types'

export function AdminCombosTab() {
  const tools = useCatalogStore((state) => state.tools)
  const combos = useCatalogStore((state) => state.combos)
  const deleteCombo = useCatalogStore((state) => state.deleteCombo)

  const toolNameById = useMemo(
    () => new Map(tools.map((tool) => [tool.id, tool.name])),
    [tools],
  )

  const [formOpen, setFormOpen] = useState(false)
  const [editingCombo, setEditingCombo] = useState<ToolCombo | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ToolCombo | null>(null)

  const openCreate = () => {
    setEditingCombo(null)
    setFormOpen(true)
  }

  const openEdit = (combo: ToolCombo) => {
    setEditingCombo(combo)
    setFormOpen(true)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteCombo(deleteTarget.id)
    toast.success('Combo deleted.')
    setDeleteTarget(null)
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-zinc-500">{combos.length} combos in catalog</p>
        <Button
          type="button"
          className="h-8 bg-indigo-600 text-xs transition-colors hover:bg-indigo-700"
          onClick={openCreate}
        >
          <Plus className="h-3.5 w-3.5" />
          Add combo
        </Button>
      </div>

      <AdminDataTable>
        <AdminTableHead>
          <AdminTableHeadCell>Name</AdminTableHeadCell>
          <AdminTableHeadCell>Primary tool</AdminTableHeadCell>
          <AdminTableHeadCell>Add-ons</AdminTableHeadCell>
          <AdminTableHeadCell>Match score</AdminTableHeadCell>
          <AdminTableHeadCell>Skill required</AdminTableHeadCell>
          <AdminTableHeadCell>
            <span className="sr-only">Actions</span>
          </AdminTableHeadCell>
        </AdminTableHead>
        <AdminTableBody>
          {combos.map((combo) => (
            <TableRow key={combo.id}>
              <AdminTableCell className="font-medium text-stone-900">{combo.name}</AdminTableCell>
              <AdminTableCell>
                {toolNameById.get(combo.primaryToolId) ?? combo.primaryToolId}
              </AdminTableCell>
              <AdminTableCell>{combo.addOnToolIds.length}</AdminTableCell>
              <AdminTableCell>{combo.matchScore}</AdminTableCell>
              <AdminTableCell>{combo.skillLevelRequired}</AdminTableCell>
              <AdminTableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-7 px-2 text-sm transition-colors"
                    onClick={() => openEdit(combo)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-7 px-2 text-sm text-red-600 transition-colors hover:text-red-700"
                    onClick={() => setDeleteTarget(combo)}
                  >
                    Delete
                  </Button>
                </div>
              </AdminTableCell>
            </TableRow>
          ))}
        </AdminTableBody>
      </AdminDataTable>

      <ComboFormDialog open={formOpen} onOpenChange={setFormOpen} combo={editingCombo} />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete this combo?"
        description={
          deleteTarget ? (
            <>
              This removes &ldquo;{deleteTarget.name}&rdquo; from the catalog. This action cannot
              be undone.
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  )
}
