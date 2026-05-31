import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { formatDate, formatRelativeTime, cn } from '@/lib/utils';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Follow-Ups' };

interface PageProps {
  searchParams: Promise<{ status?: string; channel?: string; lead?: string }>;
}

export default async function FollowUpsPage({ searchParams }: PageProps) {
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
    .from('follow_ups')
    .select(`
      *,
      lead:leads(id, name, phone),
      assigned_user:users!follow_ups_assigned_to_fkey(full_name)
    `)
    .eq('organization_id', orgId)
    .order('scheduled_at', { ascending: true });

  if (params.status) query = query.eq('status', params.status);
  else query = query.eq('status', 'pending');
  if (params.channel) query = query.eq('channel', params.channel);
  if (params.lead) query = query.eq('lead_id', params.lead);

  const { data: followUps } = await query.limit(50);

  const overdueCount = followUps?.filter(fu => new Date(fu.scheduled_at) < new Date()).length ?? 0;
  const dueToday = followUps?.filter(fu => {
    const d = new Date(fu.scheduled_at);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length ?? 0;

  const channelIcon: Record<string, string> = {
    whatsapp: '💬',
    sms: '📱',
    email: '✉️',
    call: '📞',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Follow-Ups</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {followUps?.length ?? 0} pending · {overdueCount} overdue · {dueToday} due today
          </p>
        </div>
        <Link
          href="/follow-ups/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Schedule
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {['pending', 'completed', 'snoozed', 'cancelled'].map(status => (
          <Link
            key={status}
            href={`/follow-ups?status=${status}`}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors',
              (params.status ?? 'pending') === status
                ? 'bg-blue-900 text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Link>
        ))}
      </div>

      {/* Follow-up cards */}
      <div className="space-y-3">
        {followUps && followUps.length > 0 ? (
          followUps.map((fu: any) => {
            const isOverdue = new Date(fu.scheduled_at) < new Date() && fu.status === 'pending';
            const isToday = new Date(fu.scheduled_at).toDateString() === new Date().toDateString();

            return (
              <div
                key={fu.id}
                className={cn(
                  'card p-4 transition-all hover:shadow-sm',
                  isOverdue && 'border-red-200 dark:border-red-800/50'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0',
                    isOverdue ? 'bg-red-100 dark:bg-red-950/30' : 'bg-muted'
                  )}>
                    {channelIcon[fu.channel] ?? '📋'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-medium text-sm">{fu.title}</h3>
                      {isOverdue && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          <AlertCircle className="w-3 h-3" />
                          Overdue
                        </span>
                      )}
                      {isToday && !isOverdue && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                          Due Today
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2 flex-wrap">
                      <Link href={`/leads/${fu.lead_id}`} className="font-medium text-blue-600 hover:underline">
                        {fu.lead?.name} ({fu.lead?.phone})
                      </Link>
                      <span>via {fu.channel}</span>
                      <span>·</span>
                      <span>{fu.assigned_user?.full_name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className={isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
                        {formatDate(fu.scheduled_at, 'dd MMM yyyy, hh:mm a')} ({formatRelativeTime(fu.scheduled_at)})
                      </span>
                    </div>

                    {fu.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{fu.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <FollowUpActions followUpId={fu.id} />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="font-semibold text-lg mb-2">All caught up!</h3>
            <p className="text-muted-foreground text-sm">No follow-ups in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FollowUpActions({ followUpId }: { followUpId: string }) {
  return (
    <div className="flex items-center gap-1">
      <Link href={`/follow-ups/${followUpId}`} className="p-1.5 hover:bg-muted rounded-lg transition-colors text-green-600" title="Mark complete">
        <CheckCircle className="w-4 h-4" />
      </Link>
      <Link href={`/follow-ups/${followUpId}?action=snooze`} className="p-1.5 hover:bg-muted rounded-lg transition-colors text-orange-500" title="Snooze">
        <Clock className="w-4 h-4" />
      </Link>
      <Link href={`/follow-ups/${followUpId}?action=cancel`} className="p-1.5 hover:bg-muted rounded-lg transition-colors text-red-500" title="Cancel">
        <XCircle className="w-4 h-4" />
      </Link>
    </div>
  );
}
