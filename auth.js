import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./lib/prisma";

export const authOptions = {
  secret: process.env.AUTH_SECRET,
  session: { 
    strategy: "jwt",
    maxAge: 3 * 24 * 60 * 60, // 3 days in seconds
  },
  pages: { signIn: "/signin" },
  providers: [Credentials({
    credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
    async authorize(credentials) {
      const email = credentials?.email?.toString().trim().toLowerCase();
      const password = credentials?.password?.toString();
      if (!email || !password) return null;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) return null;
      return { id: String(user.user_id), name: user.Name, email: user.email };
    },
  })],
};
