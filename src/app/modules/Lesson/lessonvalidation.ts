import z from 'zod';

export const LessonValidation = {
  createLesson: z.object({
    body: z.object({
      chapterId: z
        .string({ required_error: 'Chapter ID is required' })
        .min(1, 'Chapter ID cannot be empty'),
      title: z
        .string({ required_error: 'Title is required' })
        .min(1, 'Title cannot be empty'),
      content: z
        .string({ required_error: 'Content is required' })
        .min(1, 'Content cannot be empty').optional(),
      order: z
        .number({ required_error: 'Order is required' }).optional(),
      image: z
        .string({ required_error: 'Image is required' })
        .min(1, 'Image URL cannot be empty'),
      level: z
        .string({ required_error: 'level is required' }).optional(),
      
    }),
  }),

  updateLesson: z.object({
    body: z.object({
      chapterId: z
        .string()
        .min(1, 'Chapter ID cannot be empty')
        .optional(),
      content: z
        .string()
        .min(1, 'Content cannot be empty')
        .optional(),
      title: z
        .string()
        .min(1, 'Title cannot be empty')
        .optional(),
      level: z
        .string()
        .min(1, 'level cannot be empty')
        .optional(),
      order: z
        .number()
        .optional(),
      image: z
        .string()
        .min(1, 'Image URL cannot be empty')
        .optional(),
    }),
  }),
};
