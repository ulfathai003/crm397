'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, Home, MapPin, IndianRupee, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const propertySchema = z.object({
  title: z.string().min(3, 'Title is too short'),
  location: z.string().min(3, 'Location is required'),
  type: z.enum(['apartment', 'villa', 'plot', 'commercial', 'office', 'warehouse', 'farmhouse', 'penthouse']),
  price: z.coerce.number().min(1, 'Price is required'),
  size: z.coerce.number().optional(),
  bedrooms: z.coerce.number().optional(),
  bathrooms: z.coerce.number().optional(),
  status: z.enum(['available', 'sold', 'reserved', 'under_construction']).default('available'),
  description: z.string().optional(),
  amenities: z.string().optional(), // Will be split by comma
});

export function NewPropertyForm({ organizationId, userId }: { organizationId: string, userId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof propertySchema>>({
    resolver: zodResolver(propertySchema),
    defaultValues: { type: 'apartment', status: 'available' }
  });

  async function onSubmit(data: z.infer<typeof propertySchema>) {
    setIsLoading(true);
    try {
      const { error } = await supabase.from('properties').insert({
        ...data,
        organization_id: organizationId,
        created_by: userId,
        amenities: data.amenities ? data.amenities.split(',').map(s => s.trim()) : [],
      });

      if (error) throw error;
      toast.success('Property added successfully');
      router.push('/properties');
      router.refresh();
    } catch (error) {
      toast.error('Failed to add property');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Property Title</label>
          <div className="relative">
            <Home className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input {...register('title')} placeholder="Super Luxury 3BHK Apartment" className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background" />
          </div>
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input {...register('location')} placeholder="Sector 45, Gurgaon" className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background" />
          </div>
          {errors.location && <p className="text-xs text-red-500">{errors.location.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Type</label>
          <select {...register('type')} className="w-full px-3 py-2 rounded-xl border border-border bg-background">
            <option value="apartment">Apartment</option>
            <option value="villa">Villa</option>
            <option value="plot">Plot</option>
            <option value="commercial">Commercial</option>
            <option value="office">Office</option>
            <option value="warehouse">Warehouse</option>
            <option value="farmhouse">Farmhouse</option>
            <option value="penthouse">Penthouse</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Status</label>
          <select {...register('status')} className="w-full px-3 py-2 rounded-xl border border-border bg-background">
            <option value="available">Available</option>
            <option value="under_construction">Under Construction</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Sold</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Price (₹)</label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input {...register('price')} type="number" placeholder="7500000" className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Size (sqft)</label>
          <input {...register('size')} type="number" placeholder="1850" className="w-full px-3 py-2 rounded-xl border border-border bg-background" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Bedrooms</label>
          <input {...register('bedrooms')} type="number" placeholder="3" className="w-full px-3 py-2 rounded-xl border border-border bg-background" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Bathrooms</label>
          <input {...register('bathrooms')} type="number" placeholder="3" className="w-full px-3 py-2 rounded-xl border border-border bg-background" />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground uppercase">Amenities (comma separated)</label>
        <input {...register('amenities')} placeholder="Pool, Gym, Parking, Power Backup" className="w-full px-3 py-2 rounded-xl border border-border bg-background" />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground uppercase">Description</label>
        <textarea {...register('description')} rows={4} placeholder="Detailed property description..." className="w-full px-3 py-2 rounded-xl border border-border bg-background" />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Property
      </button>
    </form>
  );
}
