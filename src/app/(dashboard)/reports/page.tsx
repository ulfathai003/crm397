import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BarChart3, TrendingUp, Users, Phone, Home, Star } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Reports' };

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  const orgId = profile?.organization_id;

  // Aggregate data for reports
  const [
    { data: leadsBySource },
    { data: leadsByStatus },
    { data: agentPerformance },
    { data: wonLeads },
    { data: lostLeads },
  ] = await Promise.all([
    supabase.from('leads').select('source').eq('organization_id', orgId),
    supabase.from('leads').select('status').eq('organization_id', orgId),
    supabase.from('users').select(`
      id, full_name,
      leads:leads(id, status),
      calls:calls(id, status)
    `).eq('organization_id', orgId).in('role', ['sales_agent', 'sales_manager']),
    supabase.from('leads').select('id, name, budget_max, created_at')
      .eq('organization_id', orgId).eq('status', 'won').order('created_at', { ascending: false }).limit(10),
    supabase.from('leads').select('id, name, source, created_at')
      .eq('organization_id', orgId).eq('status', 'lost').order('created_at', { ascending: false }).limit(10),
  ]);

  // Process data
  const sourceCount: Record<string, number> = {};
  leadsBySource?.forEach(l => {
    sourceCount[l.source] = (sourceCount[l.source] || 0) + 1;
  });

  const statusCount: Record<string, number> = {};
  leadsByStatus?.forEach(l => {
    statusCount[l.status] = (statusCount[l.status] || 0) + 1;
  });

  const totalLeads = leadsByStatus?.length ?? 0;
  const conversionRate = totalLeads > 0
    ? Math.round(((statusCount['won'] ?? 0) / totalLeads) * 100)
    : 0;

  const sourceColors: Record<string, string> = {
    website: 'bg-blue-500',
    referral: 'bg-green-500',
    social_media: 'bg-purple-500',
    cold_call: 'bg-orange-500',
    walk_in: 'bg-teal-500',
    portal: 'bg-rose-500',
    advertisement: 'bg-yellow-500',
    other: 'bg-gray-400',
  };

  const maxSource = Math.max(...Object.values(sourceCount), 1);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Business intelligence dashboard</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Leads', value: totalLeads, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Won Leads', value: statusCount['won'] ?? 0, icon: Star, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Conversion Rate', value: `${conversionRate}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Lost Leads', value: statusCount['lost'] ?? 0, icon: BarChart3, color: 'text-red-500', bg: 'bg-red-50' },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="card p-5">
              <div className={`inline-flex p-2 rounded-xl ${kpi.bg} mb-3`}>
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <div className="text-sm text-muted-foreground">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Leads by Source */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Leads by Source</h2>
          <div className="space-y-3">
            {Object.entries(sourceCount)
              .sort(([, a], [, b]) => b - a)
              .map(([source, count]) => (
                <div key={source}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="capitalize">{source.replace(/_/g, ' ')}</span>
                    <span className="font-medium">{count} ({Math.round((count / totalLeads) * 100)}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${sourceColors[source] ?? 'bg-gray-400'} transition-all`}
                      style={{ width: `${(count / maxSource) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Lead Status Distribution */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Lead Status Pipeline</h2>
          <div className="space-y-3">
            {[
              { key: 'new', label: 'New', color: 'bg-indigo-500' },
              { key: 'contacted', label: 'Contacted', color: 'bg-blue-500' },
              { key: 'qualified', label: 'Qualified', color: 'bg-cyan-500' },
              { key: 'proposal', label: 'Proposal', color: 'bg-yellow-500' },
              { key: 'negotiation', label: 'Negotiation', color: 'bg-orange-500' },
              { key: 'won', label: 'Won', color: 'bg-green-500' },
              { key: 'lost', label: 'Lost', color: 'bg-red-500' },
            ].map(({ key, label, color }) => {
              const count = statusCount[key] ?? 0;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{label}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color} transition-all`}
                      style={{ width: totalLeads > 0 ? `${(count / totalLeads) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Agent Performance */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold mb-4">Agent Performance</h2>
        {agentPerformance && agentPerformance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-3 py-2">Agent</th>
                  <th className="text-right px-3 py-2">Total Leads</th>
                  <th className="text-right px-3 py-2">Won</th>
                  <th className="text-right px-3 py-2">Calls</th>
                  <th className="text-right px-3 py-2">Conv. Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {agentPerformance.map((agent: any) => {
                  const totalLeads = agent.leads?.length ?? 0;
                  const wonLeads = agent.leads?.filter((l: any) => l.status === 'won').length ?? 0;
                  const totalCalls = agent.calls?.length ?? 0;
                  const convRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

                  return (
                    <tr key={agent.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                            {agent.full_name[0]}
                          </div>
                          <span className="text-sm font-medium">{agent.full_name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right text-sm">{totalLeads}</td>
                      <td className="px-3 py-3 text-right text-sm text-green-600 font-medium">{wonLeads}</td>
                      <td className="px-3 py-3 text-right text-sm">{totalCalls}</td>
                      <td className="px-3 py-3 text-right">
                        <span className={`text-sm font-medium ${convRate >= 50 ? 'text-green-600' : convRate >= 25 ? 'text-yellow-600' : 'text-red-500'}`}>
                          {convRate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">No agent data available</p>
        )}
      </div>

      {/* Won vs Lost */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-semibold mb-4 text-green-600">✅ Recent Won Leads</h2>
          {wonLeads && wonLeads.length > 0 ? (
            <div className="space-y-2">
              {wonLeads.map((lead: any) => (
                <div key={lead.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm font-medium">{lead.name}</span>
                  <span className="text-sm text-green-600 font-medium">
                    {lead.budget_max ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(lead.budget_max) : '—'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No won leads yet</p>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold mb-4 text-red-500">❌ Recent Lost Leads</h2>
          {lostLeads && lostLeads.length > 0 ? (
            <div className="space-y-2">
              {lostLeads.map((lead: any) => (
                <div key={lead.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm font-medium">{lead.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">{lead.source?.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No lost leads</p>
          )}
        </div>
      </div>
    </div>
  );
}
