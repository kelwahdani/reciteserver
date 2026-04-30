import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { ChapterServices } from './chapter.service';

const createChapter = catchAsync(async (req, res) => {
  const result = await ChapterServices.createChapterIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Chapter created successfully',
    data: result,
  });
});

const getAllChapters = catchAsync(async (req, res) => {
  const result = await ChapterServices.getAllChaptersFromDB();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Chapters fetched successfully',
    data: result,
  });
});

const completedChapter = catchAsync(async (req, res) => {
  const result = await ChapterServices.completedChapterFromDB(req.user.userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Chapters fetched successfully',
    data: result,
  });
});

const getSingleChapter = catchAsync(async (req, res) => {
  const result = await ChapterServices.getSingleChapterFromDB(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Chapter details fetched successfully',
    data: result,
  });
});

const updateChapter = catchAsync(async (req, res) => {
  const result = await ChapterServices.updateChapterInDB(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Chapter updated successfully',
    data: result,
  });
});

const deleteChapter = catchAsync(async (req, res) => {
  const result = await ChapterServices.deleteChapterFromDB(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Chapter deleted successfully',
    data: result,
  });
});


const mycheckPointData = catchAsync(async (req, res) => {
  const result = await ChapterServices.mycheckPointDtataInDB(req.user.userId,req.params.lessonId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'check Point successfully',
    data: result,
  });
});




const updateChapterStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // "ACTIVE" | "INACTIVE"

  const result = await ChapterServices.updateChapterStatusInDB(id, status);

  sendResponse(res, {
    statusCode: result.result ? httpStatus.OK : httpStatus.BAD_REQUEST,
    success: !!result.result,
    message: result.message,
    data: result.result,
  });
});

export const ChapterControllers = {
  createChapter,
  getAllChapters,
  getSingleChapter,
  updateChapter,
  deleteChapter,
  completedChapter,
  mycheckPointData,
  updateChapterStatus
};
