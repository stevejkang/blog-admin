"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { fetchApi } from "@/lib/api/client"
import type { PublishResult } from "@/types"

interface PublishPostInput {
  frontmatter: Record<string, unknown>
  body: string
  images: Array<{ filename: string; content: string; type: "banner" | "inline" }>
  mode: "direct" | "branch-pr"
  category?: string
}

interface UpdatePostInput {
  frontmatter: Record<string, unknown>
  body: string
  sha: string
  images: Array<{ filename: string; content: string; type: "banner" | "inline" }>
  removedImages: string[]
  mode: "direct" | "branch-pr"
  category?: string
}

export function usePublishPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: PublishPostInput) => {
      const { category, ...rest } = input
      return fetchApi<PublishResult>("/api/posts", {
        method: "POST",
        body: JSON.stringify({ ...rest, category }),
      })
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all }),
  })
}

export function usePublishUpdatePost(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdatePostInput) => {
      const { category, ...rest } = input
      return fetchApi<PublishResult>(
        `/api/posts/${encodeURIComponent(slug)}`,
        {
          method: "PUT",
          body: JSON.stringify({ ...rest, category }),
        },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.detail(slug),
      })
    },
  })
}

export function useMergePR() {
  return useMutation({
    mutationFn: async (prNumber: number) => {
      return fetchApi<{ merged: boolean }>("/api/publish", {
        method: "POST",
        body: JSON.stringify({ action: "merge-pr", prNumber }),
      })
    },
  })
}
