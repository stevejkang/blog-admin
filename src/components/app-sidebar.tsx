"use client"

import { useSession, signOut } from "next-auth/react"
import {
  LayoutDashboard,
  FileText,
  File,
  Tag,
  ExternalLink,
  GitBranch,
  LogOut,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { NavMain, type NavItem } from "@/components/nav-main"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const contentItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Posts", href: "/posts", icon: FileText },
  { title: "Pages", href: "/pages", icon: File },
  { title: "Tags", href: "/tags", icon: Tag },
]

const externalItems: NavItem[] = [
  {
    title: "Blog",
    href: "https://juneyoung.io",
    icon: ExternalLink,
    external: true,
  },
  {
    title: "GitHub",
    href: "https://github.com/stevejkang/blog",
    icon: GitBranch,
    external: true,
  },
]

function getInitials(name: string | null | undefined): string {
  if (!name) return "U"
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function AppSidebar() {
  const { data: session } = useSession()

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <FileText className="size-3.5" />
          </div>
          <span className="truncate text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            Blog Admin
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain label="Content" items={contentItems} />
        <SidebarSeparator />
        <NavMain label="External" items={externalItems} />
      </SidebarContent>

      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <Avatar size="sm">
              {session?.user?.image && (
                <AvatarImage
                  src={session.user.image}
                  alt={session.user.name ?? "User"}
                />
              )}
              <AvatarFallback>
                {getInitials(session?.user?.name)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate group-data-[collapsible=icon]:hidden">
              {session?.user?.name ?? "User"}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" sideOffset={8}>
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="mr-2 size-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
