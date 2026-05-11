import { Router, type IRouter } from "express";
import healthRouter from "./health";
import generateSongRouter from "./generate-song";
import generateAudioRouter from "./generate-audio";
import authRouter from "./auth";
import adminRouter from "./admin";
import projectsRouter from "./projects";
import artistDnaRouter from "./artist-dna";
import voiceCloneRouter from "./voice-clone";
import stripeRouter from "./stripe";
import paystackRouter from "./paystack";
import usageRouter from "./usage";
import instrumentalCallbackRouter from "./instrumental-callback";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(generateSongRouter);
router.use(generateAudioRouter);
router.use(instrumentalCallbackRouter);
router.use(adminRouter);
router.use(projectsRouter);
router.use(artistDnaRouter);
router.use(voiceCloneRouter);
router.use(stripeRouter);
router.use(paystackRouter);
router.use(usageRouter);

export default router;
