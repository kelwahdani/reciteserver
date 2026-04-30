import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { UserServices } from './user.service';

const registerUser = catchAsync(async (req, res) => {
  const result = await UserServices.registerUserIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'User registered successfully',
    data: result,
  });
});

const getAllUsers = catchAsync(async (req, res) => {
  const result = await UserServices.getAllUsersFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK, // Changed to OK as per common practice for GET requests
    message: 'Users retrieved successfully', // Changed message for clarity
    data: result,
  });
});

const updateUser = catchAsync(async (req, res) => {
  const result = await UserServices.updateUserFromDB(req.user.userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'User updated successfully',
    data: result,
  });
});

const resendUserVerificationEmail = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await UserServices.resendUserVerificationEmail(email);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Verification email sent successfully',
    data: result,
  });
});

const verifyUserEmail = catchAsync(async (req, res) => {
  const { token } = req.params;
  const verifiedUser = await UserServices.verifyUserEmail(res, token);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'User verified successfully.',
    data: verifiedUser,
  });
});

const getMyProfile = catchAsync(async (req, res) => {
  const result = await UserServices.getMyProfileFromDB(req.user.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Profile retrieved successfully',
    data: result,
  });
});

const updateUserRoleStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await UserServices.updateUserRoleStatusIntoDB(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'User updated successfully',
    data: result,
  });
});

const changePassword = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await UserServices.changePassword(user, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Password changed successfully',
    data: result,
  });
});

// Functions from the first block related to password reset
const sendResetOtp = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await UserServices.sendPasswordResetOtp(email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'OTP sent successfully to your email address.',
    data: result,
  });
});

const resetPasswordWithOtp = catchAsync(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const result = await UserServices.verifyOtpAndResetPassword(email, otp, newPassword);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Password reset successfully.',
    data: result,
  });
});

const requestPasswordReset = catchAsync(async (req, res) => {
  const { email } = req.body;

  
  const result = await UserServices.requestPasswordReset(email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'OTP sent successfully to your email address.',
    data: result,
  });
});

const verifyOtp = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  const result = await UserServices.verifyOtp(email, otp);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'OTP verified successfully.',
    data: result,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const { email, password,token } = req.body;
  const result = await UserServices.resetPassword(email, password,token);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Password reset successfully.',
    data: result,
  });
});

// Functions unique to the second block
const getUserDetails = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await UserServices.getUserDetailsFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'User details retrieved successfully',
    data: result,
  });
});

const updateMyProfile = catchAsync(async (req, res) => {
  const id = req.user.userId; // Assuming req.user.id is the correct property for the user's ID
  const result = await UserServices.updateMyProfileIntoDB(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'User profile updated successfully',
    data: result,
  });
});
const deleteUser = catchAsync(async (req, res) => {
  
  const result = await UserServices.deleteUserFromDB(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'delete user successfully',
    data: result,
  });
});



// ========================
// Complete lesson & unlock next (optional controller)
// ✅ User er shob chapter + lesson lock/unlock status সহ
const getAllChaptersForUser = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const result = await UserServices.getAllChaptersForUser(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Chapters and lessons retrieved successfully',
    data: result,
  });
});

// ✅ Lesson complete + next unlock
const completeLesson = catchAsync(async (req, res) => {
  const { lessonId,unlock } = req.body;
  const userId = req.user.userId;

  const result = await UserServices.completeLessonForUser(userId, lessonId,unlock);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message:result?.message,
    data: null,
  });
});

const myProgress = catchAsync(async (req, res) => {
 
  const userId = req.user.userId;

  const result = await UserServices.myProgressInDB(userId,);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'my progress retrieved successfully',
    data: result,
  });
});





// Get
const getCertificateAutoApproval = catchAsync(async (req, res) => {
  const result = await UserServices.getCertificateAutoApproval();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Certificate Auto Approval setting retrieved successfully",
    data: result,
  });
});

// Update (fuldate)
const updateCertificateAutoApproval = catchAsync(async (req, res) => {
  const { certificateAutoApproval } = req.body; // boolean আসবে
  const result = await UserServices.updateCertificateAutoApproval(certificateAutoApproval);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Certificate Auto Approval setting updated successfully",
    data: result,
  });
});



const generateChallenges = catchAsync(async (req, res) => {
  
  const result = await UserServices.generateDailyChallenges();
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Daily challenges generated successfully",
    data: result,
  });
});

// get today's challenges
const getChallenges = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const result = await UserServices.getTodayChallenges(userId as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Today's challenges fetched successfully",
    data: result,
  });
});

// update progress
const updateProgress = catchAsync(async (req, res) => {
  // const { type, amount } = req.body;
  // const result = await UserServices.updateChallengeProgress(
  // req.user.userId,
  //   type,
  //   amount
  // );
  // sendResponse(res, {
  //   statusCode: 200,
  //   success: true,
  //   message: "Challenge progress updated successfully",
  //   data: result,
  // });
});
const getAllStudent = catchAsync(async (req, res) => {
  const { search } = req.query;

  const result = await UserServices.getAllStudentFromDB(search as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Get all students successfully",
    data: result,
  });
});


const getChapterAndAnswerCount = catchAsync(async (req, res) => {
    const { userId } = req.user;
  const result = await UserServices.getChapterAndAnswerCount(userId

  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Chapter & Answer count fetched successfully",
    data: result,
  });
});


 const createInviteFriend = catchAsync(async (req, res) => {
     const { userId } = req.user;
  const invite = await UserServices.createInviteFriend({ userId });

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Invite created successfully',
    data: invite,
  });
});


 const blockForWeekTime = catchAsync(async (req, res) => {
     const { userId } = req.user;
  const result = await UserServices.blockForWeekTime(userId,req.body.data);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: result,
    data: null,
  });
});

 const isBlockForWeekTime = catchAsync(async (req, res) => {
     const { userId } = req.user;
  const result = await UserServices.isBlockForWeekTime(userId);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: result.message,
    data: { isBlock: result.isBlock},
  });
});



export const UserControllers = {
  registerUser,
  getAllUsers,
  getMyProfile,
  updateUser,
  updateUserRoleStatus,
  changePassword,
  resendUserVerificationEmail,
  verifyUserEmail,
  sendResetOtp,
  resetPasswordWithOtp,
  requestPasswordReset,
  verifyOtp,
  resetPassword,
  getUserDetails, // Added from second block
  updateMyProfile, // Added from second block (uncommented)
  deleteUser,
  completeLesson,
  getAllChaptersForUser,
  myProgress,

  getCertificateAutoApproval,
  updateCertificateAutoApproval,
    generateChallenges,
  getChallenges,
  updateProgress,
  getAllStudent,
  getChapterAndAnswerCount,
  createInviteFriend,
  blockForWeekTime,
  isBlockForWeekTime
};