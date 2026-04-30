import prisma from '../../utils/prisma';
import { firebasePushNotificationServices } from '../Firebase/firebasePushNotificationServices';
import { WeekChallengeController } from '../WeekChallenge/weekChallenge.controller';

const createLessonIntoDB = async (payload: any) => {
  return await prisma.lesson.create({
    data: payload,
  });
};
// const getAllLessonsFromDB = async () => {
//   return await prisma.lesson.findMany({

//       orderBy: {
//       createdAt: 'asc', // 'asc' মানে oldest chapter আগে আসবে
//     },
//     include: {
//       Question:true,
//       chapter: true, // Lesson এর সাথে Chapter relation include
//     },
//   });
// };
const getAllLessonsFromDB = async () => {
  // প্রথমে সব chapter আনব ordered ভাবে
  const chapters = await prisma.chapter.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      lessons: {
        orderBy: { createdAt: 'asc' },
        include: { Question: true },
      },
    },
  });

  // এখন lessons এর সাথে question এ generatedId যোগ করব
  let lessonsWithQuestions: any[] = [];

  chapters.forEach((chapter, chapterIndex) => {
    chapter.lessons.forEach((lesson, lessonIndex) => {
      const questionsWithId = lesson.Question.map((q, questionIndex) => {
        const generatedId = `C${chapterIndex + 1}L${lessonIndex + 1}Q${String(
          questionIndex + 1,
        ).padStart(2, '0')}`;

        return {
          ...q,
          generatedId,
        };
      });

      lessonsWithQuestions.push({
        ...lesson,
        chapter,
        Question: questionsWithId,
      });
    });
  });

  return lessonsWithQuestions;
};

const getSingleLessonFromDB = async (id: string) => {
  // সব chapter আনব ordered way
  const chapters = await prisma.chapter.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      lessons: {
        orderBy: { createdAt: 'asc' },
        include: { Question: true },
      },
    },
  });

  let foundLesson: any = null;

  chapters.forEach((chapter, chapterIndex) => {
    chapter.lessons.forEach((lesson, lessonIndex) => {
      if (lesson.id === id) {
        // Question এর generatedId assign করা
        const questionsWithId = lesson.Question.map((q, questionIndex) => {
          const generatedId = `C${chapterIndex + 1}L${lessonIndex + 1}Q${String(
            questionIndex + 1,
          ).padStart(2, '0')}`;

          return {
            ...q,
            generatedId,
          };
        });

        foundLesson = {
          ...lesson,
          Question: questionsWithId,
          chapter,
        };
      }
    });
  });

  if (!foundLesson) {
    throw new Error('Lesson not found');
  }

  return foundLesson;
};

const updateLessonInDB = async (id: string, payload: any) => {
  return await prisma.lesson.update({
    where: { id },
    data: payload,
  });
};

const updateLessonStatusInDB = async (
  id: string,
  status: 'ACTIVE' | 'INACTIVE',
) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: { chapter: true },
  });

  if (!lesson) {
    return {
      result: null,
      message: 'Lesson not found!',
    };
  }

  // যদি ACTIVE করতে চাই
  if (status === 'ACTIVE') {
    // Chapter inactive হলে lesson কে active করা যাবে না
    if (lesson.chapter.status !== 'ACTIVE') {
      return {
        result: null,
        message: 'Lesson cannot be activated because its chapter is inactive.',
      };
    }

    // 🔹 Check করতে হবে এই lesson এর under কোনো question আছে কিনা
    const questionCount = await prisma.question.count({
      where: { lessonId: id },
    });

    if (questionCount === 0) {
      return {
        result: null,
        message:
          'Lesson cannot be activated because no question is added under it.',
      };
    }

    const updated = await prisma.lesson.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    return {
      result: updated,
      message: 'Lesson activated successfully.',
    };
  }

  // যদি INACTIVE করতে চাই
  if (status === 'INACTIVE') {
    const updated = await prisma.lesson.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    return {
      result: updated,
      message: 'Lesson deactivated successfully.',
    };
  }

  return {
    result: null,
    message: 'Invalid status provided.',
  };
};

const deleteLessonFromDB = async (id: string) => {
  // ১. ঐ Lesson এর chapterId বের করি
  const lesson = await prisma.lesson.findUnique({
    where: { id },
  });

  if (!lesson) {
    throw new Error('Lesson not found');
  }

  // ৩. সেই প্রশ্নগুলোর Answer মুছে ফেলি
  await prisma.answer.deleteMany({
    where: {
      question: {
        lessonId: lesson.id,
      },
    },
  });

  // ৪. SavedQuestion মুছে ফেলি
  await prisma.savedQuestion.deleteMany({
    where: {
      question: { lessonId: lesson.id },
    },
  });

  // ৭. ঐ Lesson এর userProgress ডিলিট করি
  await prisma.userProgress.deleteMany({
    where: { lessonId: id },
  });

  // ৮. অবশেষে Lesson delete করি
  const deleted = await prisma.lesson.delete({
    where: { id },
  });

  return deleted;
};

// const mycheckPointDtataInDB = async (userId: string, lessonId: string) => {

//   const a=await prisma.answer.findMany({
//     where:{
//       id:lessonId,
//       userId:userId
//     },
//     select:{
//       isCorrect:true,
//       question:{
//         select:{fixedScore:true}
//       }
//     }
//   })

//   // const [totalQuestions, correctAnswerCount] = await Promise.all([
//   //   prisma.question.count({ where: { lessonId } }),
//   //   prisma.answer.count({
//   //     where: { userId, question: { lessonId }, isCorrect: true },
//   //   }),
//   // ]);

//   // const lesson= await prisma.lesson.findFirst({
//   //   where:{id:lessonId}
//   // })

//   // const percentage = totalQuestions
//   //   ? Math.round((correctAnswerCount / totalQuestions) * 100)
//   //   : 0;

//   // const stars = percentage === 100 ? 8 : 5;

//   return {
//     lessonId,
//     totalQuestion: totalQuestions,
//     correctAnswers: correctAnswerCount,
//     percentage,
//      stars: lesson?.type==="LESSON"?stars:20
//   };
// };

const mycheckPointDtataInDB = async (
  userId: string,
  lessonId: string,
  type: any,
) => {
  console.log('checkpoint hit with', { userId, lessonId, type });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fcmToken: true,
      email: true,
      daailyGoalNotification: true,
    },
  });

  // 🔹 সব Answer বের করো
  const answers = await prisma.answer.findMany({
    where: {
      question: {
        lessonId,
      }, // ✅ আগেরটা ভুল ছিল id: lessonId (id না, lessonId হবে)
      userId,
    },
    select: {
      isCorrect: true,
      question: {
        select: { fixedScore: true },
      },
    },
  });

  // 🔹 Total Question সংখ্যা
  const totalQuestions = answers.length;

  // 🔹 মোট স্কোর বের করা
  const totalScore = answers.reduce(
    (sum, ans) => sum + (ans.question?.fixedScore || 0),
    0,
  );

  // 🔹 সঠিক উত্তরগুলো বের করা
  const correctAnswers = answers.filter(ans => ans.isCorrect).length;

  // 🔹 সঠিক উত্তরগুলোর স্কোর বের করা
  const correctScore = answers
    .filter(ans => ans.isCorrect)
    .reduce((sum, ans) => sum + (ans.question?.fixedScore || 0), 0);

  // 🔹 শতকরা হিসাব
  const percentage = totalScore
    ? Math.round((correctScore / totalScore) * 100)
    : 0;

  // 🔹 Lesson টাইপ বের করা (যদি দরকার হয়)
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId },
  });

  // 🔹 স্টার নির্ধারণ করা
  const stars = percentage === 100 ? 8 : 5;

  const allChapter = await prisma.chapter.findMany({
    where: {
      type: 'CHAPTER',
    },
    include: {
      lessons: true,
    },
    orderBy: {
      createdAt: 'asc', // বা যেভাবে চ্যাপ্টার সিকোয়েন্স ঠিক আছে
    },
  });

  // শেষ চ্যাপ্টার
  const lastChapter = allChapter[allChapter.length - 1];

  // শেষ চ্যাপ্টারের CHECKPOINT type লেসন
  const checkpointLesson = lastChapter.lessons.find(
    lesson => lesson.type === 'CHECHPOINT',
  );

  // ID বের করা
  const checkpointLessonId = checkpointLesson ? checkpointLesson.id : null;

  if (checkpointLessonId === lessonId) {
    const allChaptersFinishedNotifications = [
      `ما شاء الله! أنهيت 5 فصول — حان وقت الاختبار لتحصد ثمرة جهدك. 🏅`,
      `لقد وصلت إلى مرحلة متقدمة — ادخل الاختبار وأثبت إتقانك. 🌟`,
      `أنهيت 5 فصول — اجتز الاختبار ونل شهادة لمسيرتك المباركة. 📜`,
      `لا تتوقف هنا! الاختبار هو بوابتك لشهادة الإتقان. 🚀`,
      `تعبك لن يضيع — اجتز الاختبار ونل شهادة التميز. 🎓`,
    ];

    // Random notification pick
    const randomNotification =
      allChaptersFinishedNotifications[
        Math.floor(Math.random() * allChaptersFinishedNotifications.length)
      ];

    if (!type) {
      try {
        // ইউজারের ডেটা নিয়ে আসা

        if (user?.daailyGoalNotification === true && user.fcmToken) {
          await firebasePushNotificationServices.sendSinglePushNotification({
            // body: {
            //   title: "اكتمل كل الفصل",
            //   body: randomNotification,
            // },
            body: {
              title: 'إنجازٌ كبير🎯',
              body: randomNotification,
            },
            fcmToken: user.fcmToken,
          });
        } else {
        }
      } catch (err) {
        console.error(
          `❌ Error sending final checkpoint notification to user ${userId}:`,
          err,
        );
      }
    }
  }

  const CheckpointPassed = [
    `تقدُّم رائع في محطة التقييم 🌟 زادك الله رفعةً وهمةً🎉`,
    `ما شاء الله عليك، إنجاز جديد يُضاف لرصيدك 🌟`,
    `اجتزت محطة التقييم! استمر نحو القمة 🚀`,
    `ما شاء الله، كل محطة تقرّبك أكثر من التميز 🌟`,
    `الحمد لله! لقد اجتزت محطة التقييم بنجاح 🏅`,
  ];

  const CheckpointFailed = [
    `جهد محمود! راجع دروسك السابقة وأعد المحاولة 🌟`,
    `لا تقلق، محطة التقييم فرصة للتعلّم أكثر ✨`,
    `كل محاولة تقرّبك من الإتقان 💪`,
    `لم تتجاوز محطة التقييم هذه المرة، لكنك أقرب من أي وقت مضى 🎯`,
    `اجعل اجتياز محطة التقييم هدفك القادم، وستصل بإذن الله 🌟`,
  ];

  // 🔹 percentage অনুযায়ী notification পাঠানো
  if (!type) {
    if (user?.fcmToken && percentage >= 75 && lesson?.type === 'CHECHPOINT') {
      // ✅ Pass notification
      const randomMsg =
        CheckpointPassed[Math.floor(Math.random() * CheckpointPassed.length)];

      if (user.daailyGoalNotification === true) {
        await firebasePushNotificationServices.sendSinglePushNotification({
          // body: { title: "محطة التقييم ✅", body: randomMsg },
          body: { title: 'محطّة التقييم🎯', body: randomMsg },
          fcmToken: user?.fcmToken,
        });
      }
    }
  }

  if (!type) {
    if (user?.fcmToken && percentage < 75 && lesson?.type === 'CHECHPOINT') {
      // ❌ Fail notification
      const randomMsg =
        CheckpointFailed[Math.floor(Math.random() * CheckpointFailed.length)];
      if (user.daailyGoalNotification === true) {
        await firebasePushNotificationServices.sendSinglePushNotification({
          // body: { title: "محطة التقييم ", body: randomMsg },
          body: { title: 'محطّة التقييم 🔄', body: randomMsg },
          fcmToken: user?.fcmToken,
        });
      }
    }
  }
  console.log('Returning', {
    lessonId,
    totalQuestion: totalQuestions,
    correctAnswers,
    percentage,
    stars: lesson?.type === 'LESSON' ? stars : 20,
  });
  return {
    lessonId,
    totalQuestion: totalQuestions,
    correctAnswers,
    percentage,
    stars: lesson?.type === 'LESSON' ? stars : 20,
  };
};

const finalcheckPointDtataInDB = async (userId: string) => {
  // 1️⃣ সব question এর মোট মার্ক
  const totalMark = await prisma.question.aggregate({
    _sum: { fixedScore: true },
  });

  // 2️⃣ user এর সব correct answer (সব question এর মধ্যে)
  const correctAnswers = await prisma.answer.findMany({
    where: {
      userId,
      isCorrect: true,
    },
    include: {
      question: { select: { fixedScore: true } },
    },
  });

  // 3️⃣ correct count
  const correctCount = correctAnswers.length;

  // 4️⃣ user এর মোট পাওয়া score
  const myScore = correctAnswers.reduce((sum, ans) => {
    return sum + (ans.question?.fixedScore ?? 0);
  }, 0);

  // 5️⃣ মোট possible point
  const totalPoints = totalMark._sum.fixedScore ?? 0;

  // 6️⃣ percentage হিসাব
  const percentage = totalPoints > 0 ? (myScore / totalPoints) * 100 : 0;

  // 7️⃣ star হিসাব (প্রতি 10% = 1 star)
  const stars = Math.floor(percentage / 10);

  return {
    totalPoints,
    myScore,
    correctAnswers: correctCount,
    percentage: Number(percentage.toFixed(0)),
    stars: stars,
  };
};

export const getLessonCorrectPercentage = async (
  userId: string,
  lessonId: string,
): Promise<number> => {
  // ওই lesson-এর সব question সংখ্যা
  const questionsCount = await prisma.question.count({
    where: { lessonId },
  });

  if (questionsCount === 0) return 0;

  // ওই user-এর correct answer সংখ্যা
  const correctAnswersCount = await prisma.answer.count({
    where: {
      userId,
      isCorrect: true,
      question: { lessonId },
    },
  });

  // ✅ correct answer percentage হিসাব
  const correctPercentage = Math.round(
    (correctAnswersCount / questionsCount) * 100,
  );

  return correctPercentage || 0;
};

export const LessonServices = {
  createLessonIntoDB,
  getAllLessonsFromDB,
  getSingleLessonFromDB,
  updateLessonInDB,
  deleteLessonFromDB,
  mycheckPointDtataInDB,
  updateLessonStatusInDB,
  finalcheckPointDtataInDB,
};
//
