const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export function validateImage(file: File): {
  valid: boolean
  error?: string
} {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed: PNG, JPG, JPEG, WEBP`,
    }
  }
  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds 5MB limit`,
    }
  }
  return { valid: true }
}

export function generateImageFilename(originalName: string): string {
  const parts = originalName.split(".")
  const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : "png"
  return `image-${Date.now()}.${ext}`
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove data URL prefix (data:image/png;base64,)
      resolve(result.split(",")[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
