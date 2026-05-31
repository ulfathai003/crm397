import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Users, Phone, Home, Clock, TrendingUp,
  TrendingDown, Activity, Building2, MapPin,
  ArrowRight, Flame, Thermometer, Snowflake
} from 'lucide-react';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  const orgId = profile?.organization_id;

  // Parallel data fetching
  const [
    { count: newLeads },
    { count: hotLeads },
    { count: totalCalls },
    { count: followUpsDue },
    { count: siteVisits },
    { count: totalProperties },
    { count: presentToday },
    { data: recentActivities },
    { data: recentLeads },
  ] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId).eq('status', 'new'),
    supabase.from('leads').select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId).eq('temperature', 'hot'),
    supabase.from('calls').select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    supabase.from('follow_ups').select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId).eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString()),
    supabase.from('activities').select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId).eq('type', 'visit'),
    supabase.from('properties').select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId).eq('status', 'available'),
    supabase.from('attendance').select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('date', new Date().toISOString().split('T')[0])
      .eq('status', 'present'),
    supabase.from('activities').select(`
      id, type, title, created_at,
      user:users(full_name)
    `).eq('organization_id', orgId).order('created_at', { ascending: false }).limit(8),
    supabase.from('leads').select(`
      id, name, phone, temperature, status, source, created_at,
      assigned_user:users!leads_assigned_to_fkey(full_name)
    `).eq('organization_id', orgId).order('created_at', { ascending: false }).limit(6),
  ]);

  const kpis = [
    {
      label: 'New Leads',
      value: newLeads ?? 0,
      icon: Users,
      color: 'from-blue-500 to-blue-700',
      href: '/leads?status=new',
      change: '+12%',
      up: true,
    },
    {
      label: 'Total Calls',
      value: totalCalls ?? 0,
      icon: Phone,
      color: 'from-purple-500 to-purple-700',
      href: '/calls',
      change: '+5%',
      up: true,
    },
    {
      label: 'Follow-Ups Due',
      value: followUpsDue ?? 0,
      icon: Clock,
      color: 'from-orange-500 to-orange-700',
      href: '/follow-ups',
      change: '-3%',
      up: false,
    },
    {
      label: 'Hot Leads',
      value: hotLeads ?? 0,
      icon: Flame,
      color: 'from-red-500 to-red-700',
      href: '/leads?temperature=hot',
      change: '+8%',
      up: true,
    },
    {
      label: 'Site Visits',
      value: siteVisits ?? 0,
      icon: MapPin,
      color: 'from-teal-500 to-teal-700',
      href: '/attendance',
      change: '+2%',
      up: true,
    },
    {
      label: 'Available Properties',
      value: totalProperties ?? 0,
      icon: Home,
      color: 'from-green-500 to-green-700',
      href: '/properties',
      change: '0%',
      up: true,
    },
    {
      label: 'Present Today',
      value: presentToday ?? 0,
      icon: Building2,
      color: 'from-indigo-500 to-indigo-700',
      href: '/attendance',
      change: '+1',
      up: true,
    },
    {
      label: 'Revenue Pipeline',
      value: formatCurrency(45000000),
      icon: Activity,
      color: 'from-emerald-500 to-emerald-700',
      href: '/reports',
      change: '+18%',
      up: true,
    },
  ];

  const temperatureIcon = {
    hot: <Flame className="w-3.5 h-3.5 text-red-500" />,
    warm: <Thermometer className="w-3.5 h-3.5 text-orange-500" />,
    cold: <Snowflake className="w-3.5 h-3.5 text-blue-500" />,
  };

  const activityIcon: Record<string, string> = {
    call: '📞',
    message: '💬',
    email: '📧',
    note: '📝',
    status_change: '🔄',
    assignment: '👤',
    follow_up: '⏰',
    visit: '🏠',
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={kpi.label}
              href={kpi.href}
              className="kpi-card group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-xl bg-gradient-to-br ${kpi.color} text-white shadow-sm`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${kpi.up ? 'text-green-600' : 'text-red-500'}`}>
                  {kpi.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {kpi.change}
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground mb-0.5">
                {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
              </div>
              <div className="text-xs text-muted-foreground">{kpi.label}</div>
            </Link>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Recent Leads */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Recent Leads</h2>
            <Link
              href="/leads"
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2">
            {recentLeads && recentLeads.length > 0 ? (
              recentLeads.map((lead: any) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-sm font-bold text-blue-700 flex-shrink-0">
                    {lead.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{lead.name}</span>
                      {temperatureIcon[lead.temperature as keyof typeof temperatureIcon]}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {lead.phone} · {lead.source} · {formatRelativeTime(lead.created_at)}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium badge-${lead.status}`}>
                    {lead.status}
                  </span>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No leads yet. <Link href="/leads/new" className="text-blue-600">Add first lead →</Link>
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Activity Feed</h2>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-xs text-green-600 font-medium">Live</span>
            </div>
          </div>

          <div className="space-y-3">
            {recentActivities && recentActivities.length > 0 ? (
              recentActivities.map((activity: any) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                    {activityIcon[activity.type as string] ?? '•'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-snug line-clamp-2">
                      {activity.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activity.user?.full_name} · {formatRelativeTime(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No recent activity
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/leads/new', label: 'Add Lead', icon: '➕', color: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400' },
          { href: '/calls', label: 'Start Call', icon: '📞', color: 'bg-green-50 text-green-700 border-green-100 dark:bg-green-950/30 dark:text-green-400' },
          { href: '/properties/new', label: 'Add Property', icon: '🏠', color: 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/30 dark:text-purple-400' },
          { href: '/attendance', label: 'Check In', icon: '📍', color: 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/30 dark:text-orange-400' },
        ].map(action => (
          <Link
            key={action.href}
            href={action.href}
            className={`flex items-center gap-2 p-3.5 rounded-xl border font-medium text-sm transition-all hover:shadow-sm hover:-translate-y-0.5 ${action.color}`}
          >
            <span className="text-lg">{action.icon}</span>
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
