export interface PostFrontmatter {
  title: string
  description: string
  date: string // YYYY-MM-DD
  slug: string // e.g., "/devops-slug-240115"
  tags: string[]
  banner?: string // e.g., "./article-banner.png"
  canonicalUrl?: string
  defer?: boolean
}

export interface PostListItem {
  frontmatter: PostFrontmatter
  directoryName: string // e.g., "240115-devops-slug"
  directoryPath: string // e.g., "content/posts/240115-devops-slug"
  sha: string
  hasBanner: boolean
  images: string[]
}

export interface PostDetail extends PostListItem {
  body: string
  rawContent: string
}

export interface CreatePostInput {
  frontmatter: PostFrontmatter
  body: string
  images: ImageUpload[]
  mode: PublishMode
}

export interface UpdatePostInput {
  frontmatter: PostFrontmatter
  body: string
  sha: string
  images: ImageUpload[]
  removedImages: string[]
  mode: PublishMode
}

export type PublishMode = "direct" | "branch-pr"

export interface ImageUpload {
  filename: string
  content: string
  type: "banner" | "inline"
}
