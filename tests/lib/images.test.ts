import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { validateImage, generateImageFilename, fileToBase64 } from "@/lib/images"

function createMockFile(
  name: string,
  size: number,
  type: string,
): File {
  const buffer = new ArrayBuffer(size)
  return new File([buffer], name, { type })
}

describe("validateImage", () => {
  it("accepts valid PNG file", () => {
    const file = createMockFile("photo.png", 1024, "image/png")
    expect(validateImage(file)).toEqual({ valid: true })
  })

  it("accepts valid JPEG file", () => {
    const file = createMockFile("photo.jpg", 2048, "image/jpeg")
    expect(validateImage(file)).toEqual({ valid: true })
  })

  it("accepts valid WEBP file", () => {
    const file = createMockFile("photo.webp", 512, "image/webp")
    expect(validateImage(file)).toEqual({ valid: true })
  })

  it("rejects invalid file type", () => {
    const file = createMockFile("doc.txt", 100, "text/plain")
    const result = validateImage(file)
    expect(result.valid).toBe(false)
    expect(result.error).toContain("Invalid file type: text/plain")
  })

  it("rejects SVG file type", () => {
    const file = createMockFile("icon.svg", 100, "image/svg+xml")
    const result = validateImage(file)
    expect(result.valid).toBe(false)
    expect(result.error).toContain("Invalid file type")
  })

  it("rejects file exceeding 5MB limit", () => {
    const sixMB = 6 * 1024 * 1024
    const file = createMockFile("huge.png", sixMB, "image/png")
    const result = validateImage(file)
    expect(result.valid).toBe(false)
    expect(result.error).toContain("exceeds 5MB limit")
  })

  it("accepts file exactly at 5MB limit", () => {
    const fiveMB = 5 * 1024 * 1024
    const file = createMockFile("max.png", fiveMB, "image/png")
    expect(validateImage(file)).toEqual({ valid: true })
  })
})

describe("generateImageFilename", () => {
  it("produces filename with timestamp and original extension", () => {
    const now = Date.now()
    vi.setSystemTime(now)

    const result = generateImageFilename("photo.png")
    expect(result).toBe(`image-${now}.png`)

    vi.useRealTimers()
  })

  it("lowercases the extension", () => {
    const now = Date.now()
    vi.setSystemTime(now)

    const result = generateImageFilename("photo.JPG")
    expect(result).toBe(`image-${now}.jpg`)

    vi.useRealTimers()
  })

  it("defaults to png when no extension", () => {
    const now = Date.now()
    vi.setSystemTime(now)

    const result = generateImageFilename("noext")
    expect(result).toBe(`image-${now}.png`)

    vi.useRealTimers()
  })
})

describe("fileToBase64", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let capturedReader: any

  beforeEach(() => {
    capturedReader = null

    vi.stubGlobal(
      "FileReader",
      class MockFileReader {
        result: string | null = null
        onload: ((ev: ProgressEvent<FileReader>) => void) | null = null
        onerror: ((ev: unknown) => void) | null = null
        readAsDataURL = vi.fn()

        constructor() {
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          capturedReader = this
        }
      },
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("converts file to base64 string without data URL prefix", async () => {
    const file = createMockFile("test.png", 5, "image/png")
    const promise = fileToBase64(file)

    capturedReader.result = "data:image/png;base64,aGVsbG8="
    capturedReader.onload({} as ProgressEvent<FileReader>)

    const result = await promise
    expect(capturedReader.readAsDataURL).toHaveBeenCalledWith(file)
    expect(result).toBe("aGVsbG8=")
  })

  it("rejects on FileReader error", async () => {
    const file = createMockFile("test.png", 5, "image/png")
    const promise = fileToBase64(file)

    capturedReader.onerror(new Error("read failed"))

    await expect(promise).rejects.toThrow("read failed")
  })
})
