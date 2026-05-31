import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PropertyGrid } from '@/components/properties/PropertyGrid';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Properties' };

interface PageProps {
  searchParams: Promise<{
    status?: string;
    type?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function PropertiesPage({ searchParams }: PageProps) {
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
  const perPage = 12;
  const offset = (page - 1) * perPage;

  let query = supabase
    .from('properties')
    .select('*', { count: 'exact' })
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1);

  if (params.status) query = query.eq('status', params.status);
  if (params.type) query = query.eq('type', params.type);
  if (params.search) query = query.ilike('title', `%${params.search}%`);

  const { data: properties, count } = await query;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Properties</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{count ?? 0} properties</p>
        </div>
        <Link
          href="/properties/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Property
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search properties..."
          className="flex-1 min-w-48 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select className="px-3 py-2 rounded-xl border border-border bg-background text-sm">
          <option value="">All Status</option>
          {['available', 'sold', 'reserved', 'under_construction'].map(s => (
            <option key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select className="px-3 py-2 rounded-xl border border-border bg-background text-sm">
          <option value="">All Types</option>
          {['apartment', 'villa', 'plot', 'commercial', 'office', 'farmhouse', 'penthouse'].map(t => (
            <option key={t} value={t} className="capitalize">{t}</option>
          ))}
        </select>
      </div>

      <PropertyGrid properties={properties ?? []} />
    </div>
  );
}
