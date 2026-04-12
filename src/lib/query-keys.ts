export const queryKeys = {
  posts: {
    all: ["posts"] as const,
    lists: () => [...queryKeys.posts.all, "list"] as const,
    detail: (slug: string) => [...queryKeys.posts.all, "detail", slug] as const,
  },
  pages: {
    all: ["pages"] as const,
    lists: () => [...queryKeys.pages.all, "list"] as const,
    detail: (slug: string) => [...queryKeys.pages.all, "detail", slug] as const,
  },
  tags: {
    all: ["tags"] as const,
  },
};
