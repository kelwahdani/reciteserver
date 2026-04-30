import express,{Request,Response} from 'express';
import { AuthRouters } from '../modules/Auth/auth.routes';
import { UserRouters } from '../modules/User/user.routes';



import { upload } from '../middlewares/upload';
import { uploadFile } from '../utils/uploadFile';
import { ChapterRouters } from '../modules/Chapter/chapter.routes';
import { LessonRouters } from '../modules/Lesson/lesson.routes';
import { QuestionRouters } from '../modules/Question/question.routes';
import { AnswerRouters } from '../modules/Answer/answer.routes';
import { UserProgressRouters } from '../modules/UserProgress/userProgress.routes';
import { SavedQuestionRouters } from '../modules/SavedQuestion/savedQuestion.routes';
import { CertificateRouters } from '../modules/Certificate/certificate.routes';
import { WeekChallengeRoutes } from '../modules/WeekChallenge/weekChallenge.routes';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRouters,
  },
  {
    path: '/users',
    route: UserRouters,
  },
  {
    path: '/chapters',
    route: ChapterRouters,
  },
  {
    path: '/lessons',
    route: LessonRouters,
  },
  {
    path: '/questions',
    route: QuestionRouters,
  },
  {
    path: '/answers',
    route: AnswerRouters,
  },
  {
    path: '/userProgress',
    route: UserProgressRouters,
  },
  {
    path: '/savedQuestions',
    route: SavedQuestionRouters,
  },
  {
    path: '/certificates',
    route: CertificateRouters,
  },
  {
    path: '/weekChallenges',
    route: WeekChallengeRoutes,
  },

];
moduleRoutes.forEach(route => router.use(route.path, route.route));
router.post("/upload", upload.single("upload"), (req: Request, res: Response) => {
  if (req.file) {
    const result = uploadFile(req.file);
    result.then((response) => {
      if (response.success) {
        return res.status(200).json(response);
      } else {
        return res.status(400).json(response);
      }
    });
  } else {
    return res.status(400).json({ success: false, error: "No file provided" });
  }
});



// router.post("/upload", upload.array("upload", 15), async (req: Request, res: Response) => {
//   if (!req.files || !(req.files instanceof Array) || req.files.length === 0) {
//     return res.status(400).json({ success: false, error: "No files provided" });
//   }

//   const uploadPromises = req.files.map(file => uploadFile(file));
//   const results = await Promise.all(uploadPromises);

//   const successUploads = results.filter(result => result.success);
//   const failedUploads = results.filter(result => !result.success);

//   return res.status(200).json({
//     success: true,
//     uploaded: successUploads.map(u => u.url),
//     failed: failedUploads.map(f => f.error),
//   });
// });

export default router;
