import crypto from 'crypto';
import config from '../../../config';
const generateHashedToken = (token: string) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return hashedToken;
};
const generateEmailVerificationLink = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const emailVerificationLink = `${config.base_url_server}/api/v1/users/verify-email/${token}`;
  const hashedToken = generateHashedToken(token);
  return [emailVerificationLink, hashedToken];
};

const generateForgotPasswordLink = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const forgotPasswordLink = `${config.base_url_server}/api/v1/auth/forgot-password/${token}`;
  const hashedToken = generateHashedToken(token);
  return { forgotPasswordLink, hashedToken };
};
export const verification = {
  generateEmailVerificationLink,
  generateHashedToken,
  generateForgotPasswordLink,
};
