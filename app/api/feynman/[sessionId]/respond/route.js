import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';
import { gradeAnswer } from '@/lib/feynman';
import { feynmanRespondSchema } from '@/lib/validations/feynman';
import { getRatelimit, getIp, rateLimitResponse } from '@/lib/ratelimit';

export async function POST(request, { params }) {
  try {
    // Upstash rate limit (works across all Vercel serverless instances)
    const ip = getIp(request);
    const { success, limit, remaining, reset } = await getRatelimit().limit(`feynman-respond:${ip}`);
    if (!success) {
      return rateLimitResponse(limit, remaining, reset);
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;
    const { message } = await request.json();

    const validation = feynmanRespondSchema.safeParse({ message });
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return NextResponse.json({ error: firstError.message }, { status: 400 });
    }

    // Fetch session with current state
    const session = await prisma.feynmanSession.findFirst({
      where: {
        id: sessionId,
        user_id: user.user_id,
      },
      include: {
        exchanges: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Session is already completed or abandoned' },
        { status: 400 }
      );
    }

    // Get question bank and current index
    const questionBank = session.questionBank;
    if (!questionBank || !Array.isArray(questionBank) || questionBank.length === 0) {
      return NextResponse.json(
        { error: 'Session has no questions. Please start a new session.' },
        { status: 400 }
      );
    }

    const currentIndex = session.currentQuestionIndex;
    const currentQuestion = questionBank[currentIndex];

    if (!currentQuestion) {
      return NextResponse.json(
        { error: 'No more questions. The session may already be complete.' },
        { status: 400 }
      );
    }

    // STEP 1: Grade the student's answer against the expected answer
    const gradeResult = await gradeAnswer(message, currentQuestion);

    // STEP 2: Update score if correct
    const newScore = gradeResult.isCorrect ? session.score + 1 : session.score;

    // Build AI response message based on grading
    let aiMessage = '';
    if (gradeResult.isCorrect) {
      aiMessage = `✅ **Correct!** ${gradeResult.feedback}\n\n`;
    } else {
      aiMessage = `❌ **Not quite.** ${gradeResult.feedback}\n\n${gradeResult.explanation}\n\n`;
    }

    // Check if this was the last question
    const isLastQuestion = currentIndex + 1 >= questionBank.length;

    if (isLastQuestion) {
      // Session complete!
      const xpEarned = calculateXP(newScore, questionBank.length);

      // Build final summary message
      const percentage = Math.round((newScore / questionBank.length) * 100);
      let sentiment = '';
      if (percentage >= 80) sentiment = '🌟 Excellent work! You really know your stuff!';
      else if (percentage >= 60) sentiment = '👍 Good job! You have a solid understanding.';
      else if (percentage >= 40) sentiment = '📚 Getting there! Review the weak spots below.';
      else sentiment = '💪 Keep studying! Review the concepts below and try again.';

      const finalMessage = `${aiMessage}---\n\n## 🎯 Session Complete!\n\n${sentiment}\n\n**Score:** ${newScore}/${questionBank.length} (${percentage}%)\n\n**Weak spots identified:** ${questionBank.length - newScore} areas to review\n\nCheck the results panel for a detailed breakdown.`;

      // Execute all session completion writes atomically in a transaction
      await prisma.$transaction(async (tx) => {
        // Save student answer
        await tx.feynmanExchange.create({
          data: {
            sessionId: session.id,
            role: 'student',
            message: message,
            questionRef: currentQuestion.id,
            order: session.exchanges.length,
          }
        });

        // Save AI exchange
        await tx.feynmanExchange.create({
          data: {
            sessionId: session.id,
            role: 'ai',
            message: aiMessage,
            order: session.exchanges.length + 1,
          }
        });

        // Save final summary exchange
        await tx.feynmanExchange.create({
          data: {
            sessionId: session.id,
            role: 'ai',
            message: finalMessage,
            order: session.exchanges.length + 2,
          }
        });

        // Update session: completed
        await tx.feynmanSession.update({
          where: { id: session.id },
          data: {
            status: 'COMPLETED',
            score: newScore,
            currentQuestionIndex: currentIndex + 1,
            xpEarned: xpEarned,
          }
        });

        // Award XP to user
        await tx.user.update({
          where: { user_id: user.user_id },
          data: {
            xp: { increment: xpEarned }
          }
        });

        // Create weak spot for wrong answer if applicable
        if (!gradeResult.isCorrect) {
          await tx.weakSpot.create({
            data: {
              user_id: user.user_id,
              topic: session.topic,
              description: `Had trouble explaining: "${currentQuestion.question}" — Expected: ${currentQuestion.expectedAnswer}`,
              source: 'FEYNMAN',
              sessionId: session.id,
              strength: 2,
            }
          });
        }
      });

      return NextResponse.json({
        success: true,
        exchange: {
          role: 'ai',
          message: aiMessage,
          grade: gradeResult,
        },
        finalSummary: {
          message: finalMessage,
          score: newScore,
          totalQuestions: questionBank.length,
          percentage: percentage,
          xpEarned: xpEarned,
          isComplete: true,
        },
        sessionStatus: 'COMPLETED',
      });

    } else {
      // Move to NEXT question
      const nextIndex = currentIndex + 1;
      const nextQuestion = questionBank[nextIndex];

      const nextQMessage = `${aiMessage}---\n\n**Question ${nextIndex + 1}/${questionBank.length}:**\n${nextQuestion.question}`;

      // Execute intermediate writes atomically in a transaction
      await prisma.$transaction(async (tx) => {
        // Save student answer
        await tx.feynmanExchange.create({
          data: {
            sessionId: session.id,
            role: 'student',
            message: message,
            questionRef: currentQuestion.id,
            order: session.exchanges.length,
          }
        });

        // Save AI exchange with next question
        await tx.feynmanExchange.create({
          data: {
            sessionId: session.id,
            role: 'ai',
            message: nextQMessage,
            order: session.exchanges.length + 1,
          }
        });

        // Update session progress
        await tx.feynmanSession.update({
          where: { id: session.id },
          data: {
            currentQuestionIndex: nextIndex,
            score: newScore,
          }
        });

        // Create weak spot if answer was wrong
        if (!gradeResult.isCorrect) {
          await tx.weakSpot.create({
            data: {
              user_id: user.user_id,
              topic: session.topic,
              description: `Had trouble explaining: "${currentQuestion.question}" — Expected: ${currentQuestion.expectedAnswer}`,
              source: 'FEYNMAN',
              sessionId: session.id,
              strength: 2,
            }
          });
        }
      });

      return NextResponse.json({
        success: true,
        exchange: {
          role: 'ai',
          message: nextQMessage,
          grade: gradeResult,
        },
        currentScore: newScore,
        totalQuestions: questionBank.length,
        currentQuestion: nextIndex + 1,
        sessionStatus: 'IN_PROGRESS',
      });
    }

  } catch (error) {
    console.error('Feynman session respond error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process response' },
      { status: 500 }
    );
  }
}

/**
 * Calculate XP based on performance
 */
function calculateXP(score, total) {
  const percentage = score / total;
  if (percentage >= 0.9) return 100;
  if (percentage >= 0.7) return 75;
  if (percentage >= 0.5) return 50;
  return 25;
}

