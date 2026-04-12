"use client"

import { useState } from "react"
import Link from "next/link"
import { MoreHorizontal, Pencil, Trash2, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { useDeletePost } from "@/hooks/use-posts"
import { getErrorMessage } from "@/lib/api/errors"

interface PostActionsProps {
  slug: string
  title: string
}

export function PostActions({ slug, title }: PostActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const deleteMutation = useDeletePost()

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(slug)
      toast.success("Post deleted")
      setConfirmOpen(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <>
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
            onSelect={() => setConfirmOpen(true)}
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete "${title}"?`}
        description="This will remove the post and all associated images. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
        loading={deleteMutation.isPending}
      />
    </>
  )
}
