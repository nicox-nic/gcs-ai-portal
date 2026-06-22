import { GroupBadge } from '@/components/common/GroupBadge'
import { RoleBadge } from '@/components/common/RoleBadge'
import {
  AdminDataTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeadCell,
} from '@/components/admin/AdminDataTable'
import { TableRow } from '@/components/ui/table'
import { SEED_USERS } from '@/data/seedRoles'

export function AdminUsersTab() {
  return (
    <>
      <p className="mb-3 text-sm text-zinc-500">
        User management is read-only in Phase 0. In production, users will be synced from Azure
        Entra ID.
      </p>

      <AdminDataTable>
        <AdminTableHead>
          <AdminTableHeadCell>Display name</AdminTableHeadCell>
          <AdminTableHeadCell>Role</AdminTableHeadCell>
          <AdminTableHeadCell>Group</AdminTableHeadCell>
          <AdminTableHeadCell>Site</AdminTableHeadCell>
          <AdminTableHeadCell>Department</AdminTableHeadCell>
        </AdminTableHead>
        <AdminTableBody>
          {SEED_USERS.map((user) => (
            <TableRow key={user.id}>
              <AdminTableCell className="font-medium text-stone-900">
                {user.displayName}
              </AdminTableCell>
              <AdminTableCell>
                <RoleBadge role={user.role} />
              </AdminTableCell>
              <AdminTableCell>
                <GroupBadge group={user.group} />
              </AdminTableCell>
              <AdminTableCell>{user.site}</AdminTableCell>
              <AdminTableCell>{user.department}</AdminTableCell>
            </TableRow>
          ))}
        </AdminTableBody>
      </AdminDataTable>
    </>
  )
}
