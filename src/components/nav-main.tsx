"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  external?: boolean
  badge?: string
}

export function NavMain({
  label,
  items,
}: {
  label?: string
  items: NavItem[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => {
          const isActive =
            !item.external &&
            (item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href))

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={isActive}
                render={
                  item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  ) : (
                    <Link href={item.href} />
                  )
                }
              >
                <item.icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
