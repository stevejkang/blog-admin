"use client"

import { useCallback, useRef, useState, type DragEvent } from "react"
import {
  validateImage,
  fileToBase64,
  generateImageFilename,
} from "@/lib/images"
import { Upload, X, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ImageUpload } from "@/types"

interface BannerUploadProps {
  value?: string
  previewUrl?: string
  onUpload: (image: ImageUpload) => void
  onRemove: () => void
}

export function BannerUpload({
  value,
  previewUrl,
  onUpload,
  onRemove,
}: BannerUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(
    async (file: File) => {
      setError(null)

      const validation = validateImage(file)
      if (!validation.valid) {
        setError(validation.error!)
        return
      }

      const objectUrl = URL.createObjectURL(file)
      setLocalPreview(objectUrl)

      const filename = generateImageFilename(file.name)
      const content = await fileToBase64(file)

      onUpload({
        filename,
        content,
        type: "banner",
      })
    },
    [onUpload],
  )

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        processFile(file)
      }
    },
    [processFile],
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile()
          if (file) {
            processFile(file)
            break
          }
        }
      }
    },
    [processFile],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        processFile(file)
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    [processFile],
  )

  const handleRemove = useCallback(() => {
    if (localPreview) {
      URL.revokeObjectURL(localPreview)
    }
    setLocalPreview(null)
    setError(null)
    onRemove()
  }, [localPreview, onRemove])

  const displayPreview = localPreview || previewUrl
  const hasImage = value || localPreview

  return (
    <div className="space-y-2" onPaste={handlePaste}>
      {hasImage && displayPreview ? (
        <div className="relative overflow-hidden rounded-lg border border-border">
          <img
            src={displayPreview}
            alt="Banner preview"
            className="h-40 w-full object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon-xs"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="size-3" />
          </Button>
          <div className="bg-muted/80 px-3 py-1.5 text-xs text-muted-foreground">
            {value || "New banner"}
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              fileInputRef.current?.click()
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
          )}
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            {isDragging ? (
              <ImageIcon className="size-5" />
            ) : (
              <Upload className="size-5" />
            )}
            <span className="text-sm">
              {isDragging
                ? "Drop image here"
                : "Drop, paste, or click to upload banner"}
            </span>
          </div>
          <span className="text-xs text-muted-foreground/60">
            PNG, JPG, WEBP up to 5MB
          </span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
