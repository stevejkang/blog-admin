"use client"

import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { fetchApi } from "@/lib/api/client"
import type { Tag } from "@/types"

export function useTags() {
  return useQuery({
    queryKey: queryKeys.tags.all,
    queryFn: () => fetchApi<Tag[]>("/api/tags"),
  })
}
