import { Router } from "express";
import authenticate from "../middleware/authenticate";

const ServerRouter = Router();

ServerRouter.use(authenticate);
