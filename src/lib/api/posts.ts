import { fetchApi } from "./client"
import type {
  PostListItem,
  PostDetail,
  CreatePostInput,
  UpdatePostInput,
  PublishResult,
} from "@/types"

export async function fetchPosts(): Promise<PostListItem[]> {
  return fetchApi<PostListItem[]>("/api/posts")
}

export async function fetchPost(slug: string): Promise<PostDetail> {
  return fetchApi<PostDetail>(`/api/posts/${encodeURIComponent(slug)}`)
}

export async function createPost(
  input: CreatePostInput,
): Promise<PublishResult> {
  return fetchApi<PublishResult>("/api/posts", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function updatePost(
  slug: string,
  input: UpdatePostInput,
): Promise<PublishResult> {
  return fetchApi<PublishResult>(
    `/api/posts/${encodeURIComponent(slug)}`,
    {
      method: "PUT",
      body: JSON.stringify(input),
    },
  )
}

export async function deletePost(slug: string): Promise<void> {
  return fetchApi<void>(`/api/posts/${encodeURIComponent(slug)}`, {
    method: "DELETE",
  })
}
