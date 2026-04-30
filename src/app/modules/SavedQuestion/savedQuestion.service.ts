import prisma from '../../utils/prisma';

const createSavedQuestion = async (payload: any) => {
  return await prisma.savedQuestion.create({ data: payload });
};

const getAllSavedQuestions = async () => {
  return await prisma.savedQuestion.findMany({
    include: {
      user: true,
      question: true,
    },
    orderBy: { savedAt: 'desc' },
  });
};

const getSavedQuestionsByUser = async (userId: string) => {
  return await prisma.savedQuestion.findMany({
    where: { userId },
    include: { question: {include:{lesson:true}}},
    orderBy: { savedAt: 'desc' },
  });
};

const deleteSavedQuestion = async (id: string) => {
  // related answers delete koro
  await prisma.answer.deleteMany({ where: { questionId: id } });

  // related savedQuestions delete koro
  await prisma.savedQuestion.deleteMany({ where: { questionId: id } });

  // question delete koro
  const deletedQuestion = await prisma.question.delete({ where: { id } });

  return deletedQuestion;
};


export const SavedQuestionServices = {
  createSavedQuestion,
  getAllSavedQuestions,
  getSavedQuestionsByUser,
  deleteSavedQuestion,
};
