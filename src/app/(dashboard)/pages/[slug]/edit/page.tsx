"use client"

import { useParams } from "next/navigation"
import { usePage } from "@/hooks/use-pages"
import { PageForm } from "@/components/pages/page-form"
import { PageSkeleton } from "@/components/shared/loading-skeleton"

export default function EditPagePage() {
  const params = useParams()
  const slug = decodeURIComponent(params.slug as string)
  const { data: page, isLoading } = usePage(slug)

  if (isLoading) return <PageSkeleton />
  if (!page) return <div>Page not found</div>

  return <PageForm page={page} />
}
