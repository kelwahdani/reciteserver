import z from 'zod';

const loginUser = z.object({
  body: z.object({
    emailOrUserName: z
      .string({
        required_error: 'Email or Username is required!',
      })
      .min(3, 'Email or Username must be at least 3 characters'),
    password: z.string({
      required_error: 'Password is required!',
    }),
  }),
});

export const authValidation = { loginUser };
