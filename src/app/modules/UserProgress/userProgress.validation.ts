import z from 'zod';

export const UserProgressValidation = {
  create: z.object({
    body: z.object({
      userId: z.string({ required_error: 'userId is required' }),
      lessonId: z.string({ required_error: 'lessonId is required' }),
      completed: z.boolean().optional(),
      score: z.number().optional(),
    }),
  }),

  update: z.object({
    body: z.object({
      completed: z.boolean().optional(),
      score: z.number().optional(),
    }),
  }),
};
