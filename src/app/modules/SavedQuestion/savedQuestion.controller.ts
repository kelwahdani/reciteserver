import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { SavedQuestionServices } from './savedQuestion.service';

const createSaved = catchAsync(async (req, res) => {
  const result = await SavedQuestionServices.createSavedQuestion(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Question saved successfully',
    data: result,
  });
});

const getAllSaved = catchAsync(async (req, res) => {
  const result = await SavedQuestionServices.getAllSavedQuestions();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'All saved questions fetched',
    data: result,
  });
});

const getSavedByUser = catchAsync(async (req, res) => {
  const result = await SavedQuestionServices.getSavedQuestionsByUser(req.params.userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Saved questions by user fetched',
    data: result,
  });
});

const deleteSaved = catchAsync(async (req, res) => {
  const result = await SavedQuestionServices.deleteSavedQuestion(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Saved question deleted',
    data: result,
  });
});

export const SavedQuestionControllers = {
  createSaved,
  getAllSaved,
  getSavedByUser,
  deleteSaved,
};
