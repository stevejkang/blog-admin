"use client"

import { useMemo } from "react"
import { FileText, File, Tag, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { usePosts } from "@/hooks/use-posts"
import { usePages } from "@/hooks/use-pages"
import { useTags } from "@/hooks/use-tags"

interface StatCardProps {
  label: string
  value: number | string
  icon: React.ReactNode
  loading?: boolean
}

function StatCard({ label, value, icon, loading }: StatCardProps) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          {loading ? (
            <div className="mt-1 h-6 w-12 animate-pulse rounded bg-muted" />
          ) : (
            <p className="font-heading text-2xl font-semibold leading-none tracking-tight">
              {value}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function StatsCards() {
  const { data: posts, isLoading: postsLoading } = usePosts()
  const { data: pages, isLoading: pagesLoading } = usePages()
  const { data: tags, isLoading: tagsLoading } = useTags()

  const thisMonthCount = useMemo(() => {
    if (!posts) return 0
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    return posts.filter((p) => {
      const d = new Date(p.frontmatter.date)
      return d.getFullYear() === year && d.getMonth() === month
    }).length
  }, [posts])

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label="Total Posts"
        value={posts?.length ?? 0}
        icon={<FileText className="size-4" />}
        loading={postsLoading}
      />
      <StatCard
        label="Total Pages"
        value={pages?.length ?? 0}
        icon={<File className="size-4" />}
        loading={pagesLoading}
      />
      <StatCard
        label="Total Tags"
        value={tags?.length ?? 0}
        icon={<Tag className="size-4" />}
        loading={tagsLoading}
      />
      <StatCard
        label="This Month"
        value={thisMonthCount}
        icon={<Calendar className="size-4" />}
        loading={postsLoading}
      />
    </div>
  )
}
