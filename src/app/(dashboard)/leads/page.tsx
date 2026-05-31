import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Filter, Download } from 'lucide-react';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { LeadFiltersBar } from '@/components/leads/LeadFiltersBar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leads',
};

interface PageProps {
  searchParams: Promise<{
    status?: string;
    temperature?: string;
    source?: string;
    assigned_to?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const params = await searchParams;

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  const orgId = profile?.organization_id;
  const page = parseInt(params.page ?? '1');
  const perPage = 20;
  const offset = (page - 1) * perPage;

  let query = supabase
    .from('leads')
    .select(`
      id, name, phone, email, source, property_type,
      budget_min, budget_max, location_preference,
      status, temperature, notes, follow_up_date,
      last_contact_date, created_at, updated_at,
      assigned_user:users!leads_assigned_to_fkey(id, full_name, avatar_url)
    `, { count: 'exact' })
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1);

  if (params.status) query = query.eq('status', params.status);
  if (params.temperature) query = query.eq('temperature', params.temperature);
  if (params.source) query = query.eq('source', params.source);
  if (params.assigned_to) query = query.eq('assigned_to', params.assigned_to);
  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,phone.ilike.%${params.search}%,email.ilike.%${params.search}%`);
  }

  const { data: leads, count } = await query;

  // Get agents for filter
  const { data: agents } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('organization_id', orgId)
    .in('role', ['sales_agent', 'sales_manager'])
    .eq('is_active', true);

  const totalPages = Math.ceil((count ?? 0) / perPage);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {count ?? 0} total leads
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-xl text-sm hover:bg-muted transition-colors">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <Link
            href="/leads/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lead</span>
          </Link>
        </div>
      </div>

      <LeadFiltersBar agents={agents ?? []} currentFilters={params} />

      <div className="mt-4">
        <LeadsTable 
          leads={leads ?? []} 
          totalPages={totalPages}
          currentPage={page}
        />
      </div>
    </div>
  );
}
