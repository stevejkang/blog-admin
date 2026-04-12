import type { PublishMode } from "./post"

export interface PageFrontmatter {
  title: string
  slug: string
}

export interface PageListItem {
  frontmatter: PageFrontmatter
  directoryName: string
  directoryPath: string
  sha: string
}

export interface PageDetail extends PageListItem {
  body: string
  rawContent: string
}

export interface CreatePageInput {
  frontmatter: PageFrontmatter
  body: string
  mode: PublishMode
}

export interface UpdatePageInput {
  frontmatter: PageFrontmatter
  body: string
  sha: string
  mode: PublishMode
}
