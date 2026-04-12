import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { parsePostList } from "@/lib/mdx/frontmatter"
import { serializeFrontmatter } from "@/lib/mdx/frontmatter"
import { createPostSchema } from "@/lib/mdx/schema"
import { generateDirectoryName } from "@/lib/mdx/slug"
import { atomicCommit } from "@/lib/github/commits"

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const posts = await parsePostList()
    return NextResponse.json({ data: posts })
  } catch {
    return NextResponse.json(
      { error: { message: "Failed to fetch posts", code: "GITHUB_API_ERROR" } },
      { status: 502 },
    )
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()
    const { category, ...rest } = body
    const parsed = createPostSchema.safeParse(rest)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            message: "Validation failed",
            code: "VALIDATION_ERROR",
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 },
      )
    }

    const { frontmatter, body: postBody, images, mode } = parsed.data

    if (!category || typeof category !== "string") {
      return NextResponse.json(
        { error: { message: "Category is required", code: "VALIDATION_ERROR" } },
        { status: 400 },
      )
    }

    const directoryName = generateDirectoryName(frontmatter.date, category, frontmatter.title)
    const directoryPath = `content/posts/${directoryName}`

    const mdxContent = serializeFrontmatter(
      frontmatter as unknown as Record<string, unknown>,
      postBody,
    )

    const files: Array<{ path: string; content: string; encoding?: "utf-8" | "base64" }> = [
      { path: `${directoryPath}/index.mdx`, content: mdxContent },
    ]

    for (const image of images) {
      files.push({
        path: `${directoryPath}/${image.filename}`,
        content: image.content,
        encoding: "base64",
      })
    }

    if (mode === "branch-pr") {
      return NextResponse.json(
        { error: { message: "branch-pr mode is not yet supported", code: "NOT_IMPLEMENTED" } },
        { status: 501 },
      )
    }

    const result = await atomicCommit({
      message: `content(post): add "${frontmatter.title}"`,
      files,
    })

    return NextResponse.json({ data: { commitSha: result.commitSha } }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: { message: "Failed to create post", code: "GITHUB_API_ERROR" } },
      { status: 502 },
    )
  }
}
