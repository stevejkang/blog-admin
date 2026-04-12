"use client"

import * as React from "react"
import { format } from "date-fns"
import { AlertTriangle, ChevronRight, Hash, Search } from "lucide-react"
import { useTags } from "@/hooks/use-tags"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { Tag } from "@/types"

function TagRow({
  tag,
  maxCount,
}: {
  tag: Tag
  maxCount: number
}) {
  const [expanded, setExpanded] = React.useState(false)
  const barWidth = maxCount > 0 ? (tag.count / maxCount) * 100 : 0
  const isLowUsage = tag.count === 1

  return (
    <li>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
          "hover:bg-muted/60",
          expanded && "bg-muted/40"
        )}
      >
        <ChevronRight
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            expanded && "rotate-90"
          )}
        />

        <Hash className="size-3.5 shrink-0 text-muted-foreground/60" />

        <span className="min-w-0 flex-1 truncate text-sm">{tag.name}</span>

        {isLowUsage && (
          <AlertTriangle className="size-3.5 shrink-0 text-yellow-500" />
        )}

        <div className="hidden w-32 items-center gap-2 sm:flex">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-primary/20">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${barWidth}%` }}
            />
          </div>
        </div>

        <Badge variant="secondary" className="font-mono tabular-nums">
          {tag.count}
        </Badge>

        <span className="hidden whitespace-nowrap font-mono text-xs text-muted-foreground sm:inline">
          {format(new Date(tag.lastUsed), "yyyy-MM-dd")}
        </span>
      </button>

      {expanded && tag.posts.length > 0 && (
        <ul className="mb-1 ml-10 mt-0.5 space-y-0.5 border-l border-border pl-3">
          {tag.posts.map((post) => (
            <li key={post.slug}>
              <a
                href={`/posts/${post.slug}/edit`}
                className="group/link flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/60"
              >
                <span className="min-w-0 flex-1 truncate text-muted-foreground group-hover/link:text-foreground">
                  {post.title}
                </span>
                <span className="shrink-0 font-mono text-xs text-muted-foreground/60">
                  {format(new Date(post.date), "yyyy-MM-dd")}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

function TagListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
          <Skeleton className="size-4" />
          <Skeleton className="size-3.5" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-5 w-8" />
          <Skeleton className="hidden h-3 w-20 sm:block" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
        <Hash className="size-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">No tags yet</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Tags will appear here once posts are tagged
        </p>
      </div>
    </div>
  )
}

export default function TagsPage() {
  const { data: tags, isLoading, isError } = useTags()
  const [search, setSearch] = React.useState("")

  const filteredTags = React.useMemo(() => {
    if (!tags) return []
    if (!search.trim()) return tags
    const query = search.toLowerCase()
    return tags.filter((tag) => tag.name.toLowerCase().includes(query))
  }, [tags, search])

  const maxCount = React.useMemo(() => {
    if (!tags || tags.length === 0) return 0
    return Math.max(...tags.map((t) => t.count))
  }, [tags])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tags</h1>
          <p className="mt-1 text-muted-foreground">
            Content tags and usage overview
          </p>
        </div>
        {tags && tags.length > 0 && (
          <Badge variant="outline" className="ml-auto font-mono tabular-nums">
            {tags.length}
          </Badge>
        )}
      </div>

      {!isLoading && tags && tags.length > 0 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      )}

      {isLoading && <TagListSkeleton />}

      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Failed to load tags. Please try again.
        </div>
      )}

      {!isLoading && !isError && tags && tags.length === 0 && <EmptyState />}

      {!isLoading && !isError && filteredTags.length > 0 && (
        <ul className="space-y-0.5">
          {filteredTags.map((tag) => (
            <TagRow key={tag.name} tag={tag} maxCount={maxCount} />
          ))}
        </ul>
      )}

      {!isLoading &&
        !isError &&
        tags &&
        tags.length > 0 &&
        filteredTags.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No tags matching &ldquo;{search}&rdquo;
          </p>
        )}
    </div>
  )
}
