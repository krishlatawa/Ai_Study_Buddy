import { z } from 'zod';

// Todo creation
export const todoCreateSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title is required')
    .max(200, 'Task title must be 200 characters or fewer')
    .trim(),
  difficulty: z.enum(['Easy', 'Medium', 'Boss']).default('Easy'),
});

// Todo update
export const todoUpdateSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title is required')
    .max(200, 'Task title must be 200 characters or fewer')
    .trim()
    .optional(),
  completed: z.boolean().optional(),
}).refine(data => data.title !== undefined || data.completed !== undefined, {
  message: 'At least one field (title or completed) must be provided',
});

// Export types
export type TodoCreateInput = z.infer<typeof todoCreateSchema>;
export type TodoUpdateInput = z.infer<typeof todoUpdateSchema>;

