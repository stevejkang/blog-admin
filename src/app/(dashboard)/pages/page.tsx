import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PagesTable } from "@/components/pages/pages-table"

export default function PagesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pages</h1>
          <p className="mt-1 text-muted-foreground">Manage your site pages</p>
        </div>
        <Button size="sm" nativeButton={false} render={<Link href="/pages/new" />}>
          <Plus />
          New Page
        </Button>
      </div>

      <PagesTable />
    </div>
  )
}
