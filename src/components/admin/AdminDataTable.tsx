import type { ReactNode } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

type AdminDataTableProps = {
  children: ReactNode
  className?: string
}

export function AdminDataTable({ children, className }: AdminDataTableProps) {
  return (
    <div
      className={cn(
        'max-h-[70vh] overflow-auto rounded-lg border-[0.5px] border-stone-200 bg-white',
        className,
      )}
    >
      <Table>
        {children}
      </Table>
    </div>
  )
}

export function AdminTableHead({ children }: { children: ReactNode }) {
  return (
    <TableHeader className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_theme(colors.stone.200)]">
      <TableRow className="hover:bg-transparent">{children}</TableRow>
    </TableHeader>
  )
}

export function AdminTableHeadCell({ children }: { children: ReactNode }) {
  return (
    <TableHead className="text-sm font-semibold text-zinc-500 uppercase">
      {children}
    </TableHead>
  )
}

export function AdminTableBody({ children }: { children: ReactNode }) {
  return <TableBody>{children}</TableBody>
}

export function AdminTableCell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <TableCell className={cn('text-sm text-stone-600', className)}>{children}</TableCell>
  )
}
