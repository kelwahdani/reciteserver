import z from 'zod';

export const SavedQuestionValidation = {
  create: z.object({
    body: z.object({
      userId: z.string({ required_error: 'userId is required' }),
      questionId: z.string({ required_error: 'questionId is required' }),
    }),
  }),
};
