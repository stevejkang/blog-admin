export type {
  PostFrontmatter,
  PostListItem,
  PostDetail,
  CreatePostInput,
  UpdatePostInput,
  PublishMode,
  ImageUpload,
} from "./post"

export type {
  PageFrontmatter,
  PageListItem,
  PageDetail,
  CreatePageInput,
  UpdatePageInput,
} from "./page"

export type {
  GitHubContentFile,
  GitHubContentDirectory,
  GitHubContent,
  GitHubRef,
  GitHubCommit,
  GitHubTree,
  GitHubTreeEntry,
  GitHubBlob,
  GitHubPullRequest,
} from "./github"

export interface Tag {
  name: string
  count: number
  posts: string[]
  lastUsed: string
}

export interface ExistingImage {
  filename: string
  path: string
  sha: string
  size: number
  url: string
}

export interface ApiResponse<T> {
  data: T
  status: number
}

export interface ApiError {
  message: string
  status: number
  code?: string
}

export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError }

export interface PublishResult {
  sha: string
  url: string
  pullRequestUrl?: string
}
