import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import prisma from '../../utils/prisma';
import Email from '../../utils/sendMail';
import QueryBuilder2 from '../../builder/QueryBuilder2';
import { formatDateTimeArabic } from '../../utils/formatDateAndTime';

const createQuestionIntoDB = async (payload: any) => {
  return await prisma.question.create({
    data: {
      ...payload,
      options: payload.options || [], // Json[] save
    },
    include: {
      answers: true,
    },
  });
};



const createMultipleQuestiontoDB = async (payload: any[]) => {
  return await prisma.question.createMany({
    data: payload, // এখানে payload হবে array of objects
  });
};


// const createMultipleFinalQuestiontoDB = async (payload: any[]) => {



//   const finalCheckpoint= await prisma.chapter.findFirst({

//     where:{type:"FINALCHECHPOINT"},
//     select:{
// id:true,lessons:{select:{id:true}}
//     }
//   })


//    const questions:any=await prisma.question.findMany({



//     where:{id:{in:payload}}
//    })


   
  

// questions.forEach((a:any)=>
//   {
//      a.chapterId=finalCheckpoint?.id
//      a.lessonId=finalCheckpoint?.lessons[0].id
//      delete a.id

//    return




//    })


//   return await prisma.question.createMany({
//     data: questions,
//   });



// };



const createMultipleFinalQuestiontoDB = async (payload: any[]) => {



  const finalCheckpoint= await prisma.chapter.findFirst({

    where:{type:"FINALCHECHPOINT"},
    select:{
id:true,lessons:{select:{id:true}}
    }
  })


  const questions = await prisma.question.findMany({
  where: {
    id: { in: payload },
  },
});

// 🔹 payload এর index অনুযায়ী সাজানো
const orderedQuestions:any = payload.map(id => questions.find(q => q.id === id)).filter(Boolean);

   
  

orderedQuestions.forEach((a:any)=>
  {
     a.chapterId=finalCheckpoint?.id
     a.lessonId=finalCheckpoint?.lessons[0].id
     delete a.id

   return




   })


  // return await prisma.question.createMany({
  //   data: orderedQuestions,
  // });



    const createdQuestions: any[] = [];

  // 🔹 একটার পর একটা question তৈরি করা
  for (const q of orderedQuestions) {
    const newQuestion = await prisma.question.create({
      data:q
    });

    createdQuestions.push(newQuestion);
  }

  return createdQuestions;

};





//   const { chapterId, lessonId, type, search } = params;

//   // Check if search is a generatedId like C1L2Q03
//   const isGeneratedId = search ? /^C\d+L\d+Q\d+$/.test(search) : false;

//   // Case 1: যদি generatedId search হয় → full traversal
//   if (isGeneratedId) {
//     const chapters = await prisma.chapter.findMany({
//       orderBy: { createdAt: "asc" },
//       include: {
//         lessons: {
//           orderBy: { createdAt: "asc" },
//           include: { Question: { orderBy: { createdAt: "asc" } } },
//         },
//       },
//     });

//     const questions: any[] = [];

//     chapters.forEach((chapter, chapterIndex) => {
//       chapter.lessons.forEach((lesson, lessonIndex) => {
//         lesson.Question.forEach((q, questionIndex) => {
//           const generatedId = `C${chapterIndex + 1}L${lessonIndex + 1}Q${String(
//             questionIndex + 1
//           ).padStart(2, "0")}`;

//           if (generatedId === search) {
//             questions.push({ ...q, generatedId });
//           }
//         });
//       });
//     });

//     return questions;
//   }

//   // Case 2: যদি lessonId দেওয়া থাকে → শুধু ওই lesson-এর questions
//   if (lessonId) {
//     const lesson = await prisma.lesson.findUnique({
//       where: { id: lessonId },
//       include: {
//         Question: { orderBy: { createdAt: "asc" } },
//       },
//     });

//     if (!lesson) return [];

//     return lesson.Question.filter((q) => {
//       if (type && q.type !== type) return false;
//       if (search && !q.title.toLowerCase().includes(search.toLowerCase()))
//         return false;
//       return true;
//     }).map((q, index) => ({
//       ...q,
//       generatedId: `L${lessonId}Q${String(index + 1).padStart(2, "0")}`,
//     }));
//   }

//   // Case 3: শুধু chapterId দেওয়া আছে → ওই chapter + তার সব lesson + question
//   if (chapterId) {
//     const chapter = await prisma.chapter.findUnique({
//       where: { id: chapterId },
//       include: {
//         lessons: {
//           orderBy: { createdAt: "asc" },
//           include: { Question: { orderBy: { createdAt: "asc" } } },
//         },
//       },
//     });

//     if (!chapter) return [];

//     const questions: any[] = [];

//     chapter.lessons.forEach((lesson, lessonIndex) => {
//       lesson.Question.forEach((q, questionIndex) => {
//         if (type && q.type !== type) return;
//         if (search && !q.title.toLowerCase().includes(search.toLowerCase()))
//           return;

//         const generatedId = `C1L${lessonIndex + 1}Q${String(
//           questionIndex + 1
//         ).padStart(2, "0")}`;
//         questions.push({ ...q, generatedId });
//       });
//     });

//     return questions;
//   }

//   // Case 4: কোন filter নাই → সব question আনবে (ভারি dataset হতে পারে)
//   const chapters = await prisma.chapter.findMany({
//     orderBy: { createdAt: "asc" },
//     include: {
//       lessons: {
//         orderBy: { createdAt: "asc" },
//         include: { Question: { orderBy: { createdAt: "asc" } } },
//       },
//     },
//   });

//   const questions: any[] = [];

//   chapters.forEach((chapter, chapterIndex) => {
//     chapter.lessons.forEach((lesson, lessonIndex) => {
//       lesson.Question.forEach((q, questionIndex) => {
//         if (type && q.type !== type) return;
//         if (search && !q.title.toLowerCase().includes(search.toLowerCase()))
//           return;

//         const generatedId = `C${chapterIndex + 1}L${lessonIndex + 1}Q${String(
//           questionIndex + 1
//         ).padStart(2, "0")}`;
//         questions.push({ ...q, generatedId });
//       });
//     });
//   });

//   return questions;
// };
interface FilterParams {
  chapterId?: string;
  lessonId?: string;
  type?: string;
  search?: string; // title বা generatedId
  page?: number;
  limit?: number;
}


// const getFilteredQuestions = async (params: FilterParams) => {
//   const { chapterId, lessonId, type, search, page = 1, limit = 10 } = params;

//   let questions: any[] = [];

//   // 1️⃣ Step 1: সব question load করা
//   const chapters = await prisma.chapter.findMany({
//     orderBy: { createdAt: "asc" },
//     include: {
//       lessons: {
//         orderBy: { createdAt: "asc" },
//         include: { Question: { orderBy: { createdAt: "asc" } } },
//       },
//     },
//   });

// // 2️⃣ Step 2: সব question এ generatedId assign করা

// chapters.forEach((chapter, chapterIndex) => {
//   // ✅ LESSON গুলো আগে
//   const lessonLessons = chapter.lessons.filter(
//     (lesson) => lesson.type === "LESSON"
//   );

//   lessonLessons.forEach((lesson, lessonIndex) => {
//     lesson.Question.forEach((q, questionIndex) => {
//       const generatedId = `C${chapterIndex + 1}L${lessonIndex + 1}Q${String(
//         questionIndex + 1
//       ).padStart(2, "0")}`;

//       questions.push({
//         ...q,
//         generatedId,
//         chapterId: chapter.id,
//         lessonId: lesson.id,
//         lesson:{
//             title:lesson?.title,
//              },
    
//         chapter:{
//             title:chapter?.title
//              }
    
       
//       });
//     });
//   });

//   // ✅ Checkpoint গুলো পরে
//   const checkpointLessons = chapter.lessons.filter(
//     (lesson) => lesson.type === "CHECHPOINT" || lesson.type === "FINALCHECHPOINT"
//   );

//   checkpointLessons.forEach((lesson, checkpointIndex) => {
//     lesson.Question.forEach((q, questionIndex) => {
//       // আলাদা naming
//       let prefix = "CHK"; // default checkpoint
//       if (lesson.type === "FINALCHECHPOINT") {
//         prefix = "FCHK"; // final checkpoint হলে
//       }

//       const generatedId = `C${chapterIndex + 1}${prefix}${String(
//         questionIndex + 1
//       ).padStart(2, "0")}`;

//       questions.push({
//         ...q,
//         generatedId,
//         chapterId: chapter.id,
//         lessonId: lesson.id,
//       });
//     });
//   });
// });

//   // 3️⃣ Step 3: Filter by lessonId / chapterId
//   if (lessonId) {
//     questions = questions.filter((q) => q.lessonId === lessonId);
//   } else if (chapterId) {
//     questions = questions.filter((q) => q.chapterId === chapterId);
//   }

//   // 4️⃣ Step 4: Filter by type
//   if (type) {
//     questions = questions.filter((q) => q.type === type);
//   }

//   // 5️⃣ Step 5: Search
//   if (search) {
//     questions = questions.filter(
//       (q) =>
//         q.title.toLowerCase().includes(search.toLowerCase()) ||
//         q.generatedId.toLowerCase() === search.toLowerCase()
//     );
//   }

//   // 6️⃣ Step 6: Pagination
//   const total = questions.length;
//   const start = (page - 1) * limit;
//   const end = start + limit;
//   const paginated = questions.slice(start, end);

//   return {
//     meta: {
//       total,
//       page,
//       limit,
//       totalPages: Math.ceil(total / limit),
//     },
//     data: paginated,
//   };
// };





// const getFilteredQuestions = async (params: FilterParams) => {
//   const { chapterId, lessonId, type, search, page = 1, limit = 10 } = params;

//   let questions: any[] = [];

//   // 1️⃣ সব chapter লোড
//   const chapters = await prisma.chapter.findMany({
//     orderBy: { createdAt: "asc" },
//     include: {
//       lessons: {
//         orderBy: { createdAt: "asc" },
//         include: { Question: { orderBy: { createdAt: "asc" } } },
//       },
//     },
//   });

//   // 🔀 Chapter গুলো আলাদা করলাম
//   const normalChapters = chapters.filter((c) => c.type !== "FINALCHECHPOINT");
//   const finalChapters = chapters.filter((c) => c.type === "FINALCHECHPOINT");

//   // সবসময় Final Chapter শেষে
//   const orderedChapters = [...normalChapters, ...finalChapters];

//   // 2️⃣ Generate ID
//   orderedChapters.forEach((chapter, chapterIndex) => {
//     let lessonCounter = 0; // শুধুমাত্র LESSON গুনবে

//     // 👉 (i) LESSON গুলো আগে
//     const lessonLessons = chapter.lessons.filter(
//       (lesson) => lesson.type === "LESSON"
//     );

//     lessonLessons.forEach((lesson) => {
//       lessonCounter++;
//       lesson.Question.forEach((q, questionIndex) => {
//         const generatedId = `C${chapterIndex + 1}L${lessonCounter}Q${String(
//           questionIndex + 1
//         ).padStart(2, "0")}`;

//         questions.push({
//           ...q,
//           generatedId,
//           chapterId: chapter.id,
//           lessonId: lesson.id,
//           lesson: { title: lesson.title },
//           chapter: { title: chapter.title },
//         });
//       });
//     });

//     // 👉 (ii) CHECKPOINT গুলো
//     const checkpointLessons = chapter.lessons.filter(
//       (lesson) => lesson.type === "CHECHPOINT"
//     );

//     checkpointLessons.forEach((lesson) => {
//       lesson.Question.forEach((q, questionIndex) => {
//         const generatedId = `C${chapterIndex + 1}CHK${String(
//           questionIndex + 1
//         ).padStart(2, "0")}`;

//         questions.push({
//           ...q,
//           generatedId,
//           chapterId: chapter.id,
//           lessonId: lesson.id,
//           lesson: { title: lesson.title },
//           chapter: { title: chapter.title },
//         });
//       });
//     });

//     // 👉 (iii) FINAL CHECKPOINT (chapter er last e thakbe)
//     const finalCheckpoints = chapter.lessons.filter(
//       (lesson) => lesson.type === "FINALCHECHPOINT"
//     );

//     finalCheckpoints.forEach((lesson) => {
//       lesson.Question.forEach((q, questionIndex) => {
//         const generatedId = `C${chapterIndex + 1}FCHK${String(
//           questionIndex + 1
//         ).padStart(2, "0")}`;

//         questions.push({
//           ...q,
//           generatedId,
//           chapterId: chapter.id,
//           lessonId: lesson.id,
//           lesson: { title: lesson.title },
//           chapter: { title: chapter.title },
//         });
//       });
//     });
//   });

//   // 3️⃣ Filter by lessonId / chapterId
//   if (lessonId) {
//     questions = questions.filter((q) => q.lessonId === lessonId);
//   } else if (chapterId) {
//     questions = questions.filter((q) => q.chapterId === chapterId);
//   }

//   // 4️⃣ Filter by type
//   if (type) {
//     questions = questions.filter((q) => q.type === type);
//   }

//   // 5️⃣ Search
//   if (search) {
//     questions = questions.filter(
//       (q) =>
//         q.title.toLowerCase().includes(search.toLowerCase()) ||
//         q.generatedId.toLowerCase() === search.toLowerCase()
//     );
//   }

//   // 6️⃣ Pagination
//   const total = questions.length;
//   const start = (page - 1) * limit;
//   const end = start + limit;
//   const paginated = questions.slice(start, end);

//   return {
//     meta: {
//       total,
//       page,
//       limit,
//       totalPages: Math.ceil(total / limit),
//     },
//     data: paginated,
//   };
// };


const getFilteredQuestions = async (params: FilterParams) => {
  const { chapterId, lessonId, type, search, page = 1, limit = 10 } = params;

  let questions: any[] = [];

  // 1️⃣ সব chapter load without orderBy for final checkpoint
  const chapters = await prisma.chapter.findMany({
    include: {
      lessons: {
        include: {
          Question: true, // এখানে orderBy না দিলে DB insert order follow হবে
        },
      },
    },
  });

  // 🔀 আলাদা করবো normal + final chapters
  const normalChapters = chapters.filter((c) => c.type !== "FINALCHECHPOINT");
  const finalChapters = chapters.filter((c) => c.type === "FINALCHECHPOINT");
  const orderedChapters = [...normalChapters, ...finalChapters];

  // 2️⃣ ID generation
  orderedChapters.forEach((chapter, chapterIndex) => {
    let lessonCounter = 0;

    // (i) LESSON
    chapter.lessons
      .filter((lesson) => lesson.type === "LESSON")
      .forEach((lesson) => {
        lessonCounter++;
        lesson.Question.forEach((q, questionIndex) => {
          const generatedId = `C${chapterIndex + 1}L${lessonCounter}Q${String(
            questionIndex + 1
          ).padStart(2, "0")}`;

          questions.push({
            ...q,
            generatedId,
            chapterId: chapter.id,
            lessonId: lesson.id,
            lesson: { title: lesson.title },
            chapter: { title: chapter.title },
          });
        });
      });

    // (ii) CHECKPOINT
    chapter.lessons
      .filter((lesson) => lesson.type === "CHECHPOINT")
      .forEach((lesson) => {
        lesson.Question.forEach((q, questionIndex) => {
          const generatedId = `C${chapterIndex + 1}CHK${String(
            questionIndex + 1
          ).padStart(2, "0")}`;

          questions.push({
            ...q,
            generatedId,
            chapterId: chapter.id,
            lessonId: lesson.id,
            lesson: { title: lesson.title },
            chapter: { title: chapter.title },
          });
        });
      });

    // (iii) FINAL CHECKPOINT — DB insert order অনুযায়ী
    chapter.lessons
      .filter((lesson) => lesson.type === "FINALCHECHPOINT")
      .forEach((lesson) => {
        lesson.Question.forEach((q, questionIndex) => {
          const generatedId = `C${chapterIndex + 1}FCHK${String(
            questionIndex + 1
          ).padStart(2, "0")}`;

          questions.push({
            ...q,
            generatedId,
            chapterId: chapter.id,
            lessonId: lesson.id,
            lesson: { title: lesson.title },
            chapter: { title: chapter.title },
          });
        });
      });
  });

  // 3️⃣ Filter + search + pagination (আগের মতো)
  if (lessonId) questions = questions.filter((q) => q.lessonId === lessonId);
  else if (chapterId) questions = questions.filter((q) => q.chapterId === chapterId);

  if (type) questions = questions.filter((q) => q.type === type);

  if (search) {
    const s = search.toLowerCase();
    questions = questions.filter(
      (q) => q.title.toLowerCase().includes(s) || q.generatedId.toLowerCase() === s
    );
  }

  const total = questions.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginated = questions.slice(start, end);

  return {
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    data: paginated,
  };
};



const getAllQuestionsFromDBWithQuery = async (query: Record<string, unknown>) => {
  const questionQuery = new QueryBuilder2<typeof prisma.question>(prisma.question, query);
  const result = await questionQuery
    .search(['title', 'explanation', 'suggestion'])
    .filter()
    .sort()
    .customFields({
      id: true,
      title: true,
      type: true,
      chapter: {
        select: {
          id: true,
          title: true
        }
      },
      lesson: {
        select: {
          id: true,
          title: true
        }
      },
      suggestion: true,
      explanation: true
    })
    .exclude()
    .paginate()
    .execute();

  return result;
}



const saveQuestionIntoDB = async (userId: string, questionId: string) => {
  const reportQuestion = await prisma.question.findFirst({ where: { id: questionId } })

  if (!reportQuestion) {
    throw new AppError(httpStatus.NOT_FOUND, 'Question not found!');
  }
  // আগে চেক করব প্রশ্নটা save আছে কিনা
  const existing = await prisma.savedQuestion.findFirst({
    where: {
      userId,
      questionId,
    },
  });

  if (existing) {
    // আগে থেকে save করা থাকলে unsave (delete) করব
    await prisma.savedQuestion.delete({
      where: { id: existing.id },
    });

    return { message: "Question unsaved successfully", saved: false };
  } else {
    // save করা না থাকলে নতুন করে save করব
    await prisma.savedQuestion.create({
      data: {
        userId,
        questionId,
      },
    });

    return { message: "Question saved successfully", saved: true };
  }
};


const getSaveQuestionsFromDB = async (userId: string) => {
   const result= await prisma.savedQuestion.findMany({
    where: { userId },
    include: { question: { include: { lesson: true } } }


  });


  result.forEach((element:any) => {
      element.question.lessonImage=  element?.question?.lesson?.image
  });

  return result
};


const getSingleQuestionFromDB = async (id: string) => {
  // সব chapter আনব ordered ভাবে
  const chapters = await prisma.chapter.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      lessons: {
        orderBy: { createdAt: "asc" },
        include: {
          Question: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  // এখন নির্দিষ্ট question খুঁজে বের করা
  let foundQuestion: any = null;

  chapters.forEach((chapter, chapterIndex) => {
    chapter.lessons.forEach((lesson, lessonIndex) => {
      lesson.Question.forEach((q, questionIndex) => {
        if (q.id === id) {
          const generatedId = `C${chapterIndex + 1}L${lessonIndex + 1}Q${String(
            questionIndex + 1
          ).padStart(2, "0")}`;

          foundQuestion = {
            ...q,
            generatedId,
          };
        }
      });
    });
  });

  if (!foundQuestion) {
    throw new Error("Question not found");
  }

  return foundQuestion;
};


const updateQuestionInDB = async (id: string, payload: any) => {
  return await prisma.question.update({
    where: { id },
    data: {
      ...payload,
      options: payload.options || [],
    },
    include: {
      answers: true,
    },
  });
};

const deleteQuestionFromDB = async (id: string) => {
  // 1. related answers delete
  await prisma.answer.deleteMany({ where: { questionId: id } });

  // 2. related savedQuestions delete
  await prisma.savedQuestion.deleteMany({ where: { questionId: id } });

  // 3. finally question delete
  const deletedQuestion = await prisma.question.delete({ where: { id } });

  return deletedQuestion;
};


// ------------------- report Question IntoDB-------------------
const reportQuestionIntoDB = async (
  userId: string,
  document: string, // image বা document
  userEmail: string,
  details: string
) => {
  // 1️⃣ রিপোর্ট ডাটাবেজে save করা
  const report = await prisma.reportQuestion.create({
    data: {
      user: { connect: { id: userId } },
      document, // questionId এর পরিবর্তে document সংরক্ষণ
      email: userEmail,
      details,
    },
    include: {
      user: { select: { email: true, userName: true } },
    },
  });

  // 2️⃣ Email পাঠানো admin কে
  const adminUser = {
    email: process.env.Mail || "contact@reciteone.com",
    firstName: "Najwa",
  } as any;

  const email = new Email(adminUser);

  const subject = `اتصل بنا`;
  // const message = `
  // <div>
  //   <h2>تم استلام رسالتك</h2>
  //   <p><b>البريد الإلكتروني: ${userEmail}</p>
    
  //   <p><b>الملف:</b> <a href="${report.document}" target="_blank"> تحميل </a> </p>
  //   <p><b>التفاصيل:</b> ${report.details ?? "N/A"}</p>
  //   <p><small>تمَّ الإرسال: في  ${formatDateTimeArabic(report.createdAt)}</small></p>
  //   </div>
  // `;
  const message =  `
  <div dir="rtl" style="font-family: Arial, Helvetica, sans-serif; color: #333;">
    <h2 style="text-align:right;">تم استلام رسالتك</h2>
    <table style="width:100%; border-collapse: collapse; margin-top: 15px;">
      <tr>
        <td style="text-align:right;"><b>البريد الإلكتروني: </b>${userEmail}</td>
      </tr>
     ${report.document?`<tr>
        <td style="text-align:right;"><b>الملف: </b> <a href="${report?.document}" target="_blank">تحميل</a></td>
      </tr>`:""}
      <tr>
        <td style="text-align:right;"><b>التفاصيل: </b> ${report?.details ?? "N/A"}</td>
      </tr>
    </table>
    <p style="font-size:12px; color:#888; margin-top:15px; text-align:right;">تمَّ الإرسال في ${formatDateTimeArabic(report?.createdAt)}</p>
  </div>`;


  message
  
  

  await email.sendCustomEmail(subject, message);

  return report;
};


const getReportedQuestionsFromDB = async () => {
  return await prisma.reportQuestion.findMany({




  });
};




export const QuestionServices = {
  createQuestionIntoDB,
  // getAllQuestionsFromDB,
  getSingleQuestionFromDB,
  updateQuestionInDB,
  deleteQuestionFromDB,
  saveQuestionIntoDB,
  getSaveQuestionsFromDB,
  reportQuestionIntoDB,
  getReportedQuestionsFromDB,
  createMultipleQuestiontoDB,
  createMultipleFinalQuestiontoDB,
  getAllQuestionsFromDBWithQuery,
  // searchQuestionsFromDB,
  getFilteredQuestions

};
