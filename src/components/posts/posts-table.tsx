"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowUpDown, ImageIcon } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PostActions } from "./post-actions"
import type { PostListItem } from "@/types"

type SortDirection = "asc" | "desc"

interface PostsTableProps {
  posts: PostListItem[]
}

export function PostsTable({ posts }: PostsTableProps) {
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const sorted = useMemo(() => {
    return [...posts].sort((a, b) => {
      const dateA = a.frontmatter.date
      const dateB = b.frontmatter.date
      return sortDirection === "desc"
        ? dateB.localeCompare(dateA)
        : dateA.localeCompare(dateB)
    })
  }, [posts, sortDirection])

  function toggleSort() {
    setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"))
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[35%]">Title</TableHead>
          <TableHead className="w-[20%]">Slug</TableHead>
          <TableHead className="w-[12%]">
            <Button
              variant="ghost"
              size="xs"
              className="-ml-2 gap-1 font-medium"
              onClick={toggleSort}
            >
              Date
              <ArrowUpDown className="size-3" />
            </Button>
          </TableHead>
          <TableHead className="w-[22%]">Tags</TableHead>
          <TableHead className="w-[5%]">
            <span className="sr-only">Banner</span>
          </TableHead>
          <TableHead className="w-[6%] text-right">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((post) => (
          <TableRow key={post.frontmatter.slug}>
            <TableCell className="font-medium">
              <Link
                href={`/posts${post.frontmatter.slug}/edit`}
                className="text-foreground transition-colors hover:text-primary"
              >
                {post.frontmatter.title}
              </Link>
            </TableCell>
            <TableCell>
              <span className="max-w-[180px] truncate block font-mono text-xs text-muted-foreground">
                {post.frontmatter.slug}
              </span>
            </TableCell>
            <TableCell>
              <span className="font-mono text-xs text-muted-foreground">
                {post.frontmatter.date}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap items-center gap-1">
                {post.frontmatter.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[11px]">
                    {tag}
                  </Badge>
                ))}
                {post.frontmatter.tags.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{post.frontmatter.tags.length - 3}
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell>
              {post.hasBanner && (
                <ImageIcon className="size-3.5 text-muted-foreground" />
              )}
            </TableCell>
            <TableCell className="text-right">
              <PostActions slug={post.frontmatter.slug} title={post.frontmatter.title} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
