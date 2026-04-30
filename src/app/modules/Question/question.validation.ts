import z from 'zod';

export const QuestionValidation = {
  createQuestion: z.object({
    body: z.object({
      chapterId: z.string({ required_error: 'chapterId is required' }),
      lessonId: z.string({ required_error: 'lessonId is required' }),
      type: z.enum(
        ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'PUT_IN_ORDER', 'FLIPCARD', 'MATCH_PAIRS'],
        { required_error: 'type is required' }
      ),
      title: z.string({ required_error: 'title is required' }),
      document: z.string().optional(),
      suggestion: z.string().optional(),
      level: z.enum(['BEGINNER', 'MEDIUM', 'ADVANCED']).optional(),

      options: z.any().optional(),
      answer: z.any().optional(),
      order: z.number().optional(),
      fixedScore: z.number().optional(),
    }),
  }),

  updateQuestion: z.object({
    body: z.object({
      chapterId: z.string().optional(),
      lessonId: z.string().optional(),
      type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'PUT_IN_ORDER', 'FLIPCARD', 'MATCH_PAIRS']).optional(),
      title: z.string().optional(),
      document: z.string().optional(),
      suggestion: z.string().optional(),
      level: z.enum(['BEGINNER', 'MEDIUM', 'ADVANCED']).optional(),
      options: z
        .array(
          z.object({
            text: z.string(),
            isCorrect: z.boolean().optional(),
          })
        )
        .optional(),
      answer: z.any().optional(),
      order: z.number().optional(),
      fixedScore: z.number().optional(),
    }),
  }),
};
