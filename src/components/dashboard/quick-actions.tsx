"use client"

import Link from "next/link"
import { Plus, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

const actions = [
  { label: "New Post", href: "/posts/new", icon: Plus, external: false },
  { label: "New Page", href: "/pages/new", icon: Plus, external: false },
  {
    label: "View Blog",
    href: "https://juneyoung.io",
    icon: ExternalLink,
    external: true,
  },
  {
    label: "View Repo",
    href: "https://github.com/stevejkang/blog",
    icon: ExternalLink,
    external: true,
  },
] as const

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => {
        const Icon = action.icon
        if (action.external) {
          return (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              render={
                <a
                  href={action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <Icon data-icon="inline-start" className="size-3.5" />
              {action.label}
            </Button>
          )
        }
        return (
          <Button
            key={action.label}
            variant="outline"
            size="sm"
            render={<Link href={action.href} />}
          >
            <Icon data-icon="inline-start" className="size-3.5" />
            {action.label}
          </Button>
        )
      })}
    </div>
  )
}
