import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { UserProgressServices } from './userProgress.service';

const createProgress = catchAsync(async (req, res) => {
  const result = await UserProgressServices.createUserProgress(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Progress recorded successfully',
    data: result,
  });
});

const getAllProgress = catchAsync(async (req, res) => {
  const result = await UserProgressServices.getAllProgress();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'All progress fetched',
    data: result,
  });
});

const getProgressByUser = catchAsync(async (req, res) => {
  const result = await UserProgressServices.getProgressByUser(req.params.userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Progress by user fetched',
    data: result,
  });
});

const getProgressByLesson = catchAsync(async (req, res) => {
  const result = await UserProgressServices.getProgressByLesson(req.params.lessonId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Progress by lesson fetched',
    data: result,
  });
});

const updateProgress = catchAsync(async (req, res) => {
  const result = await UserProgressServices.updateProgress(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Progress updated successfully',
    data: result,
  });
});

export const UserProgressControllers = {
  createProgress,
  getAllProgress,
  getProgressByUser,
  getProgressByLesson,
  updateProgress,
};
