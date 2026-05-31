import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Phone, MessageSquare, Mail, Edit,
  Clock, MapPin, Flame, Thermometer, Snowflake
} from 'lucide-react';
import { formatDate, formatRelativeTime, formatCurrency, cn } from '@/lib/utils';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('leads').select('name').eq('id', id).single();
  return { title: data?.name ?? 'Lead Details' };
}

export default async function LeadDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { tab = 'overview' } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: lead } = await supabase
    .from('leads')
    .select(`
      *, 
      assigned_user:users!leads_assigned_to_fkey(id, full_name, phone, avatar_url),
      creator:users!leads_created_by_fkey(full_name)
    `)
    .eq('id', id)
    .single();

  if (!lead) notFound();

  const [
    { data: activities },
    { data: calls },
    { data: messages },
    { data: followUps },
  ] = await Promise.all([
    supabase.from('activities').select('*, user:users(full_name)').eq('lead_id', id).order('created_at', { ascending: false }).limit(20),
    supabase.from('calls').select('*, agent:users(full_name)').eq('lead_id', id).order('created_at', { ascending: false }),
    supabase.from('messages').select('*, user:users(full_name)').eq('lead_id', id).order('sent_at', { ascending: false }),
    supabase.from('follow_ups').select('*, assigned_user:users(full_name)').eq('lead_id', id).order('scheduled_at', { ascending: false }),
  ]);

  const tempIconMap = {
    hot: <Flame className="w-4 h-4 text-red-500" />,
    warm: <Thermometer className="w-4 h-4 text-orange-500" />,
    cold: <Snowflake className="w-4 h-4 text-blue-500" />,
  };

  const tabs = ['overview', 'timeline', 'calls', 'messages', 'follow-ups'];

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <Link href="/leads" className="p-2 hover:bg-muted rounded-xl transition-colors mt-1">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{lead.name}</h1>
            {tempIconMap[lead.temperature as keyof typeof tempIconMap]}
            <span className={cn('px-2.5 py-1 rounded-full text-sm font-medium', `badge-${lead.status}`)}>
              {lead.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Added {formatRelativeTime(lead.created_at)} by {lead.creator?.full_name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`tel:${lead.phone}`}
            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">Call</span>
          </Link>
          <Link
            href={`/leads/${id}/edit`}
            className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span className="hidden sm:inline">Edit</span>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card p-3 text-center">
          <div className="text-2xl font-bold text-blue-700">{calls?.length ?? 0}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Calls</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-2xl font-bold text-green-700">{messages?.length ?? 0}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Messages</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-2xl font-bold text-orange-700">{followUps?.filter((f: any) => f.status === 'pending').length ?? 0}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Follow-Ups</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl mb-5 overflow-x-auto">
        {tabs.map(t => (
          <Link
            key={t}
            href={`/leads/${id}?tab=${t}`}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap capitalize',
              tab === t ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t.replace('-', ' ')}
          </Link>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Contact Info */}
          <div className="card p-5">
            <h3 className="font-semibold mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Phone</div>
                  <a href={`tel:${lead.phone}`} className="text-sm font-medium text-blue-600">{lead.phone}</a>
                </div>
              </div>
              {lead.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Email</div>
                    <a href={`mailto:${lead.email}`} className="text-sm font-medium text-blue-600">{lead.email}</a>
                  </div>
                </div>
              )}
              {lead.location_preference && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Location Preference</div>
                    <div className="text-sm font-medium">{lead.location_preference}</div>
                  </div>
                </div>
              )}
              {lead.follow_up_date && (
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Next Follow-up</div>
                    <div className="text-sm font-medium">{formatDate(lead.follow_up_date, 'dd MMM yyyy, hh:mm a')}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Property Interest */}
          <div className="card p-5">
            <h3 className="font-semibold mb-4">Property Interest</h3>
            <div className="space-y-3">
              {lead.property_type && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium capitalize">{lead.property_type}</span>
                </div>
              )}
              {(lead.budget_min || lead.budget_max) && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Budget</span>
                  <span className="font-medium">
                    {lead.budget_min && lead.budget_max
                      ? `${formatCurrency(lead.budget_min)} – ${formatCurrency(lead.budget_max)}`
                      : lead.budget_max ? `Up to ${formatCurrency(lead.budget_max)}` : formatCurrency(lead.budget_min)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Source</span>
                <span className="font-medium capitalize">{lead.source?.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Temperature</span>
                <div className="flex items-center gap-1 font-medium capitalize">
                  {tempIconMap[lead.temperature as keyof typeof tempIconMap]}
                  {lead.temperature}
                </div>
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div className="card p-5">
            <h3 className="font-semibold mb-4">Assigned Agent</h3>
            {lead.assigned_user ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                  {lead.assigned_user.full_name[0]}
                </div>
                <div>
                  <div className="font-medium">{lead.assigned_user.full_name}</div>
                  <div className="text-sm text-muted-foreground">{lead.assigned_user.phone ?? 'No phone'}</div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No agent assigned yet</p>
            )}
          </div>

          {/* Notes */}
          {lead.notes && (
            <div className="card p-5">
              <h3 className="font-semibold mb-3">Notes</h3>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{lead.notes}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'timeline' && (
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Activity Timeline</h3>
          {activities && activities.length > 0 ? (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
              <div className="space-y-4">
                {activities.map((act: any, i: number) => (
                  <div key={act.id} className="flex items-start gap-4 pl-3">
                    <div className="relative z-10 w-6 h-6 rounded-full bg-card border-2 border-blue-500 flex items-center justify-center text-xs flex-shrink-0 -ml-2.5 mt-0.5">
                      {i === 0 ? '●' : '○'}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium">{act.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {act.user?.full_name} · {formatRelativeTime(act.created_at)}
                      </p>
                      {act.description && <p className="text-sm text-muted-foreground mt-1">{act.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No activity yet</p>
          )}
        </div>
      )}

      {tab === 'calls' && (
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Call History</h3>
          {calls && calls.length > 0 ? (
            <div className="space-y-3">
              {calls.map((call: any) => (
                <div key={call.id} className="p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', 
                      call.status === 'completed' ? 'badge-won' : 'badge-contacted')}>
                      {call.status}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(call.created_at)}</span>
                  </div>
                  <p className="text-sm">Agent: {call.agent?.full_name}</p>
                  {call.duration && <p className="text-xs text-muted-foreground">Duration: {Math.floor(call.duration / 60)}m {call.duration % 60}s</p>}
                  {call.outcome && <p className="text-xs text-muted-foreground capitalize">Outcome: {call.outcome}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No calls recorded</p>
          )}
        </div>
      )}

      {tab === 'messages' && (
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Message History</h3>
          {messages && messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map((msg: any) => (
                <div key={msg.id} className={cn('p-3 rounded-xl max-w-sm', msg.direction === 'outbound' ? 'ml-auto bg-blue-100 dark:bg-blue-950/50' : 'bg-muted')}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">{msg.channel}</span>
                    <span className="text-xs text-muted-foreground">{msg.direction}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{formatRelativeTime(msg.sent_at)}</span>
                  </div>
                  <p className="text-sm">{msg.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No messages</p>
          )}
        </div>
      )}

      {tab === 'follow-ups' && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Follow-ups</h3>
            <Link href={`/follow-ups/new?lead=${id}`} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              + Add Follow-up
            </Link>
          </div>
          {followUps && followUps.length > 0 ? (
            <div className="space-y-3">
              {followUps.map((fu: any) => (
                <div key={fu.id} className="p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{fu.title}</span>
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
                      fu.status === 'completed' ? 'badge-won' :
                      fu.status === 'pending' ? 'badge-new' : 'badge-contacted')}>
                      {fu.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(fu.scheduled_at, 'dd MMM yyyy, hh:mm a')} · {fu.channel} · {fu.assigned_user?.full_name}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No follow-ups scheduled</p>
          )}
        </div>
      )}
    </div>
  );
}
