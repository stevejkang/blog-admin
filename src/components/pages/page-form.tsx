"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import type { MDXEditorMethods } from "@mdxeditor/editor"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { pageFrontmatterSchema } from "@/lib/mdx/schema"
import { useCreatePage, useUpdatePage } from "@/hooks/use-pages"
import { getErrorMessage } from "@/lib/api/errors"
import { MDXEditor } from "@/components/editor/mdx-editor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { PageDetail } from "@/types"

const pageFormSchema = z.object({
  title: pageFrontmatterSchema.shape.title,
  slug: pageFrontmatterSchema.shape.slug,
})

type PageFormValues = z.infer<typeof pageFormSchema>

interface PageFormProps {
  page?: PageDetail
}

function slugify(title: string): string {
  return (
    "/" +
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
  )
}

export function PageForm({ page }: PageFormProps) {
  const router = useRouter()
  const editorRef = useRef<MDXEditorMethods>(null)
  const isEditing = !!page
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEditing)

  const createPage = useCreatePage()
  const updatePage = useUpdatePage(page?.frontmatter.slug ?? "")

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<PageFormValues>({
    resolver: zodResolver(pageFormSchema),
    defaultValues: {
      title: page?.frontmatter.title ?? "",
      slug: page?.frontmatter.slug ?? "/",
    },
  })

  const title = watch("title")

  useEffect(() => {
    if (!slugManuallyEdited && title) {
      setValue("slug", slugify(title), { shouldValidate: true })
    }
  }, [title, slugManuallyEdited, setValue])

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault()
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isDirty])

  const onSubmit = useCallback(
    async (values: PageFormValues) => {
      const body = editorRef.current?.getMarkdown() ?? ""

      try {
        if (isEditing && page) {
          await updatePage.mutateAsync({
            frontmatter: { title: values.title, slug: values.slug },
            body,
            sha: page.sha,
            mode: "direct",
          })
          toast.success("Page updated")
        } else {
          await createPage.mutateAsync({
            frontmatter: { title: values.title, slug: values.slug },
            body,
            mode: "direct",
          })
          toast.success("Page created")
        }
        router.push("/pages")
      } catch (error) {
        toast.error(getErrorMessage(error))
      }
    },
    [isEditing, page, createPage, updatePage, router],
  )

  const isSaving = createPage.isPending || updatePage.isPending || isSubmitting

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          {isEditing ? "Edit Page" : "New Page"}
        </h1>
        <Button type="submit" size="sm" disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Save />
          )}
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="grid gap-4 max-w-2xl">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Page title"
            {...register("title")}
            aria-invalid={!!errors.title}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            placeholder="/page-slug"
            {...register("slug", {
              onChange: () => setSlugManuallyEdited(true),
            })}
            aria-invalid={!!errors.slug}
          />
          {errors.slug && (
            <p className="text-sm text-destructive">{errors.slug.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Auto-generated from title. Edit to customize.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Content</Label>
        <div className="min-h-[500px] rounded-lg border border-input overflow-hidden">
          <MDXEditor
            ref={editorRef}
            markdown={page?.body ?? ""}
            placeholder="Start writing..."
          />
        </div>
      </div>
    </form>
  )
}
