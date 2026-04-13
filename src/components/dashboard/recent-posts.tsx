"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Pencil } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { usePosts } from "@/hooks/use-posts"

export function RecentPosts() {
  const { data: posts, isLoading } = usePosts()

  const recent = useMemo(() => {
    if (!posts) return []
    return [...posts]
      .sort(
        (a, b) =>
          new Date(b.frontmatter.date).getTime() -
          new Date(a.frontmatter.date).getTime(),
      )
      .slice(0, 5)
  }, [posts])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Posts</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
                <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No posts yet
          </p>
        ) : (
          <div className="space-y-1">
            {recent.map((post) => (
              <div
                key={post.frontmatter.slug}
                className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50"
              >
                <Link
                  href={`/posts/${encodeURIComponent(post.frontmatter.slug)}/edit`}
                  className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
                >
                  {post.frontmatter.title}
                </Link>
                <time className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                  {post.frontmatter.date}
                </time>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {post.frontmatter.tags.length} tag{post.frontmatter.tags.length !== 1 ? "s" : ""}
                </span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  nativeButton={false}
                  render={
                    <Link
                      href={`/posts/${encodeURIComponent(post.frontmatter.slug)}/edit`}
                    />
                  }
                >
                  <Pencil className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
