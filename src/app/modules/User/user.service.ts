import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import httpStatus from 'http-status';
import { Secret } from 'jsonwebtoken';
import config from '../../../config';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { verification } from '../../errors/helpers/generateEmailVerificationLink';
import { generateToken } from '../../utils/generateToken';
import prisma from '../../utils/prisma';
import Email from '../../utils/sendMail';
import { firebasePushNotificationServices } from '../Firebase/firebasePushNotificationServices';
import {
  failedEmailVerificationHTML,
  successEmailVerificationHTML,
} from './user.constant';

interface UserWithOptionalPassword extends Omit<User, 'password'> {
  password?: string;
}

// --------------------
// 1️⃣ Register user & first lesson unlock
// const registerUserIntoDB = async (payload: User) => {
//   const hashedPassword = await bcrypt.hash(payload.password, 12);

//   const newUser = await prisma.$transaction(async (tx) => {
//     // 1️⃣ User create
//     const createdUser = await tx.user.create({
//       data: {
//         ...payload,
//         password: hashedPassword,
//       },
//     });

//     // 2️⃣ First chapter first lesson unlock
//     const firstChapter = await tx.chapter.findFirst({
//       orderBy: { order: 'asc' },
//       include: { lessons: { orderBy: { order: 'asc' } } },
//     });

//     if (firstChapter && firstChapter.lessons.length > 0) {
//       const firstLesson = firstChapter.lessons[0];

//       await tx.userProgress.create({
//         data: {
//           userId: createdUser.id,
//           lessonId: firstLesson.id,
//           unLocked: true,
//         },
//       });
//     }

//     // 3️⃣ প্রতিটা user এর জন্য week days create হবে
//     const weekDays = [
//       "Sunday",
//       "Monday",
//       "Tuesday",
//       "Wednesday",
//       "Thursday",
//       "Friday",
//       "Saturday",
//     ];

//     await tx.weekDay.createMany({
//       data: weekDays.map((day, i) => ({
//         name: day,
//         order: i + 1,
//         userId: createdUser.id,
//       })),
//     });

//     return createdUser;
//   });

//   const userWithOptionalPassword = newUser as UserWithOptionalPassword;
//   delete userWithOptionalPassword.password;

//   return userWithOptionalPassword;
// };

const registerUserIntoDB = async (payload: User) => {
  const hashedPassword = await bcrypt.hash(payload.password, 12);

  const newUser: any = await prisma.$transaction(async tx => {
    // 1️⃣ User create
    const createdUser = await tx.user.create({
      data: {
        ...payload,
        password: hashedPassword,
      },
    });

    // 2️⃣ First chapter first lesson unlock
    // const firstChapter = await tx.chapter.findFirst({
    //   orderBy: { order: 'asc' },
    //   include: { lessons: { orderBy: { order: 'asc' } } },
    // });

    // if (firstChapter && firstChapter.lessons.length > 0) {
    //   const firstLesson = firstChapter.lessons[0];

    //   await tx.userProgress.create({
    //     data: {
    //       userId: createdUser.id,
    //       lessonId: firstLesson.id,
    //       unLocked: true,
    //     },
    //   });
    // }

    // 3️⃣ প্রতিটা user এর জন্য week days create হবে
    const weekDays = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    //
    await tx.weekDay.createMany({
      data: weekDays.map((day, i) => ({
        name: day,
        order: i + 1,
        userId: createdUser.id,
      })),
    });

    return createdUser;
  });

  // 🔑 password বাদ দিয়ে user return করা
  const { password, ...userWithoutPassword } = newUser;

if(newUser){

  await prisma.userStar.create({
    data:{
      userId:newUser.id
    }
  })
}

  // ✅ Access Token Generate
  const accessToken = await generateToken(
    {
      id: newUser.id,
      name: `${newUser.firstName} ${newUser.lastName}`,
      email: newUser.email,
      userName: newUser.userName,
      role: newUser.role,
    },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string,
  );

  return {
    ...userWithoutPassword,
    accessToken,
  };
};

// const getAllUsersFromDB = async (query: any) => {
//   const select = {
//     id: true,
//     // firstName: true,
//     // lastName: true,
//     userName: true,
//     email: true,
//     lavel: true,
//     status: true,
//     image: true,
//     progressStatus: true,
//     progress:true,
//     _count: {
//       select: {
//         CompleteChapter: true, // ✅ শুধু true দিলেই count আসবে
//       },
//     },
//   };

//   const usersQuery = new QueryBuilder(prisma.user, query, { select });
//   const result = await usersQuery
//     .search([])
//     .filter()
//     .sort()
//     .paginate()
//     .execute();

//   const pagination = await usersQuery.countTotal();

//   return {
//     meta: pagination,
//     result,
//   };
// };

const getAllUsersFromDB = async (query: any) => {

  const select = {
    id: true,
    firstName: true,
    lastName: true,
    userName: true,
    email: true,
    role:true,
    lavel: true,
    status: true,
    image: true,
    progressStatus: true,
    _count: {
      select: {
        CompleteChapter: true,
        
      },
    },
  };

    //  _count: {
    //   select: {
    //     CompleteChapter: true,
        
    //   },
  const usersQuery = new QueryBuilder(prisma.user, query, { select });
  const users = await usersQuery
    .search(['firstName', 'lastName', 'email']) // চাইলে firstName, lastName দিয়েও search করা যাবে
    .filter()
    .sort()
    .paginate()
    .execute();

  const pagination = await usersQuery.countTotal();

  // 🔥 সব lesson এর সংখ্যা বের করা (একবারই query হবে)
  const totalLessons = await prisma.lesson.count();
const filteredUsers = users.filter((user:any) => user.role === "USER");

  const finalResult = await Promise.all(
    filteredUsers.map(async (user: any) => {
      // ওই ইউজার কয়টা lesson complete করেছে


 
         
    
      const {completedChaptersCount}= await getChapterAndAnswerCount(user.id)
      


      const { percentage } = await myProgressInDB(user.id);


    
       user._count.CompleteChapter=completedChaptersCount
      return {
        ...user,
        progressPercentage: percentage,
      };
    }),
  );

  return {
    meta: pagination,
    result: finalResult,
  };
};

const getMyProfileFromDB = async (id: string) => {
  const Profile = await prisma.user.findUniqueOrThrow({
    where: {
      id: id,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      lavel: true,
      userName: true,
      image: true,
      number: true,
      createdAt: true,
      updatedAt: true,
      daailyGoalNotification: true,
      progressStatus: true,
    },
  });

  return Profile;
};

// 

//  all sstudent
const getAllStudentFromDB = async (search?: string) => {
  const Profile = await prisma.user.findMany({
    where: {
      role: 'USER',
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { userName: { contains: search, mode: 'insensitive' } }, // চাইলে userName দিয়েও
        ],
      }),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      lavel: true,
      userName: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return { count: Profile.length, data: Profile };
};

const getUserDetailsFromDB = async (id: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      lavel: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return user;
};

const updateMyProfileIntoDB = async (id: string, payload: any) => {
  if (payload.readStart) {
    payload.readEnd = payload.readStart;
  }


  console.log(payload)
  

  const userProfileData = await prisma.user.update({
    where: { id },
    data: payload,
  });

  return userProfileData;
};

const updateUserFromDB = async (id: string, payload: User) => {
  const updatedUser = await prisma.user.update({
    where: { id },
    data: payload,
  });

  return updatedUser;
};

const updateUserRoleStatusIntoDB = async (id: string, payload: any) => {
  const result = await prisma.user.update({
    where: {
      id: id,
    },
    data: payload,
  });
  return result;
};

const changePassword = async (user: any, payload: any) => {
  // ✅ ইউজার খুঁজে বের করো
  const userData = await prisma.user.findFirst({
    where: {
      email: user.email,
      status: 'ACTIVE',
    },
  });

 

  if (!userData) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not found!');
  }

  // ✅ old password চেক
  // এখানে আপনি bcrypt.compare() ফাংশনে সরাসরি payload.oldPassword ব্যবহার করবেন।
  // bcrypt নিজে থেকেই ইনপুট পাসওয়ার্ডকে হ্যাশ করে ডেটাবেসের হ্যাশের সাথে তুলনা করবে।
  const isCorrectPassword: boolean = await bcrypt.compare(
    payload.oldPassword,
    userData.password,
  );

  if (!isCorrectPassword) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Password incorrect!');
  }

  // ✅ new password hash করো
  const hashedPassword: string = await bcrypt.hash(payload.newPassword, 12);

  // ✅ update করো
  const updatedUser = await prisma.user.update({
    where: { id: userData.id },
    data: { password: hashedPassword },
  });

  // ✅ Push Notification পাঠাও (optional)
//   if (updatedUser && userData.fcmToken) {
//  if(userData.daailyGoalNotification===true){
//      await firebasePushNotificationServices.sendSinglePushNotification({
//       body: {
//         title: 'Password Changed',
//         body: 'Your password has been successfully changed.',
//       },
//       body: {
//         title: 'Password Changed',
//         body: 'Your password has been successfully changed.',
//       },
//       fcmToken: userData.fcmToken,
//     });
//  }
//   }
  return {
    message: 'Password changed successfully!',
  };
};

const resendUserVerificationEmail = async (email: string) => {
  const [emailVerificationLink, hashedToken] =
    verification.generateEmailVerificationLink();

  const user = await prisma.user.update({
    where: { email: email },
    data: {
      emailVerificationToken: hashedToken,
      emailVerificationTokenExpires: new Date(Date.now() + 3600 * 1000),
    },
  });

  const emailSender = new Email(user);
  await emailSender.sendEmailVerificationLink(
    'Email verification link',
    emailVerificationLink,
  );
  return user;
};

const verifyUserEmail = async (res: Response, token: string) => {
  const hashedToken = verification.generateHashedToken(token);
  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: hashedToken,
    },
  });

  if (!user) {
    // throw new AppError(
    //   httpStatus.BAD_REQUEST,
    //   'Invalid email verification token.',
    // );

    res.send(failedEmailVerificationHTML(config.base_url_client as string));
    return;
  }

  if (
    user &&
    user.emailVerificationTokenExpires &&
    user.emailVerificationTokenExpires < new Date(Date.now())
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Email verification token has expired. Please try resending the verification email again.',
    );
  }
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpires: null,
    },
  });

  if (updatedUser.isEmailVerified) {
    res.send(successEmailVerificationHTML());
    return updatedUser;
  }

  return updatedUser;
};

// Generate OTP and send to user's email
// Your existing code, with added try...catch
const sendPasswordResetOtp = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found with this email');
  }

  // const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP

  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const updata = await prisma.user.update({
    where: { email },
    data: {
      otp,
      otpExpiry,
    },
  });

  if (updata) {
    const emailSender = new Email(user);
    try {
      // Added try...catch block here
      await emailSender.sendCustomEmail(
        'رمز إعادة تعيين كلمة المرور الخاصة بك ',
        `<p><b>${otp}</b> رمز التحقق المكوَّن من 4 أرقام هو</p>
        </br>
        <p> سينتهي صلاحيته خلال 10 دقائق.</p>`,
      );
      return { message: 'OTP sent to your email address.' };
    } catch (error) {
      console.error('Error sending OTP email:', error);
      // You might want to revert the OTP in DB or inform the user about the email failure
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Failed to send OTP email. Please try again.',
      );
    }
  }
};

// Verify OTP and reset password
const verifyOtpAndResetPassword = async (
  email: string,
  otp: string,
  newPassword: string,
) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || user.otp !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid OTP');
  }

  if (user.otpExpiry && user.otpExpiry < new Date()) {
    throw new AppError(httpStatus.BAD_REQUEST, 'OTP has expired');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
      otp: null,
      otpExpiry: null,
    },
  });

  return { message: 'Password reset successful' };
};

//  start

const requestPasswordReset = async (email: string) => {
  const user = await prisma.user.findFirst({
    where: {
      email,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'No user found with this email ');
  }

  const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP

  const otpExpiry = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes validity

  // আপডেট করার সময় Prisma এ 'where' এ শুধু unique ফিল্ড দিতে হয়, তাই দুইটি দিয়ে OR করা যাবে না।
  // সেজন্য user এর id দিয়ে আপডেট করবো।
  const updateResult = await prisma.user.update({
    where: { id: user.id },
    data: {
      otp,
      otpExpiry,
    },
  });

  const emailSender = new Email(user);
  const sendEmail = await emailSender.sendCustomEmail(
    'رمز إعادة تعيين كلمة المرور الخاصة بك',
      `<p>رمز التحقق المكوَّن من 4 أرقام هو  <b> ${otp}</b>.</p>
        </br>
        <p> سينتهي صلاحيته خلال 10 دقائق.</p>`,
  );
  

  return {
    message: 'OTP sent to email',
    otp: otp,
  };
};

// ---------------------

const verifyOtp = async (email: string, otp: string) => {
  // 1. ইউজার খুঁজে বের করা
  const user: any = await prisma.user.findFirst({
    where: { email },
  });

  if (!user || user.otp !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid or expired OTP');
  }

  // 2. OTP expired কিনা দেখা
  if (user.otpExpiry && user.otpExpiry < new Date()) {
    throw new AppError(httpStatus.BAD_REQUEST, 'OTP has expired');
  }

  // 3. OTP invalidate করা
  await prisma.user.update({
    where: { id: user.id },
    data: {
      otp: null,
      otpExpiry: null,
    },
  });

  // 4. JWT টোকেন তৈরি
  const accessToken = await generateToken(
    {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      userName: user.userName,
      role: user.role,
    },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string,
  );

  // 5. ফাইনাল রেসপন্স
  return {
    message: 'OTP verified successfully',
    token: accessToken,
  };
};

// -------------------------------------

// const resetPassword = async (email: string, newPassword: string,token:string) => {
//   // ইউজার খোঁজা (email বা userName দিয়ে)
//   const user = await prisma.user.findFirst({
//     where: {
//     email
//     },
//   });

//   if (!user) {
//     throw new AppError(httpStatus.NOT_FOUND, 'User not found');
//   }

//   // নতুন পাসওয়ার্ড হ্যাশ করা
//   const hashedPassword = await bcrypt.hash(newPassword, 12);

//   // পাসওয়ার্ড আপডেট + OTP ফিল্ড ক্লিয়ার
//    const updatepassword=   await prisma.user.update({
//     where: { id: user.id },
//     data: {
//       password: hashedPassword,
//       otp: null,
//       otpExpiry: null,
//     },
//   });

//      // 4️⃣ Push Notification (optional)
//   if (updatepassword && user.fcmToken) {
//     await firebasePushNotificationServices.sendSinglePushNotification({
//       body: {
//          title: "Password Updated",
//          body: "Your password has been successfully updated"
//       },
//       fcmToken: user.fcmToken,
//     });
//   }

//   return { message: 'Password reset successful. You can now log in.' };
// };
import jwt, { JwtPayload } from 'jsonwebtoken';
import { formatDate } from '../../utils/formatDate';

const resetPassword = async (
  email: string,
  newPassword: string,
  token: string,
) => {
  // 1️⃣ টোকেন ভেরিফাই করা
  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(
      token,
      config.jwt.access_secret as string,
    ) as JwtPayload;
  } catch (error) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid or expired token');
  }

  // 2️⃣ টোকেনের ভেতরে যে ইমেইল/আইডি আছে সেটা মিলছে কিনা চেক করা
  if (decoded.email !== email) {
    throw new AppError(httpStatus.FORBIDDEN, 'Token does not match the user');
  }

  // 3️⃣ ইউজার খোঁজা
  const user = await prisma.user.findFirst({
    where: { email },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // 4️⃣ নতুন পাসওয়ার্ড হ্যাশ করা
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // 5️⃣ পাসওয়ার্ড আপডেট + OTP ফিল্ড ক্লিয়ার
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      otp: null,
      otpExpiry: null,
    },
  });

  // 6️⃣ Push Notification (optional)
  // if (updatedUser && user.fcmToken) {
  //   await firebasePushNotificationServices.sendSinglePushNotification({
  //     body: {
  //       title: 'Password Updated',
  //       body: 'Your password has been successfully updated',
  //     },
  //     fcmToken: user.fcmToken,
  //   });
  // }

  return { message: 'Password reset successful. You can now log in.' };
};

const deleteUserFromDB = async (userId: string) => {
  // আগে related child data গুলো ডিলিট করো
  await prisma.userProgress.deleteMany({ where: { userId } });
  await prisma.savedQuestion.deleteMany({ where: { userId } });
  await prisma.answer.deleteMany({ where: { userId } });
  await prisma.completeChapter.deleteMany({ where: { userId } });
  await prisma.dailyChallenge.deleteMany({ where: { userId } });
  await prisma.reportQuestion.deleteMany({ where: { userId } });
  await prisma.weekDay.deleteMany({ where: { userId } });
  await prisma.pushNotification.deleteMany({ where: { userId } });
  await prisma.inviteFriend.deleteMany({ where: { userId } });
  await prisma.certificate.deleteMany({ where: { userId } });

  // শেষে user delete করো
  const deletedUser = await prisma.user.delete({
    where: { id: userId },
  });

  return deletedUser;
};


const completeLessonForUser = async (
  userId: string,
  lessonId: string,
  unlock?: boolean,
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  // 1️⃣ Unlock only
  if (unlock) {
    await prisma.userProgress.upsert({
      where: { userId_lessonId_unique: { userId, lessonId } },
      update: { unLocked: true },
      create: { userId, lessonId, unLocked: true, completed: false, score: 0 },
    });
    return { message: '🔓 Lesson unlocked successfully' };
  }

  // 2️⃣ Current lesson + chapter
  const currentLesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      chapter: {
        include: {
          lessons: {
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  });
  if (!currentLesson) throw new Error('Lesson not found');

  const chapterLessons = currentLesson.chapter.lessons;
  const normalLessons = chapterLessons.filter(l => l.type === 'LESSON');
  const checkpointLessons = chapterLessons.filter(
    l => l.type === 'CHECHPOINT' || l.type === 'FINALCHECHPOINT',
  );
  const allLessonsOrdered = [...normalLessons, ...checkpointLessons];

  const currentIndex = allLessonsOrdered.findIndex(l => l.id === lessonId);
  const isFirstLesson = currentIndex === 0;

  // 3️⃣ First lesson unlock
  if (isFirstLesson) {
    const firstLessonProgress = await prisma.userProgress.findUnique({
      where: { userId_lessonId_unique: { userId, lessonId } },
    });

    if (!firstLessonProgress || !firstLessonProgress.unLocked) {
      await prisma.userProgress.upsert({
        where: { userId_lessonId_unique: { userId, lessonId } },
        update: { unLocked: true },
        create: {
          userId,
          lessonId,
          unLocked: true,
          score: 0,
          completed: false,
        },
      });
      return { message: "✅ Chapter's first lesson unlocked" };
    }
  }

  // 4️⃣ Completion & percentage
  let percentage = 100;
  let requiredThreshold = 0;

  if (
    currentLesson.type === 'CHECHPOINT' ||
    currentLesson.type === 'FINALCHECHPOINT'
  ) {
    requiredThreshold = currentLesson.type === 'FINALCHECHPOINT' ? 85 : 75;

    const totalQuestions = await prisma.question.aggregate({
      where: { lessonId },
      _sum: { fixedScore: true },
    });

    const userAnswers = await prisma.answer.findMany({
      where: { userId, question: { lessonId } },
      select: { question: { select: { fixedScore: true } } },
    });

    const totalFixedScore = userAnswers.reduce(
      (sum, ans) => sum + (ans.question?.fixedScore || 0),
      0,
    );

    if (
      !totalQuestions._sum.fixedScore ||
      totalQuestions._sum.fixedScore === 0
    ) {
      return { message: '❌ This lesson has no questions with fixedScore' };
    }

    percentage = (totalFixedScore / totalQuestions._sum.fixedScore) * 100;

    if (percentage < requiredThreshold) {
      // fail notification
      if (user?.daailyGoalNotification && user?.fcmToken) {
        const checkpointFailMessages = [
          'جهد محمود! راجع دروسك السابقة وأعد المحاولة 🌟',
          'لا تقلق، محطة التقييم فرصة للتعلّم أكثر ✨',
          'كل محاولة تقرّبك من الإتقان 💪',
          'لم تتجاوز محطة التقييم هذه المرة، لكنك أقرب من أي وقت مضى 🎯',
          'اجعل اجتياز محطة التقييم هدفك القادم، وستصل بإذن الله 🌟',
        ];
        const randomFailMessage =
          checkpointFailMessages[
            Math.floor(Math.random() * checkpointFailMessages.length)
          ];

        await firebasePushNotificationServices.sendSinglePushNotification({
          // body: { title: 'محطة التقييم', body: randomFailMessage },
          body: { title: "", body: randomFailMessage },
          fcmToken: user.fcmToken,
        });
      }
      return {
        message: `⚠️ Only ${percentage.toFixed(2)}% completed (${requiredThreshold}% required for ${currentLesson.type})`,
      };
    }
  }

  // 5️⃣ Mark current lesson completed
  await prisma.userProgress.upsert({
    where: { userId_lessonId_unique: { userId, lessonId } },
    update: { completed: true, score: { increment: 1 } },
    create: { userId, lessonId, completed: true, score: 1, unLocked: true },
  });

  if (percentage >= requiredThreshold) {
    await prisma.userProgress.update({
      where: { userId_lessonId_unique: { userId, lessonId } },
      data: { completelyWithPercentage: true },
    });
  }

  // 6️⃣ Next lesson in same chapter
  const nextLesson = allLessonsOrdered[currentIndex + 1];
  if (nextLesson) {
    await prisma.userProgress.upsert({
      where: { userId_lessonId_unique: { userId, lessonId: nextLesson.id } },
      update: { unLocked: true },
      create: {
        userId,
        lessonId: nextLesson.id,
        unLocked: true,
        score: 0,
        completed: false,
      },
    });
    return { message: `✅ Lesson completed & 🔓 Next lesson unlocked` };
  }

  // 7️⃣ Check if all lessons in chapter completed
  const allLessonIds = allLessonsOrdered.map(l => l.id);
  const completedLessons = await prisma.userProgress.findMany({
    where: { userId, lessonId: { in: allLessonIds }, completed: true },
    select: { lessonId: true },
  });

  const chapterComplete = completedLessons.length === allLessonIds.length;

  // 8️⃣ Next chapter first lesson unlock ONLY if chapter complete
  // if (chapterComplete) {
  //   const nextChapter = await prisma.chapter.findFirst({
  //     where: { status: "ACTIVE", createdAt: { gt: currentLesson.chapter.createdAt } },
  //     orderBy: { createdAt: "asc" },
  //     include: { lessons: { where: { status: "ACTIVE" }, orderBy: { createdAt: "asc" } } },
  //   });

  //   if (nextChapter && nextChapter.lessons.length > 0) {
  //     const firstLessonNextChapter = nextChapter.lessons[0];
  //     await prisma.userProgress.upsert({
  //       where: { userId_lessonId_unique: { userId, lessonId: firstLessonNextChapter.id } },
  //       update: { unLocked: true },
  //       create: { userId, lessonId: firstLessonNextChapter.id, unLocked: true, score: 0, completed: false },
  //     });
  //   }
  // }

  // 9️⃣ Complete chapter record
  if (chapterComplete) {
    await prisma.completeChapter.upsert({
      where: {
        userId_chapterId: { userId, chapterId: currentLesson.chapterId },
      },
      update: {},
      create: { userId, chapterId: currentLesson.chapterId },
    });
  }

  return {
    message: `✅ Lesson completed${percentage ? ` ${percentage.toFixed(2)}%` : ''}`,
  };
};

// const getAllChaptersForUser = async (userId: string) => {
//   // প্রথমে ইউজার এর blockForWeek ডেটা নিয়ে আসবো
//   const user = await prisma.user.findUnique({
//     where: { id: userId },
//     select: { blockForWeek: true, blockForWeekTime: true },
//   });

//   const chapters: any = await prisma.chapter.findMany({
//     where: { status: "ACTIVE" },
//     orderBy: { createdAt: "asc" },
//     include: {
//       lessons: {
//         where: { status: "ACTIVE" },
//         orderBy: { createdAt: "asc" },
//         include: {
//           Question: {
//             include: {
//               savedBy: { where: { userId }, select: { id: true } },
//               answers: {
//                 where: { userId, isCorrect: true },
//                 select: { id: true },
//               },
//             },
//           },
//           UserProgress: {
//             where: { userId },
//             select: {
//               completed: true,
//               unLocked: true,
//               score: true,
//               completelyWithPercentage: true,
//             },
//           },
//         },
//       },
//     },
//   });

//   // helper → shuffle array
//   function shuffleArray<T>(array: T[]): T[] {
//     return [...array].sort(() => Math.random() - 0.5);
//   }

//   let checkpointCounter = 1; // ✅ checkpoint serial রাখবো

//   const formattedChapters = chapters.map((chapter: any) => {
//     const normalLessons = chapter.lessons.filter(
//       (ls: any) => ls.type !== "CHECHPOINT"
//     );
//     const checkpointLessons = chapter.lessons.filter(
//       (ls: any) => ls.type === "CHECHPOINT"
//     );
//     const sortedLessons = [...normalLessons, ...checkpointLessons];

//     const lessonsData = sortedLessons.map((lesson) => {
//       // 1️⃣ Total fixedScore বের করি
//       const totalScore = lesson.Question.reduce(
//         (sum: number, q: any) => sum + (q.fixedScore || 0),
//         0
//       );

//       // 2️⃣ User এর সঠিক উত্তরগুলোর score যোগ করি
//       const userCorrectScore = lesson.Question.reduce((sum: number, q: any) => {
//         if (q.answers.length > 0) {
//           return sum + (q.fixedScore || 0);
//         }
//         return sum;
//       }, 0);

//       // 3️⃣ percentage হিসাব করি
//       const completedWithPercentage =
//         totalScore > 0 ? Math.round((userCorrectScore / totalScore) * 100) : 0;

//       // 4️⃣ 75% এর বেশি হলে true
//       const completelyWithPercentageStatus =
//         completedWithPercentage >= 75 ? true : false;

//       // ✅ যদি checkpoint হয় (কিন্তু FINALCHECHPOINT না হয়) তবে title overwrite করবো
//       let lessonTitle = lesson.title;
//       if (lesson.type === "CHECHPOINT" && chapter.type !== "FINALCHECHPOINT") {
//         lessonTitle = `Checkpoint ${checkpointCounter}`;
//         checkpointCounter++;
//       }

//       // ✅ শুধু last question answered হলে completed true হবে
//       const lastQuestion = lesson.Question[lesson.Question.length - 1];
//       const lessonCompleted = lastQuestion
//         ? lastQuestion.answers.length > 0
//         : false;

//       return {
//         lessonId: lesson.id,
//         title: lessonTitle, // 👈 updated title
//         order: lesson.order,
//         image: lesson.image,
//         subTitle: lesson.subTitle,
//         type: lesson.type,
//         content: lesson.content,
//         unlocked:
//           lesson.UserProgress.length > 0
//             ? lesson.UserProgress[0].unLocked
//             : false,
//         completed: lessonCompleted, // 👈 updated logic
//         score:
//           lesson.UserProgress.length > 0 ? lesson.UserProgress[0].score : 0,
//         completedWithPercentage,
//         completelyWithPercentageStatus,
//         questions: lesson.Question.map((q: any) => {
//           let formattedOptions = q.options;

//           if (q.type === "MATCH_PAIRS" && Array.isArray(q.answer)) {
//             const leftSide = q.answer.map((item: any) => item.left);
//             const rightSide = shuffleArray(
//               q.answer.map((item: any) => item.right)
//             );
//             formattedOptions = [leftSide, rightSide];
//           }

//           return {
//             id: q.id,
//             type: q.type,
//             title: q.title,
//             document: q.document,
//             documentType: q.documentType,
//             point: q.point,
//             order: q.order,
//             options: formattedOptions,
//             answer: q.answer,
//             suggestion: q.suggestion,
//             fixedScore: q.fixedScore,
//             level: q.level,
//             createdAt: q.createdAt,
//             isSaved: q.savedBy.length > 0,
//             explanation: q.explanation,
//           };
//         }),
//       };
//     });

//     const totalLessons = lessonsData.length;
//     const completedLessons = lessonsData.filter((l) => l.completed).length;

//     return {
//       chapterId: chapter.id,
//       title: chapter.title,
//       level: chapter.level,
//       order: chapter.order,
//       type: chapter.type,
//       lessons: lessonsData,
//       totalLessons,
//       completedLessons,
//     };
//   });

//   // ✅ Final checkpoint সবশেষে পাঠানো
//   const normalChapters = formattedChapters.filter(
//     (ch: any) => ch.type !== "FINALCHECHPOINT"
//   );
//   const finalChapters = formattedChapters.filter(
//     (ch: any) => ch.type === "FINALCHECHPOINT"
//   );
//   const allChapters = [...normalChapters, ...finalChapters];

//   // ✅ Lock & Complete Logic (updated)
//   allChapters.forEach((chapter) => {
//     chapter.chapterLock = false;
//     chapter.chapterComplete = false;
//   });

//   if (allChapters.length > 0) {
//     // ✅ প্রথম চ্যাপ্টার সবসময় আনলক থাকবে
//     allChapters[0].chapterLock = true;

//     for (let i = 0; i < allChapters.length; i++) {
//       const chapter = allChapters[i];

//       // ✅ checkpoint lessons বের করলাম
//       const checkpointLessons = chapter.lessons.filter(
//         (ls: any) => ls.type === "CHECHPOINT"
//       );

//       let allowComplete = true;

//       if (checkpointLessons.length > 0) {
//         checkpointLessons.forEach((cp: any) => {
//           if (cp.completedWithPercentage < 75) {
//             allowComplete = false;
//           }
//         });
//       } else {
//         allowComplete = false;
//       }

//       if (allowComplete) {
//         chapter.chapterComplete = true;

//         // ✅ আগেরটা complete হলে পরেরটা unlock হবে
//         if (i + 1 < allChapters.length) {
//           allChapters[i + 1].chapterLock = true;
//         }
//       }
//     }
//   }

//   // ✅ countdown ক্যালকুলেশন
//   let countdown = null;
//   if (user?.blockForWeek && user.blockForWeekTime) {
//     const endDate = new Date(user.blockForWeekTime);
//     endDate.setDate(endDate.getDate() + 7); // ১ সপ্তাহ পর

//     const now = new Date();
//     const diffMs = endDate.getTime() - now.getTime();

//     if (diffMs > 0) {
//       const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
//       const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
//       const diffMinutes = Math.floor((diffMs / (1000 * 60)) % 60);

//       countdown = `${diffDays}d ${diffHours}h ${diffMinutes}m`;
//     } else {
//       countdown = "expired";
//     }
//   }

//   return allChapters;
// };

const getAllChaptersForUser = async (userId: string) => {
  // প্রথমে ইউজার এর blockForWeek ডেটা নিয়ে আসবো
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { blockForWeek: true, blockForWeekTime: true },
  });

  const chapters: any = await prisma.chapter.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'asc' },
    include: {
      lessons: {
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'asc' },
        include: {
          Question: {
            include: {
              savedBy: { where: { userId }, select: { id: true } },
              answers: {
                where: { userId },
                select: { id: true, isCorrect: true },
              },
            },
          },
          UserProgress: {
            where: { userId },
            select: {
              completed: true,
              unLocked: true,
              score: true,
              completelyWithPercentage: true,
            },
          },
        },
      },
    },
  });

  // helper → shuffle array
  function shuffleArray<T>(array: T[]): T[] {
    return [...array].sort(() => Math.random() - 0.5);
  }

  let checkpointCounter = 1; // ✅ checkpoint serial রাখবো

  const formattedChapters = chapters.map((chapter: any) => {
    const normalLessons = chapter.lessons.filter(
      (ls: any) => ls.type !== 'CHECHPOINT',
    );
    const checkpointLessons = chapter.lessons.filter(
      (ls: any) => ls.type === 'CHECHPOINT',
    );
    const sortedLessons = [...normalLessons, ...checkpointLessons];

    const lessonsData = sortedLessons.map(lesson => {
      // 1️⃣ Total fixedScore বের করি
      const totalScore = lesson.Question.reduce(
        (sum: number, q: any) => sum + (q.fixedScore || 0),
        0,
      );

      // 2️⃣ User এর সঠিক উত্তরগুলোর score যোগ করি
      const userCorrectScore = lesson.Question.reduce((sum: number, q: any) => {
        const hasCorrect = q.answers.some((a: any) => a.isCorrect === true);
        if (hasCorrect) return sum + (q.fixedScore || 0);
        return sum;
      }, 0);

      // 3️⃣ percentage হিসাব করি
      const completedWithPercentage =
        totalScore > 0 ? Math.round((userCorrectScore / totalScore) * 100) : 0;

      // 4️⃣ 75% এর বেশি হলে true
      const completelyWithPercentageStatus =
        completedWithPercentage >= 75 ? true : false;

      // ✅ যদি checkpoint হয় (কিন্তু FINALCHECHPOINT না হয়) তবে title overwrite করবো
      let lessonTitle = lesson.title;
      if (lesson.type === 'CHECHPOINT' && chapter.type !== 'FINALCHECHPOINT') {
        lessonTitle = `Checkpoint ${checkpointCounter}`;
        checkpointCounter++;
      }

      // ✅ সব প্রশ্নের উত্তর দিলে completed true হবে (সঠিক বা ভুল যাই হোক)
      const lessonCompleted =
        lesson.Question.length > 0 &&
        lesson.Question.every((q: any) => q.answers.length > 0);

      return {
        lessonId: lesson.id,
        title: lessonTitle,
        order: lesson.order,
        image: lesson.image,
        subTitle: lesson.subTitle,
        type: lesson.type,
        content: lesson.content,
        unlocked:
          lesson.UserProgress.length > 0
            ? lesson.UserProgress[0].unLocked
            : false,
        completed: lessonCompleted, // 👈 এখন সব প্রশ্নের উত্তর দিলে true হবে
        score:
          lesson.UserProgress.length > 0 ? lesson.UserProgress[0].score : 0,
        completedWithPercentage,
        completelyWithPercentageStatus,
        questions: lesson.Question.map((q: any) => {
          let formattedOptions = q.options;

          if (q.type === 'MATCH_PAIRS' && Array.isArray(q.answer)) {
            const leftSide = q.answer.map((item: any) => item.left);
            const rightSide = shuffleArray(
              q.answer.map((item: any) => item.right),
            );
            formattedOptions = [leftSide, rightSide];
          }

          return {
            id: q.id,
            type: q.type,
            title: q.title,
            document: q.document,
            documentType: q.documentType,
            point: q.point,
            order: q.order,
            options: formattedOptions,
            answer: q.answer,
            suggestion: q.suggestion,
            fixedScore: q.fixedScore,
            level: q.level,
            createdAt: q.createdAt,
            isSaved: q.savedBy.length > 0,
            explanation: q.explanation,
          };
        }),
      };
    });

    const totalLessons = lessonsData.length;
    const completedLessons = lessonsData.filter(l => l.completed).length;

    return {
      chapterId: chapter.id,
      title: chapter.title,
      level: chapter.level,
      order: chapter.order,
      type: chapter.type,
      lessons: lessonsData,
      totalLessons,
      completedLessons,
    };
  });

  // ✅ Final checkpoint সবশেষে পাঠানো
  const normalChapters = formattedChapters.filter(
    (ch: any) => ch.type !== 'FINALCHECHPOINT',
  );
  const finalChapters = formattedChapters.filter(
    (ch: any) => ch.type === 'FINALCHECHPOINT',
  );
  const allChapters = [...normalChapters, ...finalChapters];

  // ✅ Lock & Complete Logic (updated)
  allChapters.forEach(chapter => {
    chapter.chapterLock = false;
    chapter.chapterComplete = false;
  });

  if (allChapters.length > 0) {
    // ✅ প্রথম চ্যাপ্টার সবসময় আনলক থাকবে
    allChapters[0].chapterLock = true;

    for (let i = 0; i < allChapters.length; i++) {
      const chapter = allChapters[i];

      // ✅ checkpoint lessons বের করলাম
      const checkpointLessons = chapter.lessons.filter(
        (ls: any) => ls.type === 'CHECHPOINT',
      );

      let allowComplete = true;

      if (checkpointLessons.length > 0) {
        checkpointLessons.forEach((cp: any) => {
          if (cp.completedWithPercentage < 75) {
            allowComplete = false;
          }
        });
      } else {
        allowComplete = false;
      }

      if (allowComplete) {
        chapter.chapterComplete = true;

        // ✅ আগেরটা complete হলে পরেরটা unlock হবে
        if (i + 1 < allChapters.length) {
          allChapters[i + 1].chapterLock = true;
        }
      }
    }
  }

  // ✅ countdown ক্যালকুলেশন
  let countdown = null;
  if (user?.blockForWeek && user.blockForWeekTime) {
    const endDate = new Date(user.blockForWeekTime);
    endDate.setDate(endDate.getDate() + 7); // ১ সপ্তাহ পর

    const now = new Date();
    const diffMs = endDate.getTime() - now.getTime();

    if (diffMs > 0) {
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
      const diffMinutes = Math.floor((diffMs / (1000 * 60)) % 60);

      countdown = `${diffDays}d ${diffHours}h ${diffMinutes}m`;
    } else {
      countdown = 'expired';
    }
  }

  return allChapters;
};

const myProgressInDB = async (userId: string) => {
  // 1️⃣ সব Question এর মোট point বের করা
  const totalPoints = await prisma.question.aggregate({
    _sum: {
      fixedScore: true,
    },
  });

  // 2️⃣ ইউজারের মোট score বের করা
  const myScore = await prisma.userProgress.aggregate({
    where: { userId },
    _sum: {
      score: true,
    },
  });

  // 3️⃣ ভ্যালু গুলো বের করা (null হলে 0 ধরব)
  const totalPointSum = totalPoints._sum.fixedScore ?? 0;
  const myScoreSum = myScore._sum.score ?? 0;

  let finalScore = myScoreSum;
  let finalPercentage = 0;

  // 4️⃣ Logic: যদি myScore মোট পয়েন্ট এর চেয়ে বেশি বা সমান হয়
  if (myScoreSum >= totalPointSum && totalPointSum > 0) {
    finalScore = totalPointSum; // max totalPoint পর্যন্ত ধরব
    finalPercentage = 100;
  } else {
    finalPercentage =
      totalPointSum > 0 ? (myScoreSum / totalPointSum) * 100 : 0;
  }

  // 5️⃣ Star calculation logic
  let totalStars = 0;



  // 5.1️⃣ Lesson completion stars

 
  const lessonsCompleted = await prisma.userProgress.findMany({
    where: { userId, completed: true },
    include: {
        lesson: {
          include:{Question:{select:{fixedScore:true,id:true}}}
        },
      },
  });

   const filterLisson= lessonsCompleted.filter((a)=>a.lesson.type==="LESSON")




 // 2️⃣ প্রতিটা completed lesson এ loop চালাও
  for (const lessonProgress of filterLisson) {
    const questions = lessonProgress?.lesson?.Question;

    // ওই lesson-এ যদি কোনো question না থাকে, skip করো
    if (questions.length === 0) continue;

    // মোট স্কোর = সব question এর fixedScore যোগফল
    const totalFixedScore = questions.reduce((sum, q) => sum + (q.fixedScore || 0), 0);

    // ওই lesson-এর সব questionId গুলো
    const questionIds = questions.map((q) => q.id);

    // ইউজার যে প্রশ্নগুলোর উত্তর দিয়েছে এবং সঠিক উত্তর দিয়েছে
    const correctAnswers = await prisma.answer.findMany({
      where: {
        userId,
        questionId: { in: questionIds },
        isCorrect: true,
      },
      include: {
        question: {
          select: { fixedScore: true },
        },
      },
    });

    // ইউজারের প্রাপ্ত স্কোর = সঠিক উত্তরগুলোর fixedScore যোগফল
    const userScore = correctAnswers.reduce(
      (sum, ans) => sum + (ans.question?.fixedScore || 0),
      0
    );

    // শতকরা স্কোর হিসাব
    const scorePercent = (userScore / totalFixedScore) * 100;

    // ⭐ স্টার নির্ধারণ
    const stars = scorePercent >= 75 ? 8 : 5;
    totalStars += stars;

 
  }



  



  // 5.3️⃣ Chapter completion stars
const chaptersCompleted = await prisma.completeChapter.findMany({
  where: { userId },
});

const chapterStar = 20; // প্রতি চ্যাপ্টারে ২০ স্টার
totalStars += chaptersCompleted.length * chapterStar;


  // 5.4️⃣ Certificate stars
  const certificate = await prisma.certificate.findFirst({
    where: { userId },
  });
  if (certificate) totalStars += 500;

  // 5.5️⃣ Active 5+ days stars
  const user = await prisma.user.findUnique({ where: { id: userId } });

  totalStars += user?.activeCount || 0;

  // 5.6️⃣ Invite friends stars
  const invites = await prisma.inviteFriend.findMany({ where: { userId } });
  const inviteStar = 100;
  totalStars += invites.length * inviteStar;

  let countDown: string | string = '';
  let unBlockDate: Date | string = '';

  if (user?.blockForWeekTime) {
    // ধরো user এর blockDate আছে (ISO string বা Date আকারে)
    const blockDate = new Date(user.blockForWeekTime);

    // 7 দিন যোগ করে unblock date
    unBlockDate = new Date(blockDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    // এখনকার সময়
    const now = new Date();

    // কত সময় বাকি আছে (ms এ)
    const diff = unBlockDate.getTime() - now.getTime();

    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // countDown = `${days}d ${hours}h ${minutes}m ${seconds}s`;
      countDown = `${days}`;
    } else {
      countDown = 'Already unblocked';
    }
  }
  // await prisma.user.update({
  //   where: { id: userId },
  //   data: {
  //     progressStatus:
  //       Number(finalPercentage.toFixed(0)) === 100 ? 'COMPLETE' : 'PROGRESS',
  //   },
  // });

 

  const totalQuestions = await prisma.question.count({
    where: {
      chapter: {
        status: 'ACTIVE',
      },

      lesson: {
        status: 'ACTIVE',
      },
    },
  });

  const totalAnsweredQuestions = await prisma.question.count({
    where: {
      chapter: {
        status: 'ACTIVE',
      },

      lesson: {
        status: 'ACTIVE',
      },
      answers: {
        some: {
          userId,
        },
      },
    },
  });

  const totalQuestionsCount = totalQuestions ?? 0;
  const totalAnswerCount = totalAnsweredQuestions ?? 0;
  const percentage =
    totalQuestionsCount > 0
      ? (totalAnswerCount / totalQuestionsCount) * 100
      : 0;

  const week = await prisma.weekDay.count({
    where: { userId, status: 'COMPLETE' },
  });

  const lifeTimeBlock=await prisma.certificate.findFirst({
    where:{
      userId
    }
  })



const userStar = await prisma.userStar.findFirst({
  where: { userId },
  select: { star: true },
});

totalStars += userStar?.star ?? 0;



  return {
    totalPoints: totalPointSum,
    myScore: finalScore,
    percentage: Number(percentage.toFixed(0)),
    totalStars,
    week,
    isBlock: user?.blockForWeek,
    countDown: countDown,
    unBlock: unBlockDate,
    isLifeTimeBlock:lifeTimeBlock?true:false,
    notifaction:user?.daailyGoalNotification
  };
};
// 
const createCertificateAutoApproval = async () => {
  const existing = await prisma.adminSetting.findFirst();

  if (!existing) {
    await prisma.adminSetting.create({
      data: {
        certificateAutoApproval: false,
        access: 'Admin', // default unique key
      },
    });
    
  } else {
  }
};

// Get all settings
const getCertificateAutoApproval = async () => {
  const settings = await prisma.adminSetting.findFirst();
  return settings;
};

// Update (fuldate) setting
const updateCertificateAutoApproval = async (payload: boolean) => {
  const setting = await prisma.adminSetting.update({
    where: { access: 'Admin' },
    data: { certificateAutoApproval: payload },
  });

  if (setting.certificateAutoApproval === true) {
    await prisma.certificate.updateMany({ data: { status: 'APPROVE' } });
  }

  return setting;
};

// create today's challenges
// create today's challenges (auto generate if not exist)
const challengeTypes = [{ type: 'EARN_STARS', min: 1, max: 5 }];

const getRandomTarget = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateDailyChallenges = async () => {
  const today = new Date();
  const todayStr = formatDate(today); // YYYY-MM-DD

  // ✅ সব Active ইউজার
  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true },
  });

  for (const user of users) {
    // ✅ আজকের challenge already আছে কিনা চেক
    const hasTodayChallenge = await prisma.dailyChallenge.findFirst({
      where: {
        userId: user.id,
        date: {
          gte: new Date(todayStr + 'T00:00:00.000Z'),
          lt: new Date(todayStr + 'T23:59:59.999Z'),
        },
      },
    });

    if (!hasTodayChallenge) {
      // ✅ আগের challenge delete করা (optional)
      await prisma.dailyChallenge.deleteMany({
        where: { userId: user.id },
      });

      // ✅ 1–5 random challenges
      const challengeCount = Math.floor(Math.random() * 5) + 1;

      // ✅ random challenge select
      const selectedChallenges = challengeTypes
        .sort(() => 0.5 - Math.random())
        .slice(0, challengeCount)
        .map(c => ({
          userId: user.id,
          date: today, // আজকের date
          type: c.type,
          target: getRandomTarget(c.min, c.max),
        }));

      // ✅ bulk insert
      await prisma.dailyChallenge.createMany({
        data: selectedChallenges,
      });
    }
  }

  return { message: '✅ Daily challenges generated successfully!' };
};

// const getTodayChallenges = async (userId: string) => {
//   const today = new Date();
//   today.setHours(0, 0, 0, 0);

//   // 1️⃣ আজকের সব answer fetch করো
//   const todayAnswers = await prisma.answer.findMany({
//     where: {
//       userId,
//       createdAt: { gte: today },
//     },
//     select: { isCorrect: true },
//   });

//   const totalAnswers = todayAnswers.length;
//   const correctAnswers = todayAnswers.filter(a => a.isCorrect).length;
//   const questionProgress =
//     totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;

//   // 2️⃣ আজকের completed lessons বের করো
//   const todayLessons = await prisma.userProgress.findMany({
//     where: {
//       userId,
//       completed: true,
//       updatedAt: { gte: today },
//     },
//     select: {
//       lessonId: true,
//       score: true,
//     },
//   });

//   const totalLessonsCompleted = todayLessons.length;

//   // আজকের মোট lesson কত ছিল (target বের করার জন্য)
//   const allTodayLessons = await prisma.lesson.count({
//     where: { status: "ACTIVE" },
//   });

//   const lessonProgress =
//     allTodayLessons > 0 ? (totalLessonsCompleted / allTodayLessons) * 100 : 0;

//   // 3️⃣ আজকের completed lessons এর মধ্যে কয়টা ≥80%
//   const eightyPercentDone = todayLessons.filter(l => l.score >= 80).length;

//   // progress শুধু completed lessons এর উপর ভিত্তি করে হবে
//   const strongProgress =
//     totalLessonsCompleted > 0
//       ? (eightyPercentDone / totalLessonsCompleted) * 100
//       : 0;

//   // 4️⃣ যদি সব চ্যালেঞ্জ পূর্ণ হয়, updateWeekChallengeAutomactive কল করো
//   const selectedChallenges = await prisma.dailyChallenge.findMany({
//     where: {
//       userId,
//       date: today,
//     },
//   });

//   const allChallengesCompleted = selectedChallenges.every(challenge => {
//     if (challenge.type === 'question') {
//       return questionProgress >= challenge.target;
//     } else if (challenge.type === 'lesson') {
//       return lessonProgress >= challenge.target;
//     } else if (challenge.type === 'strong') {
//       return strongProgress >= challenge.target;
//     }
//     return false;
//   });

//   // if (allChallengesCompleted) {
//   //   // যদি সব চ্যালেঞ্জ পূর্ণ হয়, WeekChallengeService.updateWeekChallengeAutomactive কল করো
//   //   await WeekChallengeService.updateWeekChallengeAutomactive(userId);
//   // }

//   return {
//     questions: {
//       correct: correctAnswers,
//       total: totalAnswers,
//       progress: Number(questionProgress.toFixed(2)),
//     },
//     lessons: {
//       completed: totalLessonsCompleted,
//       total: allTodayLessons,
//       progress: Number(lessonProgress.toFixed(2)),
//     },
//     strongLessons: {
//       correct: correctAnswers,
//       total: totalAnswers,
//       progress: Number(strongProgress.toFixed(2)),
//     },
//   };
// };

// progress update করো

const getTodayChallenges = async (userId: string) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const challenges = await prisma.dailyChallenge.findFirst({
    where: { userId, date: { gte: start, lte: end } },
  });

  if (!challenges)
    return { totalChallenge: 0, completedChallenge: 0, completedPercentage: 0 };

  return {
    totalChallenge: challenges.target,
    completedChallenge: challenges.completedCount,
    completedPercentage: challenges.strongPerformanceCount,
  };
};

const updateChallengeProgress = async (
  userId: string,
  data?: { completed?: boolean; highPerformance?: boolean },
) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // আজকের সব challenges fetch
  const challenges = await prisma.dailyChallenge.findMany({
    where: {
      userId,
      date: { gte: todayStart, lte: todayEnd },
      completed: false, // শুধু অসম্পূর্ণগুলো
    },
  });

  const updatedChallenges = await Promise.all(
    challenges.map(async challenge => {
      let {
        progress,
        completedCount = 0,
        strongPerformanceCount = 0,
        target,
      } = challenge;

      if (data?.completed) {
        completedCount++;
        progress++;
      }

      if (data?.highPerformance) {
        strongPerformanceCount++;
      }

      // target অতিক্রম করবে না
      if (completedCount > target) completedCount = target;
      if (strongPerformanceCount > target) strongPerformanceCount = target;

      const isCompleted =
        completedCount >= target || strongPerformanceCount >= target;

      return prisma.dailyChallenge.update({
        where: { id: challenge.id },
        data: {
          progress,
          completedCount,
          strongPerformanceCount,
          completed: isCompleted,
        },
      });
    }),
  );

  return updatedChallenges;
};

const getChapterAndAnswerCount = async (userId: string) => {
  // ✅ Completed Chapter count
  const completedChaptersCount = await prisma.completeChapter.count({
    where: { userId,
      chapter:{
        type:{not:"FINALCHECHPOINT"}
      }
     },
  });

  const user= await prisma.user.findFirst({
    where:{id:userId}
  })

  // ✅ Answer count
  const totalAnswersCount = await prisma.answer.count({
    where: { userId },
  });


  const  totalChaptterCount=completedChaptersCount
      ? completedChaptersCount 
      : completedChaptersCount
  // ✅ Result return করা

let count=totalChaptterCount
  
  if(
    user?.isFinalCheckPointCompleted===true
  ){
count =totalChaptterCount+1
    
  }

 return {
  completedChaptersCount:count, 
  totalAnswersCount,
};

};

const createInviteFriend = async (input: any) => {
  const invite = await prisma.inviteFriend.create({
    data: {
      userId: input.userId,
    },
  });
  return invite;
};

const blockForWeekTime = async (id: string, payload: string) => {


  const finalcheckPointData= await prisma.lesson.findFirst({
    where:{
      type:"FINALCHECHPOINT"
    },
    select:{
      chapterId:true
    }
  })

 if(finalcheckPointData){
   await prisma.answer.updateMany({
    where:{
      chapterId:finalcheckPointData?.chapterId,
      userId:id
    },
    data:{
      isCorrect:false
    }
  })

 }


  if (payload === 'block') {
    await prisma.user.update({
      where: { id },
      data: {
        blockForWeek: true,
        blockForWeekTime: new Date(),
      },
    });

    return 'Block For a WeekTime successfully';
  }
  if (payload === 'unblock') {
    await prisma.user.update({
      where: { id },
      data: {
        blockForWeek: false,
        blockForWeekTime: '',
      },
    });

    return 'Unblock successfully';
  }
};

const isBlockForWeekTime = async (id: string) => {
  const user = await prisma.user.findFirst({
    where: { id },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // ✅ যদি user block থাকে
  if (user.blockForWeek === true && user.blockForWeekTime) {
    const unblockTime = new Date(user.blockForWeekTime);
    unblockTime.setDate(unblockTime.getDate() + 7); // 1 সপ্তাহ যোগ করা হলো

    const now = new Date();
    const remainingMs = unblockTime.getTime() - now.getTime();
    const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24)); // দিন বাকি

    return {
      isBlock: true,
      message: `🚫 You are blocked until ${unblockTime.toLocaleString()}. ${remainingDays} day(s) remaining.`,
    };
  }

  // ✅ যদি block না থাকে
  return {
    isBlock: false,
    message: '🎉 Welcome to final check point!',
  };
};

export const UserServices = {
  registerUserIntoDB,
  getAllUsersFromDB,
  getMyProfileFromDB,
  getUserDetailsFromDB,
  updateMyProfileIntoDB,
  updateUserFromDB,
  updateUserRoleStatusIntoDB,
  changePassword,
  resendUserVerificationEmail,
  verifyUserEmail,
  sendPasswordResetOtp,
  verifyOtpAndResetPassword,
  requestPasswordReset,
  verifyOtp,
  resetPassword,
  deleteUserFromDB,
  completeLessonForUser,
  getAllChaptersForUser,
  myProgressInDB,
  createCertificateAutoApproval,
  updateCertificateAutoApproval,
  getCertificateAutoApproval,
  generateDailyChallenges,
  getTodayChallenges,
  updateChallengeProgress,
  getAllStudentFromDB,
  getChapterAndAnswerCount,
  createInviteFriend,
  blockForWeekTime,
  isBlockForWeekTime,
};
