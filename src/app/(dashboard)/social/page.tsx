import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Calendar, Instagram, Facebook, Twitter, Linkedin } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Social Media Planner' };

export default async function SocialPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  const orgId = profile?.organization_id;

  const { data: posts } = await supabase
    .from('social_posts')
    .select('*, created_by_user:users!social_posts_created_by_fkey(full_name)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(30);

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    pending_approval: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-blue-100 text-blue-700',
    scheduled: 'bg-purple-100 text-purple-700',
    published: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  const platformIcon: Record<string, React.ReactNode> = {
    instagram: <Instagram className="w-3.5 h-3.5" />,
    facebook: <Facebook className="w-3.5 h-3.5" />,
    twitter: <Twitter className="w-3.5 h-3.5" />,
    linkedin: <Linkedin className="w-3.5 h-3.5" />,
  };

  const grouped = {
    draft: posts?.filter(p => p.status === 'draft') ?? [],
    pending_approval: posts?.filter(p => p.status === 'pending_approval') ?? [],
    approved: posts?.filter(p => p.status === 'approved') ?? [],
    scheduled: posts?.filter(p => p.status === 'scheduled') ?? [],
    published: posts?.filter(p => p.status === 'published') ?? [],
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Social Media Planner</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{posts?.length ?? 0} total posts</p>
        </div>
        <Link
          href="/social/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Create Post
        </Link>
      </div>

      {/* Status summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
        {Object.entries(grouped).map(([status, posts]) => (
          <div key={status} className="card p-3 text-center">
            <div className="text-xl font-bold">{posts.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5 capitalize">{status.replace(/_/g, ' ')}</div>
          </div>
        ))}
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto">
        {Object.entries(grouped).map(([status, statusPosts]) => (
          <div key={status} className="min-w-[240px]">
            <div className="flex items-center gap-2 mb-3">
              <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', statusColors[status])}>
                {status.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-muted-foreground">({statusPosts.length})</span>
            </div>

            <div className="space-y-3">
              {statusPosts.map((post: any) => (
                <Link key={post.id} href={`/social/${post.id}`}>
                  <div className="card p-3 hover:shadow-sm transition-all cursor-pointer hover:-translate-y-0.5">
                    {/* Media preview */}
                    {post.media_urls?.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.media_urls[0]}
                        alt="Post media"
                        className="w-full h-28 object-cover rounded-lg mb-3"
                      />
                    ) : (
                      <div className="w-full h-28 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg mb-3 flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-blue-300" />
                      </div>
                    )}

                    <div className="text-sm font-medium mb-1 line-clamp-1">{post.title}</div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{post.caption}</p>

                    {/* Platforms */}
                    <div className="flex items-center gap-1.5 mb-2">
                      {post.platforms?.map((platform: string) => (
                        <div key={platform} className="text-muted-foreground">
                          {platformIcon[platform]}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{post.created_by_user?.full_name}</span>
                      {post.scheduled_at && (
                        <span>{formatDate(post.scheduled_at, 'dd MMM')}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}

              {statusPosts.length === 0 && (
                <div className="h-24 border-2 border-dashed border-border rounded-xl flex items-center justify-center text-xs text-muted-foreground">
                  No posts
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
