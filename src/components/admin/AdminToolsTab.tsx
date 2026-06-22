import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  AdminDataTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeadCell,
} from '@/components/admin/AdminDataTable'
import { ToolFormDialog } from '@/components/admin/ToolFormDialog'
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { TableRow } from '@/components/ui/table'
import { useCatalogStore } from '@/stores/catalogStore'
import type { Tool } from '@/types'

export function AdminToolsTab() {
  const tools = useCatalogStore((state) => state.tools)
  const deleteTool = useCatalogStore((state) => state.deleteTool)

  const [formOpen, setFormOpen] = useState(false)
  const [editingTool, setEditingTool] = useState<Tool | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Tool | null>(null)

  const openCreate = () => {
    setEditingTool(null)
    setFormOpen(true)
  }

  const openEdit = (tool: Tool) => {
    setEditingTool(tool)
    setFormOpen(true)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteTool(deleteTarget.id)
    toast.success('Tool deleted.')
    setDeleteTarget(null)
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-zinc-500">{tools.length} tools in catalog</p>
        <Button
          type="button"
          className="h-8 bg-indigo-600 text-xs transition-colors hover:bg-indigo-700"
          onClick={openCreate}
        >
          <Plus className="h-3.5 w-3.5" />
          Add tool
        </Button>
      </div>

      <AdminDataTable>
        <AdminTableHead>
          <AdminTableHeadCell>Name</AdminTableHeadCell>
          <AdminTableHeadCell>Category</AdminTableHeadCell>
          <AdminTableHeadCell>Vendor</AdminTableHeadCell>
          <AdminTableHeadCell>Required skill</AdminTableHeadCell>
          <AdminTableHeadCell>Max data sensitivity</AdminTableHeadCell>
          <AdminTableHeadCell>Linked trainings</AdminTableHeadCell>
          <AdminTableHeadCell>Last reviewed</AdminTableHeadCell>
          <AdminTableHeadCell>
            <span className="sr-only">Actions</span>
          </AdminTableHeadCell>
        </AdminTableHead>
        <AdminTableBody>
          {tools.map((tool) => (
            <TableRow key={tool.id}>
              <AdminTableCell className="font-medium text-stone-900">{tool.name}</AdminTableCell>
              <AdminTableCell>{tool.category}</AdminTableCell>
              <AdminTableCell>{tool.vendor}</AdminTableCell>
              <AdminTableCell>{tool.requiredSkillLevel}</AdminTableCell>
              <AdminTableCell>{tool.maxDataSensitivity}</AdminTableCell>
              <AdminTableCell>{tool.trainingIds.length}</AdminTableCell>
              <AdminTableCell>{tool.lastReviewed}</AdminTableCell>
              <AdminTableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-7 px-2 text-sm transition-colors"
                    onClick={() => openEdit(tool)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-7 px-2 text-sm text-red-600 transition-colors hover:text-red-700"
                    onClick={() => setDeleteTarget(tool)}
                  >
                    Delete
                  </Button>
                </div>
              </AdminTableCell>
            </TableRow>
          ))}
        </AdminTableBody>
      </AdminDataTable>

      <ToolFormDialog open={formOpen} onOpenChange={setFormOpen} tool={editingTool} />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete this tool?"
        description={
          deleteTarget ? (
            <>
              This removes &ldquo;{deleteTarget.name}&rdquo; from the catalog. Projects that
              reference it will keep the reference. This action cannot be undone.
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
