import prisma from '../../utils/prisma';

const createUserProgress = async (payload: any) => {
  return await prisma.userProgress.create({ data: payload });
};

const getAllProgress = async () => {
  return await prisma.userProgress.findMany({
    include: {
      user: true,
      lesson: true,
    },
    orderBy: { date: 'desc' },
  });
};

const getProgressByUser = async (userId: string) => {
  return await prisma.userProgress.findMany({
    where: { userId },
    include: { lesson: true },
  });
};

const getProgressByLesson = async (lessonId: string) => {
  return await prisma.userProgress.findMany({
    where: { lessonId },
    include: { user: true },
  });
};

const updateProgress = async (id: string, payload: any) => {
  return await prisma.userProgress.update({
    where: { id },
    data: payload,
  });
};

export const UserProgressServices = {
  createUserProgress,
  getAllProgress,
  getProgressByUser,
  getProgressByLesson,
  updateProgress,
};
