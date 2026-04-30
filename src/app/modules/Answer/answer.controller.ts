import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { AnswerServices } from './answer.service';

// ------------------ Submit Answer ----------------
const submitAnswer = catchAsync(async (req, res) => {
  const { questionId,userAnswer } = req.body;
   const {userId}=req?.user

  const result = await AnswerServices.submitAnswerIntoDB({
    questionId,
    userId,
    userAnswer,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});
const myCorrectAnswer = catchAsync(async (req, res) => {
  const { userId } = req?.user;

  const result = await AnswerServices.myCorrectAnswerIntoDB(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Answers retrieved successfully",
    data: result,
  });
});
const myReview = catchAsync(async (req, res) => {
  const { userId } = req?.user;

  const result = await AnswerServices.myReviewIntoDB(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My Review retrieved successfully",
    data: result,
  });
});
const myAllAnswer = catchAsync(async (req, res) => {
  const { userId } = req?.user;

  const result = await AnswerServices.myAllAnswerIntoDB(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Answers retrieved successfully",
    data: result,
  });
});


const submitOrUpdateAnswer = catchAsync(async (req, res) => {
  const { answerId, userAnswer } = req.body;

 const { userId } = req?.user;

  const result = await AnswerServices.submitOrUpdateAnswerIntoDB({
    answerId,
    userId,
    userAnswer,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: result,
  });
});




export const AnswerControllers = {
  submitAnswer,
  myCorrectAnswer,
  myAllAnswer,
  myReview,
  submitOrUpdateAnswer

};
