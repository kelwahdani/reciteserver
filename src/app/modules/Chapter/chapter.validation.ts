import z from 'zod';

export const ChapterValidation = {
  createChapter: z.object({
    body: z.object({
      title: z.string({ required_error: 'Title is required' }),
      level: z.enum(['BEGINNER', 'MEDIUM', 'ADVANCED'], {
        required_error: 'Level is required',
      }).optional(),
      order: z.number({ required_error: 'Order is required' }).optional(),
      image: z.string({ required_error: 'Image is required' }),
    }),
  }),

  updateChapter: z.object({
    body: z.object({
      title: z.string().optional(),
      level: z.enum(['BEGINNER', 'MEDIUM', 'ADVANCED']).optional(),
      order: z.number().optional().optional(),
      image: z.string().optional(),
    }),
  }),
};
