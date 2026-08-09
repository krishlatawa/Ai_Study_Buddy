import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { todoCreateSchema } from "@/lib/validations/todo";
import { noCacheJsonResponse } from "@/lib/cache-headers";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized." }, { status: 401 });

  const todos = await prisma.todo.findMany({
    where: { userId: user.user_id },
    orderBy: [{ completed: "asc" }, { createdAt: "desc" }],
  });

  return noCacheJsonResponse({todos});
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = await request.json();
    const validation = todoCreateSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return Response.json({ error: firstError.message }, { status: 400 });
    }

    const { title, difficulty } = validation.data;

    const todo = await prisma.todo.create({
      data: { title, difficulty, userId: user.user_id },
    });
    return Response.json({ todo }, { status: 201 });
  } catch (error) {
    if (error?.code === "P2002") {
      return Response.json({ error: "A task with this title already exists." }, { status: 400 });
    }
    return Response.json({ error: "Unable to create the task." }, { status: 500 });
  }
}
