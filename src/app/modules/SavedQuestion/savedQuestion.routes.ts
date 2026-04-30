import express from 'express';
import { SavedQuestionControllers } from './savedQuestion.controller';
import validateRequest from '../../middlewares/validateRequest';
import { SavedQuestionValidation } from './savedQuestion.validation';
import auth from '../../middlewares/auth';

const router = express.Router();

router.post(
  '/',
  auth('USER', 'ADMIN','SUPERADMIN'),
  validateRequest(SavedQuestionValidation.create),
  SavedQuestionControllers.createSaved
);

router.get('/', auth('ADMIN','SUPERADMIN'), SavedQuestionControllers.getAllSaved);
router.get('/user/me', auth('USER',), SavedQuestionControllers.getSavedByUser);
router.delete('/:id', auth('USER', 'ADMIN','SUPERADMIN'), SavedQuestionControllers.deleteSaved);

export const SavedQuestionRouters = router;
