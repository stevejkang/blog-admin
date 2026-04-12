import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { parsePostList } from "@/lib/mdx/frontmatter"
import type { Tag } from "@/types"

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const posts = await parsePostList()
    const tagMap = new Map<string, Tag>()

    for (const post of posts) {
      for (const tagName of post.frontmatter.tags) {
        const existing = tagMap.get(tagName)
        const postRef = {
          title: post.frontmatter.title,
          slug: post.frontmatter.slug,
          date: post.frontmatter.date,
        }

        if (existing) {
          existing.count++
          existing.posts.push(postRef)
          if (post.frontmatter.date > existing.lastUsed) {
            existing.lastUsed = post.frontmatter.date
          }
        } else {
          tagMap.set(tagName, {
            name: tagName,
            count: 1,
            posts: [postRef],
            lastUsed: post.frontmatter.date,
          })
        }
      }
    }

    const tags = Array.from(tagMap.values()).sort((a, b) => b.count - a.count)
    return NextResponse.json({ data: tags })
  } catch (e) {
    console.error("[GET /api/tags]", e)
    return NextResponse.json(
      { error: { message: e instanceof Error ? e.message : "Failed to fetch tags", code: "GITHUB_API_ERROR" } },
      { status: 502 },
    )
  }
}
