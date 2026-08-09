import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { todoUpdateSchema } from "@/lib/validations/todo";
import { calculateLevel, calculateStreak } from "@/lib/progress-utils.mjs";

async function getOwnedTodo(todoId) {
  const user = await getCurrentUser();
  if (!user) return { user: null, todo: null };
  const id = Number(todoId);
  if (!Number.isInteger(id)) return { user, todo: null };
  const todo = await prisma.todo.findFirst({ where: { id, userId: user.user_id } });
  return { user, todo };
}

export async function PATCH(request, { params }) {
  const { todoId } = await params;
  const { user, todo } = await getOwnedTodo(todoId);
  if (!user) return Response.json({ error: "Unauthorized." }, { status: 401 });
  if (!todo) return Response.json({ error: "Task not found." }, { status: 404 });

  try {
    const body = await request.json();
    const validation = todoUpdateSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return Response.json({ error: firstError.message }, { status: 400 });
    }

    const isFirstTimeCompleting = validation.data.completed === true && !todo.isRewardClaimed;

    let updatedTodo;
    let updatedProfile = null;

    if (isFirstTimeCompleting) {
      const xpGain = todo.difficulty === "Boss" ? 50 : todo.difficulty === "Medium" ? 20 : 10;

      await prisma.$transaction(async (tx) => {
        updatedTodo = await tx.todo.update({
          where: { id: todo.id },
          data: { completed: true, isRewardClaimed: true },
        });

        const currentUser = await tx.user.findUnique({
          where: { user_id: user.user_id },
        });

        const newXp = (currentUser?.xp ?? 0) + xpGain;
        const newLevel = calculateLevel(newXp);
        const derivedStreak = calculateStreak(currentUser?.lastTaskDate, new Date(), currentUser?.streak ?? 0);

        const updatedUser = await tx.user.update({
          where: { user_id: user.user_id },
          data: {
            xp: newXp,
            level: newLevel,
            streak: derivedStreak,
            lastTaskDate: new Date(),
          },
          select: {
            user_id: true,
            Name: true,
            email: true,
            xp: true,
            level: true,
            streak: true,
            lastTaskDate: true,
          },
        });

        updatedProfile = {
          ...updatedUser,
          level: newLevel,
          streak: derivedStreak,
        };
      });
    } else {
      const data = {};
      if (validation.data.title !== undefined) data.title = validation.data.title;
      if (validation.data.completed !== undefined) data.completed = validation.data.completed;
      updatedTodo = await prisma.todo.update({ where: { id: todo.id }, data });
    }

    return Response.json({ todo: updatedTodo, profile: updatedProfile });
  } catch (error) {
    if (error?.code === "P2002") {
      return Response.json({ error: "A task with this title already exists." }, { status: 400 });
    }
    return Response.json({ error: "Unable to update the task." }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const { todoId } = await params;
  const { user, todo } = await getOwnedTodo(todoId);
  if (!user) return Response.json({ error: "Unauthorized." }, { status: 401 });
  if (!todo) return Response.json({ error: "Task not found." }, { status: 404 });

  await prisma.todo.delete({ where: { id: todo.id } });
  return new Response(null, { status: 204 });
}
