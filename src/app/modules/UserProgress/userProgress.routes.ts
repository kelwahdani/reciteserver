import express from 'express';
import { UserProgressControllers } from './userProgress.controller';
import validateRequest from '../../middlewares/validateRequest';
import { UserProgressValidation } from './userProgress.validation';
import auth from '../../middlewares/auth';

const router = express.Router();

router.post(
  '/',
  auth('USER', 'ADMIN','SUPERADMIN'),
  validateRequest(UserProgressValidation.create),
  UserProgressControllers.createProgress
);

router.get('/', auth('ADMIN','SUPERADMIN'), UserProgressControllers.getAllProgress);
router.get('/user/:userId', auth('USER', 'ADMIN','SUPERADMIN'), UserProgressControllers.getProgressByUser);
router.get('/lesson/:lessonId', auth('ADMIN','SUPERADMIN'), UserProgressControllers.getProgressByLesson);

router.patch(
  '/:id',
  auth('USER', 'ADMIN','SUPERADMIN'),
  validateRequest(UserProgressValidation.update),
  UserProgressControllers.updateProgress
);

export const UserProgressRouters = router;
