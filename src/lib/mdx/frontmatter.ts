import matter from "gray-matter"
import type { PostFrontmatter, PostListItem, PostDetail } from "@/types"
import {
  readFile,
  readDirectory,
  listPostDirectories,
} from "@/lib/github/content"

export function parseFrontmatter(rawContent: string): {
  data: Record<string, unknown>
  content: string
} {
  const { data, content } = matter(rawContent)
  return { data, content: content.trim() }
}

export function serializeFrontmatter(
  frontmatter: Record<string, unknown>,
  body: string,
): string {
  return matter.stringify(body, frontmatter)
}

export async function parsePostList(): Promise<PostListItem[]> {
  const directories = await listPostDirectories()
  const posts = await Promise.all(
    directories.map(async (dir) => {
      try {
        const { content: rawContent, sha } = await readFile(
          `${dir.path}/index.mdx`,
        )
        const { data } = parseFrontmatter(rawContent)
        const frontmatter = data as unknown as PostFrontmatter
        const dirItems = await readDirectory(dir.path)
        const images = dirItems
          .filter(
            (item) =>
              item.type === "file" &&
              /\.(png|jpg|jpeg|webp)$/i.test(item.name),
          )
          .map((item) => item.name)
        return {
          frontmatter,
          directoryName: dir.name,
          directoryPath: dir.path,
          sha,
          hasBanner: !!frontmatter.banner,
          images,
        } satisfies PostListItem
      } catch {
        return null
      }
    }),
  )
  return posts
    .filter((p): p is PostListItem => p !== null)
    .sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date))
}

export async function parsePostDetail(
  directoryPath: string,
): Promise<PostDetail> {
  const { content: rawContent, sha } = await readFile(
    `${directoryPath}/index.mdx`,
  )
  const { data, content: body } = parseFrontmatter(rawContent)
  const frontmatter = data as unknown as PostFrontmatter
  const dirItems = await readDirectory(directoryPath)
  const images = dirItems
    .filter(
      (item) =>
        item.type === "file" && /\.(png|jpg|jpeg|webp)$/i.test(item.name),
    )
    .map((item) => item.name)
  const dirName = directoryPath.split("/").pop()!
  return {
    frontmatter,
    directoryName: dirName,
    directoryPath,
    sha,
    hasBanner: !!frontmatter.banner,
    images,
    body,
    rawContent,
  }
}
