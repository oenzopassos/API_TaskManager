import { UsersController } from "@/controller/usersController";
import { Router } from "express";

const usersRoutes = Router()
const usersController = new UsersController();

usersRoutes.post("/", usersController.create);

export {usersRoutes}