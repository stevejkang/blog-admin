import { describe, it, expect } from "vitest"
import {
  generateDirectoryName,
  generateSlug,
  parseDirectoryName,
} from "@/lib/mdx/slug"

describe("generateDirectoryName", () => {
  it("generates correct directory name", () => {
    const result = generateDirectoryName(
      "2021-03-08",
      "devops",
      "Better Way to Handle Env in Travis",
    )
    expect(result).toBe("210308-devops-better-way-to-handle-env-in-travis")
  })

  it("strips special characters from title", () => {
    const result = generateDirectoryName(
      "2024-01-15",
      "dev",
      "What's New in TypeScript 5.0?",
    )
    expect(result).toBe("240115-dev-whats-new-in-typescript-50")
  })

  it("collapses multiple spaces", () => {
    const result = generateDirectoryName(
      "2024-06-01",
      "web",
      "A   Title   With   Spaces",
    )
    expect(result).toBe("240601-web-a-title-with-spaces")
  })
})

describe("generateSlug", () => {
  it("generates correct slug", () => {
    const result = generateSlug(
      "2021-03-08",
      "devops",
      "Better Way to Handle Env in Travis",
    )
    expect(result).toBe(
      "/devops-better-way-to-handle-env-in-travis-210308",
    )
  })

  it("starts with forward slash", () => {
    const result = generateSlug("2024-01-15", "dev", "Some Title")
    expect(result.startsWith("/")).toBe(true)
  })

  it("ends with date suffix", () => {
    const result = generateSlug("2024-01-15", "dev", "Some Title")
    expect(result).toMatch(/-240115$/)
  })
})

describe("parseDirectoryName", () => {
  it("parses valid directory name", () => {
    const result = parseDirectoryName(
      "210308-devops-better-way-to-handle-env-in-travis",
    )
    expect(result).toEqual({
      date: "2021-03-08",
      category: "devops",
      slugWords: "better-way-to-handle-env-in-travis",
    })
  })

  it("returns null for invalid directory name", () => {
    expect(parseDirectoryName("invalid-name")).toBeNull()
    expect(parseDirectoryName("")).toBeNull()
    expect(parseDirectoryName("abc-def-ghi")).toBeNull()
  })

  it("roundtrips with generateDirectoryName", () => {
    const dirName = generateDirectoryName(
      "2022-04-27",
      "devops",
      "Deploy Gatsby Digital Ocean Droplet with Actions",
    )
    const parsed = parseDirectoryName(dirName)
    expect(parsed).not.toBeNull()
    expect(parsed!.date).toBe("2022-04-27")
    expect(parsed!.category).toBe("devops")
    expect(parsed!.slugWords).toBe(
      "deploy-gatsby-digital-ocean-droplet-with-actions",
    )
  })
})
