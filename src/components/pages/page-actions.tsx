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
import { useDeletePage } from "@/hooks/use-pages"
import { getErrorMessage } from "@/lib/api/errors"

interface PageActionsProps {
  slug: string
  title: string
}

export function PageActions({ slug, title }: PageActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const cleanSlug = slug.replace(/^\//, "")
  const deleteMutation = useDeletePage()

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(slug)
      toast.success("Page deleted")
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
            render={<Link href={`/pages/${cleanSlug}/edit`} />}
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
            View on site
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
        description="This will permanently remove the page. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
        loading={deleteMutation.isPending}
      />
    </>
  )
}
