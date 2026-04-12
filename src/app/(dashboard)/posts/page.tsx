"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Plus, Search, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { PostsTable } from "@/components/posts/posts-table"
import { usePosts } from "@/hooks/use-posts"

export default function PostsPage() {
  const { data: posts, isLoading, isError } = usePosts()
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!posts) return []
    if (!search.trim()) return posts
    const q = search.toLowerCase()
    return posts.filter((p) =>
      p.frontmatter.title.toLowerCase().includes(q),
    )
  }, [posts, search])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Posts</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your blog posts
          </p>
        </div>
        <Button render={<Link href="/posts/new" />}>
          <Plus />
          New Post
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search posts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {isLoading && <PostsLoadingSkeleton />}

      {isError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load posts. Please try again.
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState hasSearch={search.trim().length > 0} />
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="rounded-lg border">
          <PostsTable posts={filtered} />
        </div>
      )}
    </div>
  )
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  if (hasSearch) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Search className="mb-3 size-8 text-muted-foreground/50" />
        <p className="text-sm font-medium text-muted-foreground">
          No posts match your search
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <FileText className="mb-3 size-8 text-muted-foreground/50" />
      <p className="text-sm font-medium">No posts yet</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Get started by creating your first post.
      </p>
      <Button
        variant="outline"
        size="sm"
        className="mt-4"
        render={<Link href="/posts/new" />}
      >
        <Plus />
        Create your first post
      </Button>
    </div>
  )
}

function PostsLoadingSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}
