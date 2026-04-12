import { describe, it, expect } from "vitest"
import { postFrontmatterSchema } from "@/lib/mdx/schema"

describe("postFrontmatterSchema", () => {
  const validFrontmatter = {
    title: "Better Way to Handle Env in Travis",
    description: "A guide to managing environment variables in Travis CI",
    date: "2021-03-08",
    slug: "/devops-better-way-to-handle-env-in-travis-210308",
    tags: ["devops", "travis-ci"],
  }

  it("accepts valid post frontmatter", () => {
    const result = postFrontmatterSchema.safeParse(validFrontmatter)
    expect(result.success).toBe(true)
  })

  it("accepts valid frontmatter with optional fields", () => {
    const result = postFrontmatterSchema.safeParse({
      ...validFrontmatter,
      banner: "./article-banner.png",
      canonicalUrl: "https://example.com/post",
      defer: true,
    })
    expect(result.success).toBe(true)
  })

  it("accepts empty string for canonicalUrl", () => {
    const result = postFrontmatterSchema.safeParse({
      ...validFrontmatter,
      canonicalUrl: "",
    })
    expect(result.success).toBe(true)
  })

  it("rejects missing title", () => {
    const { title: _, ...noTitle } = validFrontmatter
    const result = postFrontmatterSchema.safeParse(noTitle)
    expect(result.success).toBe(false)
  })

  it("rejects empty title", () => {
    const result = postFrontmatterSchema.safeParse({
      ...validFrontmatter,
      title: "",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid date format", () => {
    const result = postFrontmatterSchema.safeParse({
      ...validFrontmatter,
      date: "03-08-2021",
    })
    expect(result.success).toBe(false)
  })

  it("rejects date with wrong separator", () => {
    const result = postFrontmatterSchema.safeParse({
      ...validFrontmatter,
      date: "2021/03/08",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty tags array", () => {
    const result = postFrontmatterSchema.safeParse({
      ...validFrontmatter,
      tags: [],
    })
    expect(result.success).toBe(false)
  })

  it("rejects slug without leading slash", () => {
    const result = postFrontmatterSchema.safeParse({
      ...validFrontmatter,
      slug: "devops-slug-210308",
    })
    expect(result.success).toBe(false)
  })

  it("rejects slug with uppercase letters", () => {
    const result = postFrontmatterSchema.safeParse({
      ...validFrontmatter,
      slug: "/Devops-Slug-210308",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid canonicalUrl", () => {
    const result = postFrontmatterSchema.safeParse({
      ...validFrontmatter,
      canonicalUrl: "not-a-url",
    })
    expect(result.success).toBe(false)
  })
})
