import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { UserControllers } from './user.controller';
import { UserValidations } from './user.validation';
const router = express.Router();

router.post(
  '/register',
  validateRequest(UserValidations.registerUser),
  UserControllers.registerUser,
);

router.post(
  '/resend-verification-email',
  UserControllers.resendUserVerificationEmail,
);

router.get('/', auth("ADMIN","SUPERADMIN"),UserControllers.getAllUsers);
router.delete('/:id', UserControllers.deleteUser);

router.get('/me', auth('USER', 'ADMIN','SUPERADMIN'), UserControllers.getMyProfile);

router.get('/:id', UserControllers.getUserDetails);
router.put(
  '/update-profile',
  auth('USER', 'ADMIN','SUPERADMIN'),
  UserControllers.updateMyProfile,
);
router.get(
  '/all-student/admin',
  auth( 'ADMIN','SUPERADMIN'),
  UserControllers.getAllStudent,
);
router.put('/update',auth('USER', 'ADMIN','SUPERADMIN'), UserControllers.updateUser);
router.get('/verify-email/:token', UserControllers.verifyUserEmail);

router.put(
  '/update-user/:id',
  auth('ADMIN','SUPERADMIN'),
  UserControllers.updateUserRoleStatus,
);

router.post(
  '/change-password',
  auth('USER', 'ADMIN','SUPERADMIN'),
  UserControllers.changePassword,
);


// myProgress
router.get('/progress/me', auth(), UserControllers.myProgress);

// strat
router.post('/reset-password/send-otp', UserControllers.requestPasswordReset);

// Step 2: Verify OTP
router.post('/reset-password/verify-otp', UserControllers.verifyOtp);

// Step 3: update password
router.post('/reset-password/update', UserControllers.resetPassword);


// end



// IcreateInviteFriend
router.post('/invite/friend', auth(), UserControllers.createInviteFriend);


// blockForWeekTime
router.post('/block/for-week', auth(), UserControllers.blockForWeekTime);
router.get('/block/for/week', auth(), UserControllers.isBlockForWeekTime);



// Lesson progression
router.get('/chapters/for-user', auth(), UserControllers.getAllChaptersForUser);
router.post('/chapters/complete', auth(), UserControllers.completeLesson);
router.get('/chapter-answer/count', auth(), UserControllers.getChapterAndAnswerCount);



// certificate-auto-approval

router.get("/admin-setting/certificate-auto-approval",auth("ADMIN",'SUPERADMIN'),  UserControllers.getCertificateAutoApproval);
router.patch("/admin-setting/certificate-auto-approval", auth("ADMIN",'SUPERADMIN'), UserControllers.updateCertificateAutoApproval);



// DailyChallenge
router.post("/daily-challenge/generate",auth("USER"), UserControllers.generateChallenges);
router.get("/daily-challenge/me",auth("USER") ,UserControllers.getChallenges);
router.put("/daily-challenge/progress",auth("USER"), UserControllers.updateProgress);

export const UserRouters = router;
