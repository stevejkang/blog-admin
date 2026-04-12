import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import {
  fetchPages,
  fetchPage,
  createPage,
  updatePage,
  deletePage,
} from "@/lib/api/pages"
import type { CreatePageInput, UpdatePageInput } from "@/types"

export function usePages() {
  return useQuery({
    queryKey: queryKeys.pages.lists(),
    queryFn: fetchPages,
  })
}

export function usePage(slug: string) {
  return useQuery({
    queryKey: queryKeys.pages.detail(slug),
    queryFn: () => fetchPage(slug),
    enabled: !!slug,
  })
}

export function useCreatePage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreatePageInput) => createPage(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pages.all })
    },
  })
}

export function useUpdatePage(slug: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdatePageInput) => updatePage(slug, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pages.all })
    },
  })
}

export function useDeletePage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (slug: string) => deletePage(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pages.all })
    },
  })
}
