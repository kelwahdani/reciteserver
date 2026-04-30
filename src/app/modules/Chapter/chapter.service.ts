import prisma from '../../utils/prisma';

const createChapterIntoDB = async (payload: any) => {
  // 1️⃣ Chapter create করো
  const chapter = await prisma.chapter.create({
    data: payload,
  });

  // 2️⃣ ওই Chapter এ আগে থেকে checkpoint lesson আছে কিনা চেক করো
  const existingCheckpoint = await prisma.lesson.findFirst({
    where: {
      chapterId: chapter.id,
      type: "CHECHPOINT",
      title: "Checkpoint", // আমরা ধরছি নামটা fixed থাকবে
    },
  });

  // 3️⃣ যদি না থাকে, তাহলে নতুন করে create করো
  if (!existingCheckpoint) {
    await prisma.lesson.create({
      data: {
        chapterId: chapter.id,
        title: "Checkpoint",
        type: "CHECHPOINT",
        content: "This is an auto-generated checkpoint lesson.",
        level: chapter.level,
        status: "ACTIVE",
        image: "", // চাইলে default image দিতে পারো
        order: null,
      },
    });
  }

  return chapter;
};


const createFinalCheckpointChapter = async () => {
  // 1️⃣ আগে check করো এই Chapter already আছে কিনা
  const existing = await prisma.chapter.findFirst({
    where: {
      title: "شهادة المستوى الأول",
      type: "FINALCHECHPOINT",
    },
    include: {
      lessons: true,
    },
  });

  // 2️⃣ যদি থাকে → skip করে return করো
  if (existing) {

    return existing;
  }

  // 3️⃣ না থাকলে নতুন chapter create করো
  const chapter = await prisma.chapter.create({
    data: {
      title: "شهادة المستوى الأول",
      type: "FINALCHECHPOINT",
      image: "https://nyc3.digitaloceanspaces.com/smtech-space/files/0fe2a5d6-7136-4b2e-8ed4-b38dc327ddf1.png",
      status: "ACTIVE",
      lessons: {
        create: {
          title: "Final Checkpoint Lesson",
          type: "FINALCHECHPOINT",
          content: "This is the final checkpoint lesson.",
          status: "ACTIVE",
          image: "",
        },
      },
    },
    include: {
      lessons: true,
    },
  });

  
  return chapter;
};


// const getAllChaptersFromDB = async () => {
//   const chapters = await prisma.chapter.findMany({
//     orderBy: {
//       createdAt: 'asc', // পুরোনো chapter আগে
//     },
//     include: {
//       lessons: {
//         orderBy: {
//           createdAt: 'asc', // Lesson order createdAt অনুসারে
//         },
//         include:{Question:true}
//       },
//     },
//   });

//   // প্রতিটা chapter এর lesson সাজানো: checkpoint সব শেষে
//   const formattedChapters = chapters.map(chapter => {
//     const normalLessons = chapter.lessons.filter(ls => ls.type !== 'CHECHPOINT');
//     const checkpointLessons = chapter.lessons.filter(ls => ls.type === 'CHECHPOINT');

//     return {
//       ...chapter,
//       lessons: [...normalLessons, ...checkpointLessons], // checkpoint সবশেষে
//     };
//   });

//   // Chapter লিস্ট সাজানো: সব normal chapter আগে, Final Checkpoint chapter শেষে
//   const normalChapters = formattedChapters.filter(ch => ch.type !== 'FINALCHECHPOINT');
//   const finalChapters = formattedChapters.filter(ch => ch.type === 'FINALCHECHPOINT');

//   return [...normalChapters, ...finalChapters];
// };
const getAllChaptersFromDB = async () => {
  const chapters = await prisma.chapter.findMany({
    orderBy: {
      createdAt: 'asc', // পুরোনো chapter আগে
    },
    include: {
      lessons: {
        orderBy: {
          createdAt: 'asc', // Lesson order createdAt অনুসারে
        },
        include: { Question: true },
      },
    },
  });

  // প্রতিটা chapter এর lesson সাজানো: checkpoint সব শেষে
  const formattedChapters = chapters.map((chapter, chapterIndex) => {
    const normalLessons = chapter.lessons.filter(ls => ls.type !== 'CHECHPOINT');
    const checkpointLessons = chapter.lessons.filter(ls => ls.type === 'CHECHPOINT');

    // lesson সাজানো হয়ে গেল
    const orderedLessons = [...normalLessons, ...checkpointLessons];

    // এখন প্রতিটা lesson এর question এ generatedId যোগ করা হবে
    const lessonsWithQuestions = orderedLessons.map((lesson, lessonIndex) => {
      const questionsWithId = lesson.Question.map((q, questionIndex) => {
        const generatedId = `C${chapterIndex + 1}L${lessonIndex + 1}Q${String(
          questionIndex + 1
        ).padStart(2, "0")}`; // Q01, Q02 এরকম

        return {
          ...q,
          generatedId,
        };
      });

      return {
        ...lesson,
        Question: questionsWithId,
      };
    });

    return {
      ...chapter,
      lessons: lessonsWithQuestions,
    };
  });

  // Chapter লিস্ট সাজানো: সব normal chapter আগে, Final Checkpoint chapter শেষে
  const normalChapters = formattedChapters.filter(ch => ch.type !== 'FINALCHECHPOINT');
  const finalChapters = formattedChapters.filter(ch => ch.type === 'FINALCHECHPOINT');

  return [...normalChapters, ...finalChapters];
};



const completedChapterFromDB = async (userId: string) => {
  // 1️⃣ সব chapter এর সংখ্যা
  const totalChapters = await prisma.chapter.count();

  // 2️⃣ User কতগুলো chapter complete করেছে
  const completedChaptersCount = await prisma.completeChapter.count({
    where: { userId },
  });

  // 3️⃣ Completed chapter list (optional, যদি detail দরকার)
  const completedChapters = await prisma.completeChapter.findMany({
    where: { userId },
    include: { chapter: true }, // chapter info নিতে চাইলে
  });

  // 4️⃣ Progress percentage
  const progressPercent = totalChapters === 0 ? 0 : Math.round((completedChaptersCount / totalChapters) * 100);

  return {
    totalChapters,
    completedChaptersCount,
    completedChapters,
    progressPercent, // ✅ 0 - 100%
  };
};

const getSingleChapterFromDB = async (id: string) => {
  // সব chapter ordered way fetch
  const chapters = await prisma.chapter.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      lessons: { 
        orderBy: { createdAt: "asc" },
        include: { Question: true },
      },
    },
  });

  let foundChapter: any = null;

  chapters.forEach((chapter, chapterIndex) => {
    if (chapter.id === id) {
      // প্রতিটা lesson এর question এ generatedId assign
      const lessonsWithQuestions = chapter.lessons.map((lesson, lessonIndex) => {
        const questionsWithId = lesson.Question.map((q, questionIndex) => {
          const generatedId = `C${chapterIndex + 1}L${lessonIndex + 1}Q${String(
            questionIndex + 1
          ).padStart(2, "0")}`;
          return { ...q, generatedId };
        });

        return { ...lesson, Question: questionsWithId };
      });

      foundChapter = {
        ...chapter,
        lessons: lessonsWithQuestions,
        _count: {
          Question: chapter.lessons.reduce((sum, l) => sum + l.Question.length, 0),
        },
      };
    }
  });

  if (!foundChapter) {
    throw new Error("Chapter not found");
  }

  return foundChapter;
};


const updateChapterInDB = async (id: string, payload: any) => {
  return await prisma.chapter.update({
    where: { id },
    data: payload,
  });
};

const updateChapterStatusInDB = async (id: string, status: "ACTIVE" | "INACTIVE") => {
  // Chapter + lessons বের করো
  const chapter = await prisma.chapter.findFirst({
    where: { id },
    include: { lessons: true },
  });

  if (!chapter) {
    return {
      result: null,
      message: "Chapter not found!",
    };
  }

  // 1️⃣ যদি ACTIVE করতে চাই
  if (status === "ACTIVE") {
    // 🔹 Check: chapter এর under এ অন্তত ১টা lesson থাকতে হবে যেটার type = LESSON
    const lessonCount = await prisma.lesson.count({
      where: {
        chapterId: id,
        type: "LESSON",
      },
    });

    if (lessonCount === 0) {
      return {
        result: null,
        message: "First add a lesson  under this chapter.",
      };
    }

    const updated = await prisma.chapter.update({
      where: { id },
      data: { status: "ACTIVE" },
    });

    return {
      result: updated,
      message: "Chapter activated successfully.",
    };
  }

  // 2️⃣ যদি INACTIVE করতে চাই
  if (status === "INACTIVE") {
    const updatedChapter = await prisma.chapter.update({
      where: { id },
      data: { status: "INACTIVE" },
    });

    // সব lesson inactive করে দাও
    await prisma.lesson.updateMany({
      where: { chapterId: id },
      data: { status: "INACTIVE" },
    });

    return {
      result: updatedChapter,
      message: "Chapter and all lessons deactivated successfully.",
    };
  }

  // Default fallback
  return {
    result: null,
    message: "Invalid status provided.",
  };
};


const deleteChapterFromDB = async (id: string) => {
  // 1. Chapter এর related Lessons বের করুন
  const lessons = await prisma.lesson.findMany({
    where: { chapterId: id },
    select: { id: true },
  });
  const lessonIds = lessons.map(lesson => lesson.id);

  // 2. Chapter এর related Questions বের করুন (chapterId দিয়ে)
  const questions = await prisma.question.findMany({
    where: { chapterId: id },
    select: { id: true },
  });
  const questionIds = questions.map(q => q.id);

  // 3. Answer গুলো ডিলেট করুন Question গুলোর সাথে linked
  await prisma.answer.deleteMany({
    where: { questionId: { in: questionIds } },
  });

  // 4. SavedQuestion গুলো ডিলেট করুন
  await prisma.savedQuestion.deleteMany({
    where: { questionId: { in: questionIds } },
  });

  // 5. Question গুলো ডিলেট করুন
  await prisma.question.deleteMany({
    where: { chapterId: id },
  });

  // 6. UserProgress গুলো ডিলেট করুন Lessons এর জন্য
  await prisma.userProgress.deleteMany({
    where: { lessonId: { in: lessonIds } },
  });

  // 7. Lessons ডিলেট করুন
  await prisma.lesson.deleteMany({
    where: { chapterId: id },
  });

  // 8. Chapter ডিলেট করুন
  const deletedChapter = await prisma.chapter.delete({
    where: { id },
  });

  return deletedChapter;
};



const mycheckPointDtataInDB = async (userId: string, lessonId: string) => {
  // 1️⃣ ওই chapter এর সব question এর মোট মার্ক বের করা

 const lesson=await prisma.lesson.findFirst({
  where:{
    id:lessonId
  },
  select:{chapterId:true}
 })


  const totalMark = await prisma.question.aggregate({
    where: {
      chapterId: lesson?.chapterId,
    },
    _sum: {
      fixedScore: true,
    },
  });

  // 2️⃣ ইউজার ওই chapter এ কতগুলো সঠিক উত্তর দিয়েছে + score
  const correctAnswers = await prisma.answer.findMany({
    where: {
      userId,
      chapterId:lesson?.chapterId,
      isCorrect: true,
    },
    include: {
      question: { select: { fixedScore: true } },
    },
  });

  // 3️⃣ শুধু count বের করা
  const correctCount = await prisma.answer.count({
    where: {
      userId,
      chapterId:lesson?.chapterId,
      isCorrect: true,
    },
  });

  // 4️⃣ ইউজারের পাওয়া মোট score (fixedScore গুলো যোগ করা)
  const myScore = correctAnswers.reduce((sum, ans) => {
    return sum + (ans.question?.fixedScore ?? 0);
  }, 0);

  // 5️⃣ মোট possible point
  const totalPoints = totalMark._sum.fixedScore ?? 0;

  // 6️⃣ percentage বের করা
  const percentage = totalPoints > 0 ? (myScore / totalPoints) * 100 : 0;

  // 7️⃣ স্টার ক্যালকুলেশন (ধরি প্রতি 10% = 1 star)
  // const stars = Math.floor(percentage / 10);

  return {
    totalPoints,
    myScore,
    correctAnswers: correctCount,
    percentage: Number(percentage.toFixed(0)),
    stars:20,
  };
};

export const ChapterServices = {
  createChapterIntoDB,
  getAllChaptersFromDB,
  getSingleChapterFromDB,
  updateChapterInDB,
  deleteChapterFromDB,
  completedChapterFromDB,
  mycheckPointDtataInDB,
  createFinalCheckpointChapter,
  updateChapterStatusInDB
};
