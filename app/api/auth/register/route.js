import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validations/auth";
import { apiError, handleZodError } from "@/lib/api-error";
import { getRatelimit, getIp, rateLimitResponse } from "@/lib/ratelimit";

export async function POST(request) {
  try {
    // ═══════════════════════════════════════════════════════════════
    // UPSTASH RATE LIMIT (production-grade, works across all Vercel
    // serverless instances via HTTP REST to Redis)
    // ═══════════════════════════════════════════════════════════════
    const ip = getIp(request);                                    // ← Extract client IP from headers
    const { success, limit, remaining, reset } = await           // ← Check with Upstash Redis
      getRatelimit().limit(ip);                                    // ← Keyed by IP address

    if (!success) {                                                // ← Over the limit → 429
      return rateLimitResponse(limit, remaining, reset);
    }

    const body = await request.json();
    const validation = signupSchema.safeParse({
      email: body.email,
      password: body.password,
      username: body.name,
    });

    if (!validation.success) {
      return handleZodError(validation.error);
    }

    const { email, password } = validation.data;
    const normalizedName = body.name?.trim();
    const normalizedEmail = email.toLowerCase();

    if (await prisma.user.findUnique({ where: { email: normalizedEmail } })) {
      return apiError("An account with this email already exists.", 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          Name: normalizedName,
          email: normalizedEmail,
          passwordHash,
        },
      });
    });
    return Response.json({ message: "Account created." }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return apiError("Unable to create your account. Please try again.", 500);
  }
}
