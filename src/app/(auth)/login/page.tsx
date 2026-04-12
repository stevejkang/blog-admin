import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { LoginForm } from "./login-form"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const session = await auth()
  if (session) redirect("/")
  const { error } = await searchParams
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <LoginForm error={error} />
    </div>
  )
}
