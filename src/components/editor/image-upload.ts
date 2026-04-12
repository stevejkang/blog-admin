import {
  validateImage,
  generateImageFilename,
  fileToBase64,
} from "@/lib/images"
import type { ImageUpload } from "@/types"

type ImageCollector = {
  images: ImageUpload[]
  addImage: (image: ImageUpload) => void
}

export function createImageUploadHandler(collector: ImageCollector) {
  return async (file: File): Promise<string> => {
    const validation = validateImage(file)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    const filename = generateImageFilename(file.name)
    const content = await fileToBase64(file)

    collector.addImage({
      filename,
      content,
      type: "inline",
    })

    return `./${filename}`
  }
}
