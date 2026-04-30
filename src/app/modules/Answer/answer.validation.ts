import z from 'zod';

export const AnswerValidation = {
  createAnswer: z.object({
    body: z.object({
      questionId: z.string({ required_error: 'questionId is required' }),
      text: z.string({ required_error: 'Answer text is required' }),
      isCorrect: z.boolean().optional(),
     
    }),
  }),

  updateAnswer: z.object({
    body: z.object({
      text: z.string().optional(),
      isCorrect: z.boolean().optional(),
    }),
  }),
};
