import express from 'express';
import { AnswerControllers } from './answer.controller';
import validateRequest from '../../middlewares/validateRequest';
import { AnswerValidation } from './answer.validation';
import auth from '../../middlewares/auth';

const router = express.Router();


router.get(
  '/',
  auth("USER"), // only logged in user can submit
 
  AnswerControllers.myAllAnswer
);
router.get(
  '/me',
  auth("USER"), // only logged in user can submit
 
  AnswerControllers.myCorrectAnswer
);
router.get(
  '/review/me',
  auth("USER"), // only logged in user can submit
 
  AnswerControllers.myReview
);
router.post(
  '/',
  auth("USER"), // only logged in user can submit
 
  AnswerControllers.submitAnswer
);


router.post("/update", auth("USER"),AnswerControllers.submitOrUpdateAnswer);


export const AnswerRouters = router;
