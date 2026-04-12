import { z } from "zod"

export const postFrontmatterSchema = z.object({
  title: z.string().min(1, { error: "Title is required" }).max(200),
  description: z.string().min(1, { error: "Description is required" }).max(300),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Date must be YYYY-MM-DD" }),
  slug: z.string().min(1).regex(/^\/[a-z0-9-]+$/, {
    error: "Slug must start with / and contain only lowercase alphanumeric and hyphens",
  }),
  tags: z.array(z.string().min(1)).min(1, { error: "At least one tag is required" }),
  banner: z.string().optional(),
  canonicalUrl: z.url().optional().or(z.literal("")),
  defer: z.boolean().optional(),
})

export const pageFrontmatterSchema = z.object({
  title: z.string().min(1, { error: "Title is required" }),
  slug: z.string().min(1).regex(/^\/[a-z0-9-]+$/, {
    error: "Slug must start with /",
  }),
})

export const createPostSchema = z.object({
  frontmatter: postFrontmatterSchema,
  body: z.string().min(1, { error: "Post body is required" }),
  images: z
    .array(
      z.object({
        filename: z.string(),
        content: z.string(),
        type: z.enum(["banner", "inline"]),
      }),
    )
    .default([]),
  mode: z.enum(["direct", "branch-pr"]).default("branch-pr"),
})

export const updatePostSchema = createPostSchema.extend({
  sha: z.string().min(1, { error: "SHA is required for update" }),
  removedImages: z.array(z.string()).default([]),
})

export type PostFrontmatterInput = z.input<typeof postFrontmatterSchema>
export type PageFrontmatterInput = z.input<typeof pageFrontmatterSchema>
export type CreatePostSchemaInput = z.input<typeof createPostSchema>
export type UpdatePostSchemaInput = z.input<typeof updatePostSchema>
