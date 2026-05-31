'use client';

import { useState } from 'react';
import { Phone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CallButtonProps {
  lead: {
    id: string;
    name: string;
    phone: string;
    temperature?: string;
  };
}

export function CallButton({ lead }: CallButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function initiateCall() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/calls/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: lead.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Calling ${lead.name}...`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Call failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
        {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{lead.name}</div>
        <div className="text-xs text-muted-foreground">{lead.phone}</div>
      </div>
      <button
        onClick={initiateCall}
        disabled={isLoading}
        className={cn(
          'p-2 rounded-lg transition-colors flex-shrink-0',
          isLoading ? 'bg-gray-100 cursor-not-allowed' : 'bg-green-100 hover:bg-green-200 text-green-700'
        )}
        title={`Call ${lead.name}`}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
      </button>
    </div>
  );
}
