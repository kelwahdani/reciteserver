import z from 'zod';

const registerUser = z.object({
  body: z.object({
    firstName: z.string({
      required_error: 'First Name is required!',
    }),
    lastName: z.string({
      required_error: 'Last Name is required!',
    }),
    email: z.string({
      required_error: 'Email is required!',
    }).email({ message: 'Invalid email format!' }),
    userName: z.string({
      required_error: 'UserName is required!',
    }),
    password: z.string({
      required_error: 'Password is required!',
    }),
  }),
});

export const UserValidations = { registerUser };
