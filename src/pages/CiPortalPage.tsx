import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { TierBadge } from '@/components/common/TierBadge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ciPortal } from '@/lib/ciPortalAdapter'
import { formatDate } from '@/lib/utils'
import { useProjectsStore } from '@/stores/projectsStore'

export function CiPortalPage() {
  const projects = useProjectsStore((s) => s.projects)
  const records = useMemo(() => ciPortal.list(), [projects])

  return (
    <>
      <PageHeader
        title="CI Portal Mirror"
        subtitle="Read-only projection of AI portal projects into a CI Portal–shaped record set."
        className="mb-4"
      />

      <div className="mb-3 rounded-md border-[0.5px] border-indigo-200 bg-indigo-50 px-3 py-2 text-[11px] text-indigo-900">
        Mirror · read-only · mock integration — swap <code>LocalMirrorAdapter</code> for a remote
        adapter later without changing this page.
      </div>

      <div className="overflow-hidden rounded-lg border-[0.5px] border-stone-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">CI ID</TableHead>
              <TableHead className="text-xs">Project Name</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Tier</TableHead>
              <TableHead className="text-xs">Reward</TableHead>
              <TableHead className="text-xs">Submitter</TableHead>
              <TableHead className="text-xs">Sponsor</TableHead>
              <TableHead className="text-xs">Business Analyst</TableHead>
              <TableHead className="text-xs">Data Engineer</TableHead>
              <TableHead className="text-xs">Program Manager</TableHead>
              <TableHead className="text-xs">Maintenance Owner</TableHead>
              <TableHead className="text-xs">Requirements</TableHead>
              <TableHead className="text-xs">UAT</TableHead>
              <TableHead className="text-xs">Health</TableHead>
              <TableHead className="text-xs">Drift</TableHead>
              <TableHead className="text-xs">Group / Site</TableHead>
              <TableHead className="text-xs">Benefit hrs</TableHead>
              <TableHead className="text-xs">Last activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((row) => (
              <TableRow key={row.ciId}>
                <TableCell className="text-[11px] text-stone-600">{row.ciId}</TableCell>
                <TableCell>
                  <Link
                    to={`/projects/${row.ciId}`}
                    className="text-xs font-medium text-indigo-700 hover:underline"
                  >
                    {row.projectName}
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusBadge kind="project" status={row.status} />
                </TableCell>
                <TableCell>
                  {row.tier ? <TierBadge tier={row.tier} compact /> : '—'}
                </TableCell>
                <TableCell className="text-[11px] text-stone-600">
                  {row.rewardCategory ?? '—'}
                </TableCell>
                <TableCell className="text-[11px] text-stone-700">{row.submitterName}</TableCell>
                <TableCell className="text-[11px] text-stone-700">{row.sponsorName}</TableCell>
                <TableCell className="text-[11px] text-stone-700">
                  {row.businessAnalystName}
                </TableCell>
                <TableCell className="text-[11px] text-stone-700">
                  {row.dataEngineerName}
                </TableCell>
                <TableCell className="text-[11px] text-stone-700">
                  {row.programManagerName}
                </TableCell>
                <TableCell className="text-[11px] text-stone-700">
                  {row.maintenanceOwnerName}
                </TableCell>
                <TableCell className="text-[11px] text-stone-700">
                  {row.requirementsStatus}
                </TableCell>
                <TableCell className="text-[11px] text-stone-700">{row.uatStatus}</TableCell>
                <TableCell className="text-[11px] text-stone-700">{row.healthStatus}</TableCell>
                <TableCell className="text-[11px] text-stone-700">{row.driftStatus}</TableCell>
                <TableCell className="text-[11px] text-stone-600">
                  {row.group} · {row.site}
                </TableCell>
                <TableCell className="text-[11px] text-stone-700">
                  {row.reportedBenefitHours ?? '—'}
                </TableCell>
                <TableCell className="text-[11px] text-stone-500">
                  {formatDate(row.lastActivityAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
