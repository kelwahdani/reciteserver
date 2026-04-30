import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { LessonServices } from './lesson.service';

const createLesson = catchAsync(async (req, res) => {
  const result = await LessonServices.createLessonIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Lesson created successfully',
    data: result,
  });
});

const getAllLessons = catchAsync(async (req, res) => {
  const result = await LessonServices.getAllLessonsFromDB();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Lessons fetched successfully',
    data: result,
  });
});

const getSingleLesson = catchAsync(async (req, res) => {
  const result = await LessonServices.getSingleLessonFromDB(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Lesson details fetched successfully',
    data: result,
  });
});

const updateLesson = catchAsync(async (req, res) => {
  const result = await LessonServices.updateLessonInDB(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Lesson updated successfully',
    data: result,
  });
});

const deleteLesson = catchAsync(async (req, res) => {
  const result = await LessonServices.deleteLessonFromDB(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Lesson deleted successfully',
    data: result,
  });
});


const mycheckPointData = catchAsync(async (req, res) => {
  const result = await LessonServices.mycheckPointDtataInDB(req.user.userId,req.params.lessonId,'');
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'check Point successfully',
    data: result,
  });
});
const finalcheckPointData = catchAsync(async (req, res) => {
  const result = await LessonServices.finalcheckPointDtataInDB(req.user.userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'check Point successfully',
    data: result,
  });
});

const updateLessonStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // "ACTIVE" | "INACTIVE"

  const result = await LessonServices.updateLessonStatusInDB(id, status);

  sendResponse(res, {
    statusCode: result.result ? httpStatus.OK : httpStatus.BAD_REQUEST,
    success: !!result.result,
    message: result.message,
    data: result.result,
  });
});

export const LessonControllers = {
  createLesson,
  getAllLessons,
  getSingleLesson,
  updateLesson,
  deleteLesson,
  mycheckPointData,
  updateLessonStatus,
  finalcheckPointData
 
};
