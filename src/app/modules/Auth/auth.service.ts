import * as bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import { Secret } from 'jsonwebtoken';
import config from '../../../config';
import AppError from '../../errors/AppError';
import { generateToken } from '../../utils/generateToken';
import prisma from '../../utils/prisma';


const loginUserFromDB = async (payload: {
  emailOrUserName: string;
  password: string;
   fcmToken?:string
}) => {
  if (!payload.emailOrUserName || !payload.password) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Email or Username and Password are required');
  }

  // Find user by email or username
  const userData: any = await prisma.user.findFirst({
    where: {
      OR: [
        { email: payload.emailOrUserName },
        { userName: payload.emailOrUserName },
      ],
    },
  });

 if (!userData) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User not found');
  }


  // Check password
  const isCorrectPassword: boolean = await bcrypt.compare(
    payload.password,
    userData.password,
  );

  if (!isCorrectPassword) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Password incorrect');
  }

  const accessToken = await generateToken(
    {
      id: userData.id,
      name: `${userData.firstName} ${userData.lastName}`,
      email: userData.email,
      userName: userData.userName,
      role: userData.role,
    },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string,
  );


    if (payload.fcmToken) {
    await prisma.user.update({
      where: {
        id: userData.id,
      },
      data: {
        fcmToken: payload.fcmToken
      },
    });
  }

  return {
    id: userData.id,
    name: `${userData.firstName} `,
    email: userData.email,
    userName: userData.userName,
    role: userData.role,
    lavel:userData.lavel,
    accessToken,
    dailyGoal:userData.dailyGoal? true:false,
     fcmToken:userData?.fcmToken
  };
};

export const AuthServices = { loginUserFromDB };
