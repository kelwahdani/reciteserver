import express from 'express';
import { LessonControllers } from './lesson.controller';
import validateRequest from '../../middlewares/validateRequest';

import auth from '../../middlewares/auth';
import { LessonValidation } from './lessonvalidation';

const router = express.Router();

router.post(
  '/',
  auth('ADMIN',"SUPERADMIN"),
  validateRequest(LessonValidation.createLesson),
  LessonControllers.createLesson
);

router.get('/', auth("USER","ADMIN","SUPERADMIN"),LessonControllers.getAllLessons);
router.get('/:id',auth("USER","ADMIN","SUPERADMIN"), LessonControllers.getSingleLesson);

router.patch(
  '/:id',
  auth('ADMIN',"SUPERADMIN"),
  validateRequest(LessonValidation.updateLesson),
  LessonControllers.updateLesson
);
router.patch("/:id/status",  auth('ADMIN',"SUPERADMIN"), LessonControllers.updateLessonStatus);
router.delete('/:id', auth('ADMIN',"SUPERADMIN"), LessonControllers.deleteLesson);


router.get('/my-checkPoint/:lessonId',auth("USER","ADMIN","SUPERADMIN"), LessonControllers.mycheckPointData);
router.get('/final/checkPoint/me',auth("USER","ADMIN","SUPERADMIN"), LessonControllers.finalcheckPointData);

export const LessonRouters = router;
// ppp