import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { QuestionServices } from './question.service';

// ------------------ Create Question ----------------
const createQuestion = catchAsync(async (req, res) => {
  const result = await QuestionServices.createQuestionIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Question created successfully',
    data: result,
  });
});

// --------------------- createMultipleQuestion -------------
const createMultipleQuestion = catchAsync(async (req, res) => {
  const result = await QuestionServices.createMultipleQuestiontoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Question created successfully',
    data: result,
  });
});

// --------------------- createMultipleQuestion final -------------
const createMultipleFinalQuestion = catchAsync(async (req, res) => {
  const result = await QuestionServices.createMultipleFinalQuestiontoDB(req.body.data);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Question created successfully',
    data: result,
  });
});


// ------------------ Get All Questions ----------------


const getAllQuestions = catchAsync(async (req, res) => {
  const { chapterId, lessonId, type, search, page, limit } = req.query as {
    chapterId?: string;
    lessonId?: string;
    type?: string;
    search?: string;
    page?: string;
    limit?: string;
  };

  const result:any = await QuestionServices.getFilteredQuestions({
    chapterId,
    lessonId,
    type,
    search,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 10,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Questions fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});


const getAllQuestionsFromDBWithQuery = catchAsync(async (req, res) => {
  const query = req.query
  const result = await QuestionServices.getAllQuestionsFromDBWithQuery(query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Questions fetched successfully',
    ...result
  });
});


// ------------------ Save Question ----------------
const saveQuestionIntoDB = catchAsync(async (req, res) => {


  const result = await QuestionServices.saveQuestionIntoDB(req.user.userId, req.body.questionId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: ' Save Question created successfully',
    data: result,
  });
});

// ------------------ get Save Questions ----------------
const getSaveQuestions = catchAsync(async (req, res) => {
  const result = await QuestionServices.getSaveQuestionsFromDB(req.user.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Questions fetched successfully',
    data: result,
  });
});

// ------------------ Get Single Question ----------------
const getSingleQuestion = catchAsync(async (req, res) => {
  const result = await QuestionServices.getSingleQuestionFromDB(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Question details fetched successfully',
    data: result,
  });
});

// ------------------ Update Question ----------------
const updateQuestion = catchAsync(async (req, res) => {
  const result = await QuestionServices.updateQuestionInDB(req.params.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Question updated successfully',
    data: result,
  });
});

// ------------------ Delete Question ----------------
const deleteQuestion = catchAsync(async (req, res) => {
  const result = await QuestionServices.deleteQuestionFromDB(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Question deleted successfully',
    data: result,
  });
});
// ------------------  report QuestionIntoDB ----------------
const reportQuestion = catchAsync(async (req, res) => {
  const { document, email, details } = req.body;

  const result = await QuestionServices.reportQuestionIntoDB(req.user.userId, document, email, details);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'report send successfully',
    data: result,
  });
});


// ------------------ get report QuestionIntoDB ----------------
const getReportedQuestion = catchAsync(async (req, res) => {


  const result = await QuestionServices.getReportedQuestionsFromDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: ' get reported Question successfully',
    data: result,
  });
});



export const QuestionControllers = {
  createQuestion,
  getAllQuestions,
  getSingleQuestion,
  updateQuestion,
  deleteQuestion,
  saveQuestionIntoDB,
  getSaveQuestions,
  reportQuestion,
  getReportedQuestion,
  createMultipleQuestion,
  createMultipleFinalQuestion,
  getAllQuestionsFromDBWithQuery
};
