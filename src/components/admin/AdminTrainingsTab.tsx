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
import { TrainingFormDialog } from '@/components/admin/TrainingFormDialog'
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useCatalogStore } from '@/stores/catalogStore'
import type { Training } from '@/types'

export function AdminTrainingsTab() {
  const trainings = useCatalogStore((state) => state.trainings)
  const deleteTraining = useCatalogStore((state) => state.deleteTraining)

  const [formOpen, setFormOpen] = useState(false)
  const [editingTraining, setEditingTraining] = useState<Training | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Training | null>(null)

  const openCreate = () => {
    setEditingTraining(null)
    setFormOpen(true)
  }

  const openEdit = (training: Training) => {
    setEditingTraining(training)
    setFormOpen(true)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteTraining(deleteTarget.id)
    toast.success('Training deleted.')
    setDeleteTarget(null)
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-zinc-500">{trainings.length} trainings in catalog</p>
        <Button
          type="button"
          className="h-8 bg-indigo-600 text-xs transition-colors hover:bg-indigo-700"
          onClick={openCreate}
        >
          <Plus className="h-3.5 w-3.5" />
          Add training
        </Button>
      </div>

      <AdminDataTable>
        <AdminTableHead>
          <AdminTableHeadCell>Title</AdminTableHeadCell>
          <AdminTableHeadCell>Provider</AdminTableHeadCell>
          <AdminTableHeadCell>Format</AdminTableHeadCell>
          <AdminTableHeadCell>Duration</AdminTableHeadCell>
          <AdminTableHeadCell>Skill level</AdminTableHeadCell>
          <AdminTableHeadCell>Linked tools</AdminTableHeadCell>
          <AdminTableHeadCell>Availability</AdminTableHeadCell>
          <AdminTableHeadCell>
            <span className="sr-only">Actions</span>
          </AdminTableHeadCell>
        </AdminTableHead>
        <AdminTableBody>
          {trainings.map((training) => (
            <TableRow key={training.id}>
              <AdminTableCell className="max-w-[200px] truncate font-medium text-stone-900">
                {training.title}
              </AdminTableCell>
              <AdminTableCell>{training.provider}</AdminTableCell>
              <AdminTableCell>{training.format}</AdminTableCell>
              <AdminTableCell>{training.durationHours}h</AdminTableCell>
              <AdminTableCell>{training.skillLevel}</AdminTableCell>
              <AdminTableCell>{training.toolIds.length}</AdminTableCell>
              <AdminTableCell>
                <span
                  className={cn(
                    'inline-flex rounded-sm px-2 py-0.5 text-xs font-semibold',
                    training.availability === 'Available'
                      ? 'bg-green-50 text-green-800'
                      : 'bg-stone-100 text-stone-600',
                  )}
                >
                  {training.availability === 'Available' ? 'Available' : 'Coming soon'}
                </span>
              </AdminTableCell>
              <AdminTableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-7 px-2 text-sm transition-colors"
                    onClick={() => openEdit(training)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-7 px-2 text-sm text-red-600 transition-colors hover:text-red-700"
                    onClick={() => setDeleteTarget(training)}
                  >
                    Delete
                  </Button>
                </div>
              </AdminTableCell>
            </TableRow>
          ))}
        </AdminTableBody>
      </AdminDataTable>

      <TrainingFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        training={editingTraining}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete this training?"
        description={
          deleteTarget ? (
            <>
              This removes &ldquo;{deleteTarget.title}&rdquo; from the catalog. This action
              cannot be undone.
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
