import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { readFile, readDirectory } from "@/lib/github/content"
import { atomicCommit } from "@/lib/github/commits"
import { parseFrontmatter, serializeFrontmatter } from "@/lib/mdx/frontmatter"
import { pageFrontmatterSchema } from "@/lib/mdx/schema"
import { z } from "zod"
import type { PageFrontmatter, PageDetail } from "@/types"

const updatePageSchema = z.object({
  frontmatter: pageFrontmatterSchema,
  body: z.string().min(1, { error: "Page body is required" }),
  sha: z.string().min(1, { error: "SHA is required for update" }),
  mode: z.enum(["direct", "branch-pr"]).default("direct"),
})

type RouteParams = { params: Promise<{ slug: string }> }

export async function GET(
  _request: Request,
  { params }: RouteParams,
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { slug } = await params
    const directoryPath = `content/pages/${slug}`
    const filePath = `${directoryPath}/index.mdx`

    const { content: rawContent, sha } = await readFile(filePath)
    const { data, content: body } = parseFrontmatter(rawContent)
    const frontmatter = data as unknown as PageFrontmatter

    const detail: PageDetail = {
      frontmatter,
      directoryName: slug,
      directoryPath,
      sha,
      body,
      rawContent,
    }

    return NextResponse.json({ data: detail })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    const status = message.includes("Not Found") ? 404 : 500
    return NextResponse.json(
      { error: { message: `Failed to get page: ${message}`, code: "GET_PAGE_FAILED" } },
      { status },
    )
  }
}

export async function PUT(
  request: Request,
  { params }: RouteParams,
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { slug } = await params
    const json = await request.json()
    const parsed = updatePageSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: "Validation failed", code: "VALIDATION_ERROR", details: parsed.error.flatten() } },
        { status: 400 },
      )
    }

    const { frontmatter, body, sha } = parsed.data

    const filePath = `content/pages/${slug}/index.mdx`
    const { sha: currentSha } = await readFile(filePath)
    if (currentSha !== sha) {
      return NextResponse.json(
        { error: { message: "Page has been modified. Please refresh and try again.", code: "SHA_MISMATCH" } },
        { status: 409 },
      )
    }

    const mdxContent = serializeFrontmatter(
      frontmatter as unknown as Record<string, unknown>,
      body,
    )

    const files: Array<{ path: string; content: string }> = [
      { path: filePath, content: mdxContent },
    ]

    const newSlugName = frontmatter.slug.replace(/^\//, "")
    if (newSlugName !== slug) {
      const newFilePath = `content/pages/${newSlugName}/index.mdx`
      files[0] = { path: newFilePath, content: mdxContent }

      const oldItems = await readDirectory(`content/pages/${slug}`)
      const deletions = oldItems
        .filter((item) => item.type === "file")
        .map((item) => ({ path: item.path }))

      const { commitSha } = await atomicCommit({
        message: `content(page): rename "${frontmatter.title}"`,
        files,
        deletions,
      })

      return NextResponse.json({ data: { sha: commitSha, path: newFilePath } })
    }

    const { commitSha } = await atomicCommit({
      message: `content(page): update "${frontmatter.title}"`,
      files,
    })

    return NextResponse.json({ data: { sha: commitSha, path: filePath } })
  } catch (err) {
    return NextResponse.json(
      { error: { message: `Failed to update page: ${err instanceof Error ? err.message : "Unknown error"}`, code: "UPDATE_PAGE_FAILED" } },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteParams,
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { slug } = await params
    const directoryPath = `content/pages/${slug}`

    const items = await readDirectory(directoryPath)
    const deletions = items
      .filter((item) => item.type === "file")
      .map((item) => ({ path: item.path }))

    if (deletions.length === 0) {
      return NextResponse.json(
        { error: { message: "Page not found or directory is empty", code: "PAGE_NOT_FOUND" } },
        { status: 404 },
      )
    }

    const { content: rawContent } = await readFile(`${directoryPath}/index.mdx`)
    const { data } = parseFrontmatter(rawContent)
    const title = (data as { title?: string }).title || slug

    const { commitSha } = await atomicCommit({
      message: `content(page): delete "${title}"`,
      files: [],
      deletions,
    })

    return NextResponse.json({ data: { sha: commitSha } })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    const status = message.includes("Not Found") ? 404 : 500
    return NextResponse.json(
      { error: { message: `Failed to delete page: ${message}`, code: "DELETE_PAGE_FAILED" } },
      { status },
    )
  }
}
