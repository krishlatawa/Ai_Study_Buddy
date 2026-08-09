import { z } from 'zod';

const answerValueSchema = z.union([z.string(), z.boolean(), z.array(z.string())]);
const answerEntrySchema = z.object({
  questionId: z.string(),
  answer: answerValueSchema,
});

// Quiz generation schema
export const quizGenerateSchema = z.object({
  notes: z
    .string()
    .min(10, 'Notes must be at least 10 characters long')
    .max(10000, 'Notes must be less than 10000 characters'),
});

// Quiz submission schema
export const quizSubmitSchema = z.object({
  answers: z
    .union([z.array(answerEntrySchema), z.record(z.string(), answerValueSchema)])
    .optional()
    .default([]),
  timeTaken: z
    .number()
    .int('Time taken must be an integer')
    .min(0, 'Time taken cannot be negative')
    .optional(),
});

// Quiz question schema (for internal validation)
export const quizQuestionSchema = z.object({
  type: z.enum(['MCQ', 'SHORT_ANSWER', 'TRUE_FALSE']),
  question: z.string().min(1, 'Question is required'),
  options: z.array(z.string()).optional(),
  answer: answerValueSchema.optional(),
  order: z.number().int(),
});

// Export types for TypeScript inference
export type QuizGenerateInput = z.infer<typeof quizGenerateSchema>;
export type QuizSubmitInput = z.infer<typeof quizSubmitSchema>;
export type QuizQuestionInput = z.infer<typeof quizQuestionSchema>;
