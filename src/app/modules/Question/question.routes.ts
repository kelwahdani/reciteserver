import express from 'express';
import { QuestionControllers } from './question.controller';
import auth from '../../middlewares/auth'; // যদি authentication থাকে
import validateRequest from '../../middlewares/validateRequest';
import { QuestionValidation } from './question.validation';

const router = express.Router();

// ------------------ Question CRUD ----------------
router.post(
  '/',
  auth('ADMIN', 'SUPERADMIN'), // optional
  validateRequest(QuestionValidation.createQuestion),
  QuestionControllers.createQuestion
);
router.post(
  '/multiple',
  auth('ADMIN', 'SUPERADMIN'), // optional
  // validateRequest(QuestionValidation.createQuestion),
  QuestionControllers.createMultipleQuestion
);
router.post(
  '/final',
  auth('ADMIN', 'SUPERADMIN'), // optional
  // validateRequest(QuestionValidation.createQuestion),
  QuestionControllers.createMultipleFinalQuestion
);
router.post(
  '/save-question',
  auth('USER'), // optional

  QuestionControllers.saveQuestionIntoDB
);

router.post(
  '/report-question',
  auth('USER'), // optional

  QuestionControllers.reportQuestion
);


router.get(
  '/save-question/me',
  auth('USER'), // optional

  QuestionControllers.getSaveQuestions
);
router.get(
  '/reported-question/admin',
  auth('ADMIN', "SUPERADMIN"), // optional

  QuestionControllers.getReportedQuestion
);

router.get(
  '/',
  auth('USER', 'ADMIN', 'SUPERADMIN'), // optional
  QuestionControllers.getAllQuestions
);
router.get(
  '/all/get-with-query',
  auth('USER', 'ADMIN', 'SUPERADMIN'), // optional
  QuestionControllers.getAllQuestionsFromDBWithQuery
);

router.get(
  '/:id',
  auth('USER', 'ADMIN', 'SUPERADMIN'), // optional
  QuestionControllers.getSingleQuestion
);

router.put(
  '/:id',
  auth('ADMIN', 'SUPERADMIN'), // optional
  // validateRequest(QuestionValidation.updateQuestion),
  QuestionControllers.updateQuestion
);

router.delete(
  '/:id',
  auth('ADMIN', 'SUPERADMIN'), // optional
  QuestionControllers.deleteQuestion
);


export const QuestionRouters = router;
