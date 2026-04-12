import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { parsePostList, parsePostDetail, serializeFrontmatter } from "@/lib/mdx/frontmatter"
import { updatePostSchema } from "@/lib/mdx/schema"
import { atomicCommit } from "@/lib/github/commits"
import { readDirectory } from "@/lib/github/content"

async function findPostBySlug(slug: string) {
  const posts = await parsePostList()
  const normalizedSlug = slug.startsWith("/") ? slug : `/${slug}`
  return posts.find((p) => p.frontmatter.slug === normalizedSlug) ?? null
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { slug } = await params
    const post = await findPostBySlug(slug)
    if (!post) {
      return NextResponse.json(
        { error: { message: "Post not found", code: "NOT_FOUND" } },
        { status: 404 },
      )
    }

    const detail = await parsePostDetail(post.directoryPath)
    return NextResponse.json({ data: detail })
  } catch {
    return NextResponse.json(
      { error: { message: "Failed to fetch post", code: "GITHUB_API_ERROR" } },
      { status: 502 },
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { slug } = await params
    const body = await request.json()
    const parsed = updatePostSchema.safeParse(body)
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

    const post = await findPostBySlug(slug)
    if (!post) {
      return NextResponse.json(
        { error: { message: "Post not found", code: "NOT_FOUND" } },
        { status: 404 },
      )
    }

    const { frontmatter, body: postBody, sha, images, removedImages, mode } = parsed.data

    if (sha !== post.sha) {
      return NextResponse.json(
        { error: { message: "SHA mismatch — post was modified since last read", code: "CONFLICT" } },
        { status: 409 },
      )
    }

    if (mode === "branch-pr") {
      return NextResponse.json(
        { error: { message: "branch-pr mode is not yet supported", code: "NOT_IMPLEMENTED" } },
        { status: 501 },
      )
    }

    const mdxContent = serializeFrontmatter(
      frontmatter as unknown as Record<string, unknown>,
      postBody,
    )

    const files: Array<{ path: string; content: string; encoding?: "utf-8" | "base64" }> = [
      { path: `${post.directoryPath}/index.mdx`, content: mdxContent },
    ]

    for (const image of images) {
      files.push({
        path: `${post.directoryPath}/${image.filename}`,
        content: image.content,
        encoding: "base64",
      })
    }

    const deletions = removedImages.map((filename) => ({
      path: `${post.directoryPath}/${filename}`,
    }))

    const result = await atomicCommit({
      message: `content(post): update "${frontmatter.title}"`,
      files,
      deletions,
    })

    return NextResponse.json({ data: { commitSha: result.commitSha } })
  } catch {
    return NextResponse.json(
      { error: { message: "Failed to update post", code: "GITHUB_API_ERROR" } },
      { status: 502 },
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { slug } = await params
    const post = await findPostBySlug(slug)
    if (!post) {
      return NextResponse.json(
        { error: { message: "Post not found", code: "NOT_FOUND" } },
        { status: 404 },
      )
    }

    const dirItems = await readDirectory(post.directoryPath)
    const deletions = dirItems
      .filter((item) => item.type === "file")
      .map((item) => ({ path: item.path }))

    const result = await atomicCommit({
      message: `content(post): remove "${post.frontmatter.title}"`,
      files: [],
      deletions,
    })

    return NextResponse.json({ data: { commitSha: result.commitSha } })
  } catch {
    return NextResponse.json(
      { error: { message: "Failed to delete post", code: "GITHUB_API_ERROR" } },
      { status: 502 },
    )
  }
}
