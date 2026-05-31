'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Flame, Thermometer, Snowflake, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCallback, useTransition } from 'react';

interface LeadFiltersBarProps {
  agents: { id: string; full_name: string }[];
  currentFilters: {
    status?: string;
    temperature?: string;
    source?: string;
    assigned_to?: string;
    search?: string;
  };
}

const statuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
const temperatures = [
  { value: 'hot', icon: Flame, color: 'text-red-500' },
  { value: 'warm', icon: Thermometer, color: 'text-orange-500' },
  { value: 'cold', icon: Snowflake, color: 'text-blue-500' },
];
const sources = ['website', 'referral', 'social_media', 'cold_call', 'walk_in', 'portal', 'advertisement'];

export function LeadFiltersBar({ agents, currentFilters }: LeadFiltersBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateFilter(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  const hasFilters = Object.values(currentFilters).some(Boolean);

  return (
    <div className="card p-4 space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search by name, phone, or email..."
          defaultValue={currentFilters.search}
          onChange={e => updateFilter('search', e.target.value || undefined)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-2">
        {/* Temperature */}
        <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
          {temperatures.map(({ value, icon: Icon, color }) => (
            <button
              key={value}
              onClick={() => updateFilter('temperature', currentFilters.temperature === value ? undefined : value)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                currentFilters.temperature === value
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('w-3.5 h-3.5', color)} />
              <span className="capitalize">{value}</span>
            </button>
          ))}
        </div>

        {/* Status filter */}
        <select
          value={currentFilters.status ?? ''}
          onChange={e => updateFilter('status', e.target.value || undefined)}
          className="px-3 py-1.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Status</option>
          {statuses.map(s => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>

        {/* Source filter */}
        <select
          value={currentFilters.source ?? ''}
          onChange={e => updateFilter('source', e.target.value || undefined)}
          className="px-3 py-1.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Sources</option>
          {sources.map(s => (
            <option key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</option>
          ))}
        </select>

        {/* Agent filter */}
        {agents.length > 0 && (
          <select
            value={currentFilters.assigned_to ?? ''}
            onChange={e => updateFilter('assigned_to', e.target.value || undefined)}
            className="px-3 py-1.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Agents</option>
            {agents.map(a => (
              <option key={a.id} value={a.id}>{a.full_name}</option>
            ))}
          </select>
        )}

        {/* Clear filters */}
        {hasFilters && (
          <Link
            href="/leads"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </Link>
        )}

        {isPending && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Filtering...
          </div>
        )}
      </div>
    </div>
  );
}
