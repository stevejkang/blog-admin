"use client"

import { useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useTags } from "@/hooks/use-tags"

export function TagDistribution() {
  const { data: tags, isLoading } = useTags()

  const topTags = useMemo(() => {
    if (!tags) return []
    return [...tags].sort((a, b) => b.count - a.count).slice(0, 10)
  }, [tags])

  const maxCount = topTags[0]?.count ?? 1

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tag Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-3 w-14 animate-pulse rounded bg-muted" />
                <div
                  className="h-5 animate-pulse rounded bg-muted"
                  style={{ width: `${60 - i * 8}%` }}
                />
              </div>
            ))}
          </div>
        ) : topTags.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No tags yet
          </p>
        ) : (
          <div className="space-y-2">
            {topTags.map((tag) => {
              const pct = Math.max((tag.count / maxCount) * 100, 4)
              return (
                <div key={tag.name} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 truncate text-right font-mono text-[11px] text-muted-foreground">
                    {tag.name}
                  </span>
                  <div className="relative flex h-5 flex-1 items-center">
                    <div
                      className="h-full rounded bg-foreground/10 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                    <span className="ml-2 text-[11px] font-medium tabular-nums">
                      {tag.count}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
