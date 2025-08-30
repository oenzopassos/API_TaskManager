import { SessionsController } from "@/controller/sessionsController";
import { Router } from "express";

const sessionsRoutes = Router();
const sessionsController = new SessionsController();


sessionsRoutes.post("/", sessionsController.create);

export {sessionsRoutes}