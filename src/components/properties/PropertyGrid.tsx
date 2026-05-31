'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Home, MapPin, Bed, Bath, Square, Share2, ExternalLink, Loader2 } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PropertyGridProps {
  properties: any[];
}

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  sold: 'bg-gray-100 text-gray-600',
  reserved: 'bg-yellow-100 text-yellow-700',
  under_construction: 'bg-blue-100 text-blue-700',
};

export function PropertyGrid({ properties }: PropertyGridProps) {
  if (properties.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <Home className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">No properties found</h3>
        <p className="text-muted-foreground text-sm mb-4">Add your first property to get started</p>
        <Link href="/properties/new" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-xl text-sm font-medium">
          Add Property
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {properties.map(property => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}

function PropertyCard({ property }: { property: any }) {
  const [sharing, setSharing] = useState(false);

  async function copyShareLink() {
    setSharing(true);
    const link = property.share_link || `${window.location.origin}/properties/share/${property.id}`;
    await navigator.clipboard.writeText(link);
    toast.success('Share link copied!');
    setSharing(false);
  }

  const hasImage = property.images?.length > 0;

  return (
    <div className="card overflow-hidden group hover:shadow-md transition-all duration-200">
      {/* Property Image */}
      <div className="relative h-48 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 overflow-hidden">
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Home className="w-16 h-16 text-blue-300" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', STATUS_COLORS[property.status] ?? 'bg-gray-100 text-gray-600')}>
            {property.status?.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="px-2 py-1 bg-black/60 text-white rounded-lg text-xs font-medium capitalize">
            {property.type}
          </span>
        </div>
      </div>

      {/* Property Info */}
      <div className="p-4">
        <h3 className="font-semibold text-sm mb-1 line-clamp-1">{property.title}</h3>
        <div className="flex items-center gap-1 text-muted-foreground text-xs mb-3">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{property.location}</span>
        </div>

        <div className="text-xl font-bold text-blue-700 dark:text-blue-400 mb-3">
          {formatCurrency(property.price)}
        </div>

        {/* Property Details */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          {property.bedrooms && (
            <div className="flex items-center gap-1">
              <Bed className="w-3 h-3" />
              <span>{property.bedrooms} BHK</span>
            </div>
          )}
          {property.bathrooms && (
            <div className="flex items-center gap-1">
              <Bath className="w-3 h-3" />
              <span>{property.bathrooms}</span>
            </div>
          )}
          {property.size && (
            <div className="flex items-center gap-1">
              <Square className="w-3 h-3" />
              <span>{property.size.toLocaleString()} {property.size_unit ?? 'sqft'}</span>
            </div>
          )}
        </div>

        {/* Amenities */}
        {property.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {property.amenities.slice(0, 3).map((a: string) => (
              <span key={a} className="px-2 py-0.5 bg-muted rounded-md text-xs">{a}</span>
            ))}
            {property.amenities.length > 3 && (
              <span className="px-2 py-0.5 bg-muted rounded-md text-xs">+{property.amenities.length - 3}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-border">
          <Link
            href={`/properties/${property.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-border rounded-xl text-xs font-medium hover:bg-muted transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View
          </Link>
          <button
            onClick={copyShareLink}
            disabled={sharing}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-medium transition-colors disabled:opacity-60"
          >
            {sharing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
