'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Phone, MessageSquare, Eye, Flame, Thermometer, Snowflake, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatRelativeTime, formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Lead } from '@/lib/types';

interface LeadsTableProps {
  leads: any[];
  totalPages: number;
  currentPage: number;
}

const TEMPERATURE_CONFIG = {
  hot: { icon: Flame, className: 'badge-hot' },
  warm: { icon: Thermometer, className: 'badge-warm' },
  cold: { icon: Snowflake, className: 'badge-cold' },
};

export function LeadsTable({ leads, totalPages, currentPage }: LeadsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/leads?${params.toString()}`);
  }

  if (leads.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">👥</span>
        </div>
        <h3 className="font-semibold text-lg mb-2">No leads found</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Try adjusting your filters or add a new lead
        </p>
        <Link href="/leads/new" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-xl text-sm font-medium">
          Add First Lead
        </Link>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="text-left px-4 py-3">Lead</th>
              <th className="text-left px-4 py-3">Source</th>
              <th className="text-left px-4 py-3">Budget</th>
              <th className="text-left px-4 py-3">Assigned To</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Last Activity</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {leads.map((lead) => {
              const tempConfig = TEMPERATURE_CONFIG[lead.temperature as keyof typeof TEMPERATURE_CONFIG];
              const TempIcon = tempConfig?.icon ?? Thermometer;

              return (
                <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-sm font-bold text-blue-700 flex-shrink-0">
                        {lead.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-foreground">{lead.name}</div>
                        <div className="text-xs text-muted-foreground">{lead.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm capitalize">{lead.source?.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {lead.budget_min && lead.budget_max
                      ? `${formatCurrency(lead.budget_min)} – ${formatCurrency(lead.budget_max)}`
                      : lead.budget_max ? `Up to ${formatCurrency(lead.budget_max)}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {lead.assigned_user ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center text-xs font-bold text-purple-700">
                          {lead.assigned_user.full_name[0]}
                        </div>
                        <span className="text-xs">{lead.assigned_user.full_name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', `badge-${lead.status}`)}>
                        {lead.status}
                      </span>
                      <span className={cn('flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium border', tempConfig?.className)}>
                        <TempIcon className="w-3 h-3" />
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatRelativeTime(lead.updated_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </Link>
                      <Link
                        href={`/calls?lead=${lead.id}`}
                        className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                        title="Call lead"
                      >
                        <Phone className="w-4 h-4 text-blue-500" />
                      </Link>
                      <Link
                        href={`/leads/${lead.id}?tab=messages`}
                        className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                        title="Message lead"
                      >
                        <MessageSquare className="w-4 h-4 text-green-500" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-border">
        {leads.map((lead) => {
          const tempConfig = TEMPERATURE_CONFIG[lead.temperature as keyof typeof TEMPERATURE_CONFIG];
          const TempIcon = tempConfig?.icon ?? Thermometer;

          return (
            <Link key={lead.id} href={`/leads/${lead.id}`} className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-sm font-bold text-blue-700 flex-shrink-0">
                {lead.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{lead.name}</span>
                  <div className="flex items-center gap-1">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', `badge-${lead.status}`)}>
                      {lead.status}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{lead.phone} · {lead.source?.replace(/_/g, ' ')}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={cn('flex items-center gap-0.5 text-xs font-medium', tempConfig?.className?.split('border')[0])}>
                    <TempIcon className="w-3 h-3" />
                    {lead.temperature}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatRelativeTime(lead.updated_at)}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 hover:bg-muted rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 hover:bg-muted rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
