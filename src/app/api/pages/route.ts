import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { listPageDirectories, readFile } from "@/lib/github/content"
import { atomicCommit } from "@/lib/github/commits"
import { parseFrontmatter, serializeFrontmatter } from "@/lib/mdx/frontmatter"
import { pageFrontmatterSchema } from "@/lib/mdx/schema"
import { z } from "zod"
import type { PageFrontmatter, PageListItem } from "@/types"

const createPageSchema = z.object({
  frontmatter: pageFrontmatterSchema,
  body: z.string().min(1, { error: "Page body is required" }),
  mode: z.enum(["direct", "branch-pr"]).default("direct"),
})

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const directories = await listPageDirectories()

    const pages = await Promise.all(
      directories.map(async (dir) => {
        try {
          const { content: rawContent, sha } = await readFile(
            `${dir.path}/index.mdx`,
          )
          const { data } = parseFrontmatter(rawContent)
          const frontmatter = data as unknown as PageFrontmatter

          return {
            frontmatter,
            directoryName: dir.name,
            directoryPath: dir.path,
            sha,
          } satisfies PageListItem
        } catch {
          return null
        }
      }),
    )

    const result = pages
      .filter((p): p is PageListItem => p !== null)
      .sort((a, b) => a.frontmatter.title.localeCompare(b.frontmatter.title))

    return NextResponse.json({ data: result })
  } catch (err) {
    return NextResponse.json(
      { error: { message: `Failed to list pages: ${err instanceof Error ? err.message : "Unknown error"}`, code: "LIST_PAGES_FAILED" } },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const json = await request.json()
    const parsed = createPageSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: "Validation failed", code: "VALIDATION_ERROR", details: parsed.error.flatten() } },
        { status: 400 },
      )
    }

    const { frontmatter, body } = parsed.data
    const slugName = frontmatter.slug.replace(/^\//, "")
    const filePath = `content/pages/${slugName}/index.mdx`

    const mdxContent = serializeFrontmatter(
      frontmatter as unknown as Record<string, unknown>,
      body,
    )

    const { commitSha } = await atomicCommit({
      message: `content(page): add "${frontmatter.title}"`,
      files: [{ path: filePath, content: mdxContent }],
    })

    return NextResponse.json(
      { data: { sha: commitSha, path: filePath } },
      { status: 201 },
    )
  } catch (err) {
    return NextResponse.json(
      { error: { message: `Failed to create page: ${err instanceof Error ? err.message : "Unknown error"}`, code: "CREATE_PAGE_FAILED" } },
      { status: 500 },
    )
  }
}
