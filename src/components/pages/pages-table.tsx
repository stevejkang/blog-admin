"use client"

import Link from "next/link"
import { FilePlus } from "lucide-react"
import { usePages } from "@/hooks/use-pages"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageActions } from "./page-actions"

function PagesTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}

function PagesEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
        <FilePlus className="size-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-sm font-medium">No pages yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Get started by creating your first page.
      </p>
      <Button size="sm" className="mt-4" render={<Link href="/pages/new" />}>
        Create a page
      </Button>
    </div>
  )
}

export function PagesTable() {
  const { data: pages, isLoading, isError, error } = usePages()

  if (isLoading) {
    return <PagesTableSkeleton />
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Failed to load pages: {error.message}
      </div>
    )
  }

  if (!pages || pages.length === 0) {
    return <PagesEmptyState />
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pages.map((page) => {
            const cleanSlug = page.frontmatter.slug.replace(/^\//, "")
            return (
              <TableRow key={page.directoryName}>
                <TableCell>
                  <Link
                    href={`/pages/${cleanSlug}/edit`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {page.frontmatter.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                    {page.frontmatter.slug}
                  </code>
                </TableCell>
                <TableCell>
                  <PageActions slug={page.frontmatter.slug} title={page.frontmatter.title} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
