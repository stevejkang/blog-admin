export function generateDirectoryName(
  date: string,
  category: string,
  title: string,
): string {
  const yy = date.slice(2, 4)
  const mm = date.slice(5, 7)
  const dd = date.slice(8, 10)
  const slugWords = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
  return `${yy}${mm}${dd}-${category}-${slugWords}`
}

export function generateSlug(
  date: string,
  category: string,
  title: string,
): string {
  const yy = date.slice(2, 4)
  const mm = date.slice(5, 7)
  const dd = date.slice(8, 10)
  const slugWords = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
  return `/${category}-${slugWords}-${yy}${mm}${dd}`
}

export function parseDirectoryName(
  dirName: string,
): { date: string; category: string; slugWords: string } | null {
  const match = dirName.match(/^(\d{6})-([a-z]+)-(.+)$/)
  if (!match) return null
  const [, dateStr, category, slugWords] = match
  const yy = dateStr.slice(0, 2)
  const mm = dateStr.slice(2, 4)
  const dd = dateStr.slice(4, 6)
  return { date: `20${yy}-${mm}-${dd}`, category, slugWords }
}
