import z from 'zod';

export const CertificateValidation = {
  create: z.object({
    body: z.object({
      email: z.string({ required_error: 'email is required' }),
      
    }),
  }),
};
