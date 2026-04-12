import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"

const ALLOWED_USERS = ["stevejkang"]

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [GitHub],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ profile }) {
      return ALLOWED_USERS.includes(profile?.login as string)
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub
      }
      return session
    },
    authorized({ auth }) {
      return !!auth?.user
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
})
