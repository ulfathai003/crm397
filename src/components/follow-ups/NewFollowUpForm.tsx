'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, Calendar, User, MessageSquare, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const followUpSchema = z.object({
  lead_id: z.string().uuid('Please select a lead'),
  title: z.string().min(3, 'Title is required'),
  description: z.string().optional(),
  channel: z.enum(['whatsapp', 'sms', 'email', 'call']),
  scheduled_at: z.string().min(1, 'Date and time are required'),
  assigned_to: z.string().uuid('Please assign to an agent'),
});

export function NewFollowUpForm({ organizationId, currentUserId }: { organizationId: string, currentUserId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const preselectedLead = searchParams.get('lead');

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof followUpSchema>>({
    resolver: zodResolver(followUpSchema),
    defaultValues: {
      lead_id: preselectedLead || '',
      assigned_to: currentUserId,
      channel: 'call',
      scheduled_at: new Date(Date.now() + 86400000).toISOString().slice(0, 16) // Tomorrow
    }
  });

  useEffect(() => {
    async function fetchData() {
      const [leadsRes, agentsRes] = await Promise.all([
        supabase.from('leads').select('id, name').eq('organization_id', organizationId).order('name'),
        supabase.from('users').select('id, full_name').eq('organization_id', organizationId).in('role', ['sales_agent', 'sales_manager']).eq('is_active', true)
      ]);
      if (leadsRes.data) setLeads(leadsRes.data);
      if (agentsRes.data) setAgents(agentsRes.data);
    }
    fetchData();
  }, [organizationId, supabase]);

  async function onSubmit(data: z.infer<typeof followUpSchema>) {
    setIsLoading(true);
    try {
      const { error } = await supabase.from('follow_ups').insert({
        ...data,
        organization_id: organizationId,
        created_by: currentUserId,
        status: 'pending'
      });

      if (error) throw error;
      toast.success('Follow-up scheduled');
      router.push('/follow-ups');
      router.refresh();
    } catch (error) {
      toast.error('Failed to schedule follow-up');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground uppercase">Select Lead</label>
        <select {...register('lead_id')} className="w-full px-3 py-2 rounded-xl border border-border bg-background">
          <option value="">Choose a lead...</option>
          {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        {errors.lead_id && <p className="text-xs text-red-500">{errors.lead_id.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground uppercase">Task Title</label>
        <input {...register('title')} placeholder="Discuss site visit feedback" className="w-full px-3 py-2 rounded-xl border border-border bg-background" />
        {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Channel</label>
          <select {...register('channel')} className="w-full px-3 py-2 rounded-xl border border-border bg-background">
            <option value="call">Call</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="sms">SMS</option>
            <option value="email">Email</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Scheduled At</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input {...register('scheduled_at')} type="datetime-local" className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background" />
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground uppercase">Assign To</label>
        <div className="relative">
          <User className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <select {...register('assigned_to')} className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background">
            {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground uppercase">Description / Notes</label>
        <textarea {...register('description')} rows={3} placeholder="Any specific points to discuss?" className="w-full px-3 py-2 rounded-xl border border-border bg-background" />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Schedule Follow-up
      </button>
    </form>
  );
}
