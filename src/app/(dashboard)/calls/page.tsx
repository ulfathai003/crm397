import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Phone, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatRelativeTime, formatDate, cn } from '@/lib/utils';
import { CallButton } from '@/components/calls/CallButton';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Calls' };

interface PageProps {
  searchParams: Promise<{ lead?: string; status?: string }>;
}

export default async function CallsPage({ searchParams }: PageProps) {
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

  let query = supabase
    .from('calls')
    .select(`
      *, 
      lead:leads(id, name, phone),
      agent:users!calls_agent_id_fkey(id, full_name)
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (params.lead) query = query.eq('lead_id', params.lead);
  if (params.status) query = query.eq('status', params.status);

  const { data: calls } = await query;

  // Pending leads to call
  const { data: pendingLeads } = await supabase
    .from('leads')
    .select('id, name, phone, temperature, status')
    .eq('organization_id', orgId)
    .eq('status', 'new')
    .is('assigned_to', null)
    .limit(5);

  const callStatusIcon: Record<string, React.ReactNode> = {
    completed: <CheckCircle className="w-4 h-4 text-green-500" />,
    failed: <XCircle className="w-4 h-4 text-red-500" />,
    no_answer: <XCircle className="w-4 h-4 text-orange-500" />,
    in_progress: <Phone className="w-4 h-4 text-blue-500 animate-pulse" />,
    pending: <Clock className="w-4 h-4 text-gray-400" />,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Calls</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{calls?.length ?? 0} total calls</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Call Log */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold">Call Log</h2>
            </div>
            {calls && calls.length > 0 ? (
              <div className="divide-y divide-border">
                {calls.map((call: any) => (
                  <div key={call.id} className="px-5 py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0">
                        {callStatusIcon[call.status as string] ?? <Phone className="w-4 h-4 text-blue-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{call.lead?.name}</span>
                          <span className="text-xs text-muted-foreground">{formatRelativeTime(call.created_at)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {call.lead?.phone} · Agent: {call.agent?.full_name}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
                            call.status === 'completed' ? 'badge-won' :
                            call.status === 'failed' ? 'badge-lost' : 'badge-contacted'
                          )}>
                            {call.status}
                          </span>
                          {call.duration && (
                            <span className="text-xs text-muted-foreground">
                              {Math.floor(call.duration / 60)}m {call.duration % 60}s
                            </span>
                          )}
                          {call.outcome && (
                            <span className="text-xs text-muted-foreground capitalize">· {call.outcome?.replace(/_/g, ' ')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No calls recorded yet
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Call Stats */}
          <div className="card p-5">
            <h3 className="font-semibold mb-4">Today's Summary</h3>
            <div className="space-y-3">
              {[
                { label: 'Total Calls', value: calls?.length ?? 0, color: 'text-blue-600' },
                { label: 'Completed', value: calls?.filter((c: any) => c.status === 'completed').length ?? 0, color: 'text-green-600' },
                { label: 'Failed', value: calls?.filter((c: any) => c.status === 'failed').length ?? 0, color: 'text-red-600' },
                { label: 'No Answer', value: calls?.filter((c: any) => c.status === 'no_answer').length ?? 0, color: 'text-orange-600' },
              ].map(stat => (
                <div key={stat.label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <span className={cn('font-bold', stat.color)}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Leads to Call */}
          {pendingLeads && pendingLeads.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold mb-4">Pending Calls</h3>
              <div className="space-y-2">
                {pendingLeads.map((lead: any) => (
                  <CallButton key={lead.id} lead={lead} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
