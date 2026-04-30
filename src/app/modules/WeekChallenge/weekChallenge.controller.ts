import { Request, Response } from "express";
import httpStatus from "http-status";

import { WeekChallengeService } from "./weekChallenge.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import prisma from "../../utils/prisma";



// 2️⃣ all getAllWeek
const getAllWeek = catchAsync(async (req: Request, res: Response) => {
  const result = await WeekChallengeService.getAllWeek(req.user.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All week fetched successfully",
    data: result,
  });
});




// 4️⃣ Update challenge
const updateWeekChallenge = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await WeekChallengeService.updateWeekChallenge(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "WeekChallenge updated successfully",
    data: result,
  });
});



const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

   const calculateDailyChallenge = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;

  if (!userId) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "User ID is required",
      data:null
    });
  }

  const { start, end } = getTodayRange();



  try {
    const challenges = await prisma.dailyChallenge.findMany({
      where: {
        userId,
        date: { gte: start, lte: end },
      },
    });

    if (challenges.length === 0) {
      return sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "No challenges found for today",
          data:null
      });
    }

    for (const challenge of challenges) {
      const completedLessons = await prisma.userProgress.findMany({
        where: {
          userId,
          completed: true,
          updatedAt: { gte: start, lte: end },
        },
        select: { lessonId: true },
      });

      let completedCount = 0;
      let strongPerformanceCount = 0;

      for (const { lessonId } of completedLessons) {
        const questions = await prisma.question.findMany({
          where: { lessonId },
          select: { id: true, fixedScore: true },
        });

        if (questions.length === 0) continue;

        const totalScore = questions.reduce((sum, q) => sum + (q.fixedScore || 0), 0);

        const correctAnswers = await prisma.answer.findMany({
          where: {
            userId,
            isCorrect: true,
            createdAt: { gte: start, lte: end },
            question: { lessonId },
          },
          select: {
            question: { select: { fixedScore: true } },
          },
        });

        const userScore = correctAnswers.reduce(
          (sum:any, a:any) => sum + (a?.question?.fixedScore || 0),
          0
        );

        const percentage = totalScore > 0 ? (userScore / totalScore) * 100 : 0;

      

        if (percentage >= 75) {
          strongPerformanceCount++;
        }

        completedCount++;
      }

      const completed = completedCount >= challenge.target;

      await prisma.dailyChallenge.update({
        where: { id: challenge.id },
        data: {
          completedCount,
          strongPerformanceCount,
          completed,
          updatedAt: new Date(),
        },
      });

    
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Daily challenge updated successfully",
        data:null
    });
  } catch (error) {
    console.error("❌ Error updating daily challenge:", error);
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: "Internal server error",
        data:null
    });
  }
});


export const WeekChallengeController = {
  
  updateWeekChallenge,

  getAllWeek,
  calculateDailyChallenge
};
