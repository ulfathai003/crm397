'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface NewLeadFormProps {
  agents: { id: string; full_name: string }[];
  userId: string;
  organizationId: string;
}

const SOURCES = ['website', 'referral', 'social_media', 'cold_call', 'walk_in', 'portal', 'advertisement', 'other'];
const PROPERTY_TYPES = ['apartment', 'villa', 'plot', 'commercial', 'office', 'warehouse', 'farmhouse', 'penthouse'];
const STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation'];
const TEMPERATURES = ['hot', 'warm', 'cold'];

export function NewLeadForm({ agents, userId, organizationId }: NewLeadFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'website',
    property_type: '',
    budget_min: '',
    budget_max: '',
    location_preference: '',
    status: 'new',
    temperature: 'warm',
    assigned_to: '',
    notes: '',
    follow_up_date: '',
  });

  function updateForm(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast.error('Name and phone are required');
      return;
    }

    setIsLoading(true);
    try {
      const { data: lead, error } = await supabase.from('leads').insert({
        organization_id: organizationId,
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        source: form.source,
        property_type: form.property_type || null,
        budget_min: form.budget_min ? parseInt(form.budget_min) : null,
        budget_max: form.budget_max ? parseInt(form.budget_max) : null,
        location_preference: form.location_preference || null,
        status: form.status,
        temperature: form.temperature,
        assigned_to: form.assigned_to || null,
        notes: form.notes || null,
        follow_up_date: form.follow_up_date || null,
        created_by: userId,
      }).select('id').single();

      if (error) throw error;

      // Log activity
      await supabase.from('activities').insert({
        organization_id: organizationId,
        lead_id: lead.id,
        user_id: userId,
        type: 'note',
        title: `Lead created: ${form.name}`,
        metadata: { created_by: userId },
      });

      toast.success('Lead created successfully!');
      router.push(`/leads/${lead.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create lead');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/leads" className="p-2 hover:bg-muted rounded-xl transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Lead</h1>
          <p className="text-sm text-muted-foreground">Add a new lead to your pipeline</p>
        </div>
      </div>

      <div className="card p-6 space-y-5">
        {/* Contact Info */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contact Information</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1.5">Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => updateForm('name', e.target.value)}
                placeholder="John Doe"
                required
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Phone *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => updateForm('phone', e.target.value)}
                placeholder="+91 98765 43210"
                required
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => updateForm('email', e.target.value)}
                placeholder="john@example.com"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              />
            </div>
          </div>
        </div>

        {/* Lead Details */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Lead Details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1.5">Source</label>
              <select value={form.source} onChange={e => updateForm('source', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm">
                {SOURCES.map(s => <option key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Property Type</label>
              <select value={form.property_type} onChange={e => updateForm('property_type', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm">
                <option value="">Select type</option>
                {PROPERTY_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Budget Min (₹)</label>
              <input type="number" value={form.budget_min} onChange={e => updateForm('budget_min', e.target.value)} placeholder="2000000" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Budget Max (₹)</label>
              <input type="number" value={form.budget_max} onChange={e => updateForm('budget_max', e.target.value)} placeholder="5000000" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Location Preference</label>
              <input type="text" value={form.location_preference} onChange={e => updateForm('location_preference', e.target.value)} placeholder="e.g., Bandra, Mumbai" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm" />
            </div>
          </div>
        </div>

        {/* Assignment & Status */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Assignment & Status</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Status</label>
              <select value={form.status} onChange={e => updateForm('status', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm">
                {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Temperature</label>
              <select value={form.temperature} onChange={e => updateForm('temperature', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm">
                {TEMPERATURES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Assign To</label>
              <select value={form.assigned_to} onChange={e => updateForm('assigned_to', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm">
                <option value="">Auto-assign</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Notes & Follow-up */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Notes & Follow-up</h3>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Notes</label>
              <textarea value={form.notes} onChange={e => updateForm('notes', e.target.value)} placeholder="Add any relevant notes about this lead..." rows={3} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Follow-up Date</label>
              <input type="datetime-local" value={form.follow_up_date} onChange={e => updateForm('follow_up_date', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm" />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Lead'}
          </button>
          <Link href="/leads" className="px-6 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors">
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}
