"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import type { MDXEditorMethods } from "@mdxeditor/editor"
import {
  ArrowLeft,
  CalendarIcon,
  GitPullRequest,
  Loader2,
  Send,
  X,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { MDXEditor } from "@/components/editor/mdx-editor"

import { useCreatePost, useUpdatePost } from "@/hooks/use-posts"
import { useTags } from "@/hooks/use-tags"
import { generateSlug, generateDirectoryName } from "@/lib/mdx/slug"
import type { PostDetail, ImageUpload, PublishMode } from "@/types"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PostFormProps {
  post?: PostDetail
}

interface FormValues {
  title: string
  description: string
  date: string
  category: string
  slug: string
  tags: string[]
  banner: string
  canonicalUrl: string
  defer: boolean
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

/** Extract category from an existing slug like "/devops-my-post-240115" */
function parseCategoryFromSlug(slug: string): string {
  const cleaned = slug.startsWith("/") ? slug.slice(1) : slug
  const first = cleaned.split("-")[0]
  return first || ""
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PostForm({ post }: PostFormProps) {
  const router = useRouter()
  const editorRef = useRef<MDXEditorMethods>(null)
  const isEdit = !!post

  /* ----- Mutations ------------------------------------------------ */
  const createMutation = useCreatePost()
  const updateMutation = useUpdatePost(post?.frontmatter.slug ?? "")
  const isPending = createMutation.isPending || updateMutation.isPending

  /* ----- Tags from API -------------------------------------------- */
  const { data: existingTags } = useTags()
  const tagSuggestions = useMemo(
    () => (existingTags ?? []).map((t) => t.name),
    [existingTags],
  )

  /* ----- Image tracking ------------------------------------------- */
  const [images, setImages] = useState<ImageUpload[]>([])
  const [removedImages, setRemovedImages] = useState<string[]>([])

  /* ----- Slug auto-generation lock -------------------------------- */
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEdit)

  /* ----- Tag input state ------------------------------------------ */
  const [tagInput, setTagInput] = useState("")
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)

  /* ----- Banner state --------------------------------------------- */
  const [bannerPreview, setBannerPreview] = useState<string | null>(
    post?.frontmatter.banner ?? null,
  )

  /* ----- Form ----------------------------------------------------- */
  const defaultCategory = post
    ? parseCategoryFromSlug(post.frontmatter.slug)
    : ""

  const form = useForm<FormValues>({
    defaultValues: {
      title: post?.frontmatter.title ?? "",
      description: post?.frontmatter.description ?? "",
      date: post?.frontmatter.date ?? todayISO(),
      category: defaultCategory,
      slug: post?.frontmatter.slug ?? "",
      tags: post?.frontmatter.tags ?? [],
      banner: post?.frontmatter.banner ?? "",
      canonicalUrl: post?.frontmatter.canonicalUrl ?? "",
      defer: post?.frontmatter.defer ?? false,
    },
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = form

  const title = watch("title")
  const date = watch("date")
  const category = watch("category")
  const tags = watch("tags")
  const defer = watch("defer")

  /* ----- Auto-generate slug --------------------------------------- */
  useEffect(() => {
    if (slugManuallyEdited) return
    if (!title && !category) return
    const generated = generateSlug(date || todayISO(), category || "post", title || "untitled")
    setValue("slug", generated, { shouldDirty: true })
  }, [title, date, category, slugManuallyEdited, setValue])

  const directoryPreview = useMemo(() => {
    if (!title && !category) return ""
    return generateDirectoryName(
      date || todayISO(),
      category || "post",
      title || "untitled",
    )
  }, [title, date, category])

  /* ----- Beforeunload --------------------------------------------- */
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
      }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isDirty])

  /* ----- Tag management ------------------------------------------- */
  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim().toLowerCase()
      if (!trimmed) return
      const current = form.getValues("tags")
      if (current.includes(trimmed)) return
      setValue("tags", [...current, trimmed], { shouldDirty: true })
      setTagInput("")
      setShowTagSuggestions(false)
    },
    [form, setValue],
  )

  const removeTag = useCallback(
    (tag: string) => {
      const current = form.getValues("tags")
      setValue(
        "tags",
        current.filter((t) => t !== tag),
        { shouldDirty: true },
      )
    },
    [form, setValue],
  )

  const filteredSuggestions = useMemo(() => {
    if (!tagInput.trim()) return tagSuggestions.slice(0, 8)
    const q = tagInput.toLowerCase()
    return tagSuggestions
      .filter((t) => t.toLowerCase().includes(q) && !tags.includes(t))
      .slice(0, 8)
  }, [tagInput, tagSuggestions, tags])

  /* ----- Banner upload -------------------------------------------- */
  const handleBannerChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        setBannerPreview(result)
        setValue("banner", `./article-banner${getExtension(file.name)}`, {
          shouldDirty: true,
        })
        // Track the image for upload
        const base64 = result.split(",")[1]
        setImages((prev) => [
          ...prev.filter((img) => img.type !== "banner"),
          {
            filename: `article-banner${getExtension(file.name)}`,
            content: base64,
            type: "banner" as const,
          },
        ])
      }
      reader.readAsDataURL(file)
    },
    [setValue],
  )

  const removeBanner = useCallback(() => {
    if (post?.frontmatter.banner) {
      setRemovedImages((prev) => [...prev, post.frontmatter.banner!])
    }
    setBannerPreview(null)
    setValue("banner", "", { shouldDirty: true })
    setImages((prev) => prev.filter((img) => img.type !== "banner"))
  }, [post, setValue])

  /* ----- Submit --------------------------------------------------- */
  const onSubmit = useCallback(
    async (values: FormValues, mode: PublishMode = "branch-pr") => {
      const body = editorRef.current?.getMarkdown() ?? ""

      if (!body.trim()) {
        toast.error("Post body cannot be empty")
        return
      }

      const frontmatter = {
        title: values.title,
        description: values.description,
        date: values.date,
        slug: values.slug,
        tags: values.tags,
        banner: values.banner || undefined,
        canonicalUrl: values.canonicalUrl || undefined,
        defer: values.defer || undefined,
      }

      try {
        if (isEdit && post) {
          await updateMutation.mutateAsync({
            frontmatter,
            body,
            sha: post.sha,
            images,
            removedImages,
            mode,
          })
          toast.success("Post updated successfully")
        } else {
          await createMutation.mutateAsync({
            frontmatter,
            body,
            images,
            mode,
          })
          toast.success("Post created successfully")
        }
        router.push("/posts")
      } catch {
        toast.error(
          isEdit ? "Failed to update post" : "Failed to create post",
        )
      }
    },
    [
      isEdit,
      post,
      images,
      removedImages,
      createMutation,
      updateMutation,
      router,
    ],
  )

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      {/* Top bar */}
      <header className="flex shrink-0 items-center justify-between border-b px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            render={<Link href="/posts" />}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-sm font-semibold tracking-tight">
            {isEdit ? "Edit Post" : "New Post"}
          </h1>
          {isDirty && (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
              Unsaved
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleSubmit((v) => onSubmit(v, "branch-pr"))}
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <GitPullRequest className="size-3.5" />
            )}
            Create PR
          </Button>
          <Button
            size="sm"
            disabled={isPending}
            onClick={handleSubmit((v) => onSubmit(v, "direct"))}
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            Publish
          </Button>
        </div>
      </header>

      {/* Two-column layout */}
      <div className="flex min-h-0 flex-1">
        {/* Left: Editor */}
        <div className="flex min-w-0 flex-[65] flex-col border-r">
          <MDXEditor
            ref={editorRef}
            markdown={post?.body ?? ""}
            placeholder="Start writing…"
            className="min-h-0 flex-1 [&_.mdxeditor]:h-full [&_[role='textbox']]:min-h-full [&_[role='textbox']]:px-8 [&_[role='textbox']]:py-6"
          />
        </div>

        {/* Right: Metadata sidebar */}
        <aside className="flex w-0 flex-[35] flex-col overflow-y-auto">
          <div className="space-y-5 p-5">
            {/* Title */}
            <fieldset className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Post title"
                className="text-base font-medium"
                {...register("title", { required: "Title is required" })}
              />
              {errors.title && (
                <p className="text-xs text-destructive">
                  {errors.title.message}
                </p>
              )}
            </fieldset>

            {/* Description */}
            <fieldset className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description for SEO and previews"
                rows={3}
                className="min-h-0 resize-none"
                {...register("description", {
                  required: "Description is required",
                })}
              />
              {errors.description && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </fieldset>

            {/* Date */}
            <fieldset className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <div className="relative">
                <CalendarIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  className="pl-8"
                  {...register("date", { required: "Date is required" })}
                />
              </div>
            </fieldset>

            {/* Category */}
            <fieldset className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="e.g. devops, react, design"
                {...register("category")}
              />
              <p className="text-[11px] text-muted-foreground">
                Used for slug generation
              </p>
            </fieldset>

            {/* Slug */}
            <fieldset className="space-y-1.5">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="/category-title-words-YYMMDD"
                className="font-mono text-xs"
                {...register("slug", { required: "Slug is required" })}
                onChange={(e) => {
                  setSlugManuallyEdited(true)
                  register("slug").onChange(e)
                }}
              />
              {errors.slug && (
                <p className="text-xs text-destructive">
                  {errors.slug.message}
                </p>
              )}
              {directoryPreview && (
                <p className="text-[11px] text-muted-foreground">
                  Directory:{" "}
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
                    {directoryPreview}
                  </code>
                </p>
              )}
              {slugManuallyEdited && !isEdit && (
                <button
                  type="button"
                  className="text-[11px] text-primary hover:underline"
                  onClick={() => setSlugManuallyEdited(false)}
                >
                  Reset to auto-generate
                </button>
              )}
            </fieldset>

            {/* Tags */}
            <fieldset className="space-y-1.5">
              <Label>Tags</Label>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="rounded-full p-0.5 hover:bg-foreground/10"
                      >
                        <X className="size-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="relative">
                <Input
                  placeholder="Add a tag…"
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(e.target.value)
                    setShowTagSuggestions(true)
                  }}
                  onFocus={() => setShowTagSuggestions(true)}
                  onBlur={() => {
                    // Delay to allow click on suggestion
                    setTimeout(() => setShowTagSuggestions(false), 200)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addTag(tagInput)
                    }
                    if (
                      e.key === "Backspace" &&
                      !tagInput &&
                      tags.length > 0
                    ) {
                      removeTag(tags[tags.length - 1])
                    }
                  }}
                />
                {showTagSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full z-50 mt-1 w-full rounded-lg border bg-popover p-1 shadow-md">
                    {filteredSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        className="flex w-full items-center rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          addTag(suggestion)
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.tags && (
                <p className="text-xs text-destructive">
                  At least one tag is required
                </p>
              )}
            </fieldset>

            {/* Banner */}
            <fieldset className="space-y-1.5">
              <Label>Banner Image</Label>
              {bannerPreview ? (
                <div className="relative overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="aspect-[2/1] w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeBanner}
                    className="absolute right-2 top-2 rounded-full bg-background/80 p-1 backdrop-blur-sm hover:bg-background"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed py-6 text-sm text-muted-foreground transition-colors hover:border-ring hover:bg-muted/30">
                  <span className="font-medium">Click to upload banner</span>
                  <span className="mt-0.5 text-xs">PNG, JPG up to 2MB</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleBannerChange}
                  />
                </label>
              )}
            </fieldset>

            {/* Canonical URL */}
            <fieldset className="space-y-1.5">
              <Label htmlFor="canonicalUrl">Canonical URL</Label>
              <Input
                id="canonicalUrl"
                type="url"
                placeholder="https://original-source.com/post"
                {...register("canonicalUrl")}
              />
              <p className="text-[11px] text-muted-foreground">
                Set if this post was originally published elsewhere
              </p>
            </fieldset>

            {/* Defer (Gatsby DSG) */}
            <fieldset className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="defer">Deferred Static Generation</Label>
                <p className="text-[11px] text-muted-foreground">
                  Build this page on first request (Gatsby DSG)
                </p>
              </div>
              <Switch
                id="defer"
                checked={defer}
                onCheckedChange={(checked) =>
                  setValue("defer", checked as boolean, { shouldDirty: true })
                }
              />
            </fieldset>
          </div>
        </aside>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Utils                                                              */
/* ------------------------------------------------------------------ */

function getExtension(filename: string): string {
  const ext = filename.split(".").pop()
  return ext ? `.${ext}` : ".png"
}
