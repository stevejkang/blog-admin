import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { fetchPosts } from "@/lib/api/posts"
import { fetchPages } from "@/lib/api/pages"
import { fetchApi } from "@/lib/api/client"
import type { Tag } from "@/types"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RecentPosts } from "@/components/dashboard/recent-posts"
import { TagDistribution } from "@/components/dashboard/tag-distribution"
import { QuickActions } from "@/components/dashboard/quick-actions"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const queryClient = new QueryClient()

  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: queryKeys.posts.lists(),
      queryFn: fetchPosts,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.pages.lists(),
      queryFn: fetchPages,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.tags.all,
      queryFn: () => fetchApi<Tag[]>("/api/tags"),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Content overview and management
            </p>
          </div>
          <QuickActions />
        </div>

        <StatsCards />

        <div className="grid gap-4 lg:grid-cols-2">
          <RecentPosts />
          <TagDistribution />
        </div>
      </div>
    </HydrationBoundary>
  )
}
