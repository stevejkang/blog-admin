"use client"

import { useMemo } from "react"
import { Globe, Image as ImageIcon } from "lucide-react"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SeoPreviewProps {
  title: string
  description: string
  slug: string
  bannerUrl?: string
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max).trimEnd() + "..."
}

type CountStatus = "good" | "warning" | "over"

function getCountStatus(count: number, warn: number, max: number): CountStatus {
  if (count > max) return "over"
  if (count >= warn) return "warning"
  return "good"
}

const statusColor: Record<CountStatus, string> = {
  good: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  over: "text-red-600 dark:text-red-400",
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SeoPreview({ title, description, slug, bannerUrl }: SeoPreviewProps) {
  const titleStatus = useMemo(
    () => getCountStatus(title.length, 50, 60),
    [title],
  )
  const descStatus = useMemo(
    () => getCountStatus(description.length, 140, 160),
    [description],
  )

  const displayTitle = title || "Untitled Post"
  const displayDescription = description || "No description provided."
  const displaySlug = slug ? slug.replace(/^\//, "") : "post-slug"

  return (
    <div className="space-y-5">
      {/* ---- Character counts ---- */}
      <div className="flex items-center gap-4 text-[11px] font-medium">
        <span className={statusColor[titleStatus]}>
          Title: {title.length}/60
        </span>
        <span className="text-border">|</span>
        <span className={statusColor[descStatus]}>
          Description: {description.length}/160
        </span>
      </div>

      {/* ---- Google SERP Preview ---- */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Search Result
        </p>
        <div className="rounded-lg border bg-card p-3.5 ring-1 ring-foreground/[0.03]">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Globe className="size-3 shrink-0" />
            <span className="truncate font-mono">
              juneyoung.io › {displaySlug}
            </span>
          </div>
          <h3 className="mt-1 text-sm font-medium leading-snug text-[oklch(0.45_0.15_250)] dark:text-[oklch(0.72_0.12_250)]">
            {truncate(displayTitle, 60)}
          </h3>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {truncate(displayDescription, 160)}
          </p>
        </div>
      </div>

      {/* ---- OG Card Preview ---- */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Social Card
        </p>
        <div className="overflow-hidden rounded-lg border ring-1 ring-foreground/[0.03]">
          {/* Banner area */}
          {bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bannerUrl}
              alt=""
              className="aspect-[1.91/1] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[1.91/1] w-full items-center justify-center bg-muted/60">
              <ImageIcon className="size-8 text-muted-foreground/40" />
            </div>
          )}
          {/* Text area */}
          <div className="border-t bg-card p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              juneyoung.io
            </p>
            <h4 className="mt-0.5 truncate text-sm font-medium leading-snug">
              {truncate(displayTitle, 60)}
            </h4>
            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {truncate(displayDescription, 160)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
