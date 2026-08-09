import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return null;

  return prisma.user.findUnique({
    where: { email },
    select: { user_id: true, Name: true, email: true },
  });
}
