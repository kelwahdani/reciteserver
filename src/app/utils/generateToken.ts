import jwt, { Secret } from 'jsonwebtoken';


export const generateToken = (
  payload: {
    id: string;
    name: string;
    email: string;
    userName: string;
    role: string;

  },
  secret: Secret,
  expiresIn: string,
) => {
  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn,
  });
};
