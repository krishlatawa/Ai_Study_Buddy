import { z } from 'zod';

// Feynman session creation
export const feynmanSessionSchema = z.object({
  topic: z
    .string()
    .min(3, 'Topic must be at least 3 characters')
    .max(200, 'Topic must be less than 200 characters')
    .trim(),
  notes: z
    .string()
    .max(10000, 'Notes must be less than 10000 characters')
    .trim()
    .optional()
    .or(z.literal('')),
});

// Feynman answer submission
export const feynmanRespondSchema = z.object({
  message: z
    .string()
    .min(1, 'Message is required')
    .max(5000, 'Message must be less than 5000 characters')
    .trim(),
});

// Export types
export type FeynmanSessionInput = z.infer<typeof feynmanSessionSchema>;
export type FeynmanRespondInput = z.infer<typeof feynmanRespondSchema>;

