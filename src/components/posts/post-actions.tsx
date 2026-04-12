"use client"

import Link from "next/link"
import { MoreHorizontal, Pencil, Trash2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface PostActionsProps {
  slug: string
}

export function PostActions({ slug }: PostActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-xs">
            <MoreHorizontal className="size-3.5" />
            <span className="sr-only">Open menu</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" side="bottom" sideOffset={4}>
        <DropdownMenuItem
          render={<Link href={`/posts${slug}/edit`} />}
        >
          <Pencil />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          render={
            <a
              href={`https://juneyoung.io${slug}`}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          <ExternalLink />
          View on blog
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            console.log("Delete post:", slug)
          }}
        >
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
