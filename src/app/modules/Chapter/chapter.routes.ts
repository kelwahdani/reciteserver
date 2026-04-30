import express from 'express';
import { ChapterControllers } from './chapter.controller';
import validateRequest from '../../middlewares/validateRequest';
import { ChapterValidation } from './chapter.validation';
import auth from '../../middlewares/auth';

const router = express.Router();

router.post(
  '/',
  auth('ADMIN',"SUPERADMIN"),
  validateRequest(ChapterValidation.createChapter),
  ChapterControllers.createChapter
);

router.get('/',auth("USER","ADMIN","SUPERADMIN"), ChapterControllers.getAllChapters);
router.get('/completed-Chapter/me',auth("USER"), ChapterControllers.completedChapter);
router.get('/:id',auth("USER","ADMIN","SUPERADMIN"), ChapterControllers.getSingleChapter);
router.get('/my-checkPoint/:chapterId',auth("USER","ADMIN","SUPERADMIN"), ChapterControllers.mycheckPointData);

router.patch(
  '/:id',
  auth('ADMIN',"SUPERADMIN"),
  validateRequest(ChapterValidation.updateChapter),
  ChapterControllers.updateChapter
);
router.patch("/:id/status", auth('ADMIN',"SUPERADMIN"),ChapterControllers.updateChapterStatus);
router.delete('/:id', auth('ADMIN',"SUPERADMIN"), ChapterControllers.deleteChapter);

export const ChapterRouters = router;
