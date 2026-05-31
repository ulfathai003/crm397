'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, Instagram, Facebook, Twitter, Linkedin, Sparkles, Save, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const socialPostSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  caption: z.string().min(5, 'Caption is required'),
  platforms: z.array(z.string()).min(1, 'Select at least one platform'),
  property_id: z.string().uuid().optional().or(z.literal('')),
  scheduled_at: z.string().optional(),
});

export function NewSocialPostForm({ organizationId, userId }: { organizationId: string, userId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const router = useRouter();
  const supabase = createClient();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<z.infer<typeof socialPostSchema>>({
    resolver: zodResolver(socialPostSchema),
    defaultValues: {
      platforms: ['instagram'],
      scheduled_at: new Date(Date.now() + 86400000).toISOString().slice(0, 16)
    }
  });

  const selectedPlatforms = watch('platforms');

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('properties').select('id, title').eq('organization_id', organizationId).order('title');
      if (data) setProperties(data);
    }
    fetchData();
  }, [organizationId, supabase]);

  async function generateAI() {
    const title = watch('title');
    if (!title) return toast.error('Enter a title first');
    
    setIsGeneratingCaption(true);
    // Simulation of AI generation
    setTimeout(() => {
      setValue('caption', `✨ Luxury living at its best! Just listed: ${title}. Featuring premium finishes, spacious layouts, and world-class amenities. DM for exclusive site visit. 🏡💎 #RealEstate #DreamHome #${title.replace(/\s+/g, '')}`);
      setIsGeneratingCaption(false);
      toast.success('AI Caption generated!');
    }, 1500);
  }

  async function onSubmit(data: z.infer<typeof socialPostSchema>) {
    setIsLoading(true);
    try {
      const { error } = await supabase.from('social_posts').insert({
        ...data,
        organization_id: organizationId,
        created_by: userId,
        status: 'draft',
        property_id: data.property_id || null,
      });

      if (error) throw error;
      toast.success('Post saved as draft');
      router.push('/social');
      router.refresh();
    } catch (error) {
      toast.error('Failed to create post');
    } finally {
      setIsLoading(false);
    }
  }

  const togglePlatform = (p: string) => {
    const current = selectedPlatforms;
    if (current.includes(p)) {
      setValue('platforms', current.filter(item => item !== p));
    } else {
      setValue('platforms', [...current, p]);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground uppercase">Post Title</label>
        <input {...register('title')} placeholder="New Launch - Signature Global" className="w-full px-3 py-2 rounded-xl border border-border bg-background" />
        {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
      </div>

      <div className="space-y-3">
        <label className="text-xs font-semibold text-muted-foreground uppercase">Target Platforms</label>
        <div className="flex gap-2">
          {[
            { id: 'instagram', icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50' },
            { id: 'facebook', icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50' },
            { id: 'twitter', icon: Twitter, color: 'text-sky-500', bg: 'bg-sky-50' },
            { id: 'linkedin', icon: Linkedin, color: 'text-blue-700', bg: 'bg-blue-50' },
          ].map(({ id, icon: Icon, color, bg }) => {
            const isActive = selectedPlatforms.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => togglePlatform(id)}
                className={`p-3 rounded-xl border transition-all ${isActive ? `border-transparent ${bg} ring-2 ring-blue-500` : 'border-border grayscale opacity-60'}`}
              >
                <Icon className={`w-5 h-5 ${color}`} />
              </button>
            );
          })}
        </div>
        {errors.platforms && <p className="text-xs text-red-500">{errors.platforms.message}</p>}
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Caption</label>
          <button
            type="button"
            onClick={generateAI}
            disabled={isGeneratingCaption}
            className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
          >
            {isGeneratingCaption ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            AI Write
          </button>
        </div>
        <textarea {...register('caption')} rows={6} placeholder="Write your caption here..." className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
        {errors.caption && <p className="text-xs text-red-500">{errors.caption.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Link Property</label>
          <select {...register('property_id')} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm">
            <option value="">No Property linked</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Schedule Time</label>
          <input {...register('scheduled_at')} type="datetime-local" className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
        </div>
      </div>

      <div className="p-12 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 bg-muted/30">
        <ImageIcon className="w-8 h-8 text-muted-foreground" />
        <div className="text-xs text-muted-foreground">Upload Media (Images/Videos)</div>
        <button type="button" className="text-xs font-bold text-blue-600">Select Files</button>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save as Draft
      </button>
    </form>
  );
}
