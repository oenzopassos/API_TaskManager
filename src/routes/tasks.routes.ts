import { TasksController } from "@/controller/tasksController";
import { TasksStatusController } from "@/controller/tasksStatusController";
import { ensureAuthenticated } from "@/middlewares/ensureAuthenticated";
import { verifyAuthorization } from "@/middlewares/verifyAuthorization";
import { Router } from "express";

const tasksRoutes = Router();
const tasksController = new TasksController();
const tasksStatusController = new TasksStatusController()

tasksRoutes.use(ensureAuthenticated);
tasksRoutes.post("/:id", verifyAuthorization(['admin']), tasksController.create);
tasksRoutes.get("/", verifyAuthorization(["member", 'admin']), tasksController.show);
tasksRoutes.patch("/:task_id/status", verifyAuthorization(["admin"]), tasksStatusController.update);
tasksRoutes.patch("/:taskId/assign", verifyAuthorization(['admin']), tasksController.updateAssign);
tasksRoutes.put("/:taskId", verifyAuthorization(['member','admin']), tasksController.update);

export {tasksRoutes};