"use client"

import { useParams } from "next/navigation"
import { usePost } from "@/hooks/use-posts"
import { PostForm } from "@/components/posts/post-form"
import { PageSkeleton } from "@/components/shared/loading-skeleton"

export default function EditPostPage() {
  const params = useParams()
  const slug = decodeURIComponent(params.slug as string)
  const { data: post, isLoading } = usePost(slug)

  if (isLoading) return <PageSkeleton />
  if (!post) return <div>Post not found</div>

  return <PostForm post={post} />
}
