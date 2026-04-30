import express from "express";

import auth from "../../middlewares/auth";
import { WeekChallengeController } from "./weekChallenge.controller";


const router = express.Router();


// Get all challenges (default)
router.get("/",auth("USER"), WeekChallengeController.getAllWeek);

router.post("/calculate",auth(), WeekChallengeController.calculateDailyChallenge);



// Update challenge
router.patch("/:id",auth("USER"), WeekChallengeController.updateWeekChallenge);



export const WeekChallengeRoutes = router;
