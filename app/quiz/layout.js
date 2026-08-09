import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export default async function QuizLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/signin");

  return children;
}
