import { TeamsController } from "@/controller/teamsController";
import { ensureAuthenticated } from "@/middlewares/ensureAuthenticated";
import { verifyAuthorization } from "@/middlewares/verifyAuthorization";
import { Router } from "express";

const teamsRoutes = Router();
const teamsController = new TeamsController();

teamsRoutes.use(ensureAuthenticated);

teamsRoutes.post("/", verifyAuthorization(["admin"]), teamsController.create);
teamsRoutes.post("/:id/members", verifyAuthorization(["admin"]), teamsController.addMember);
teamsRoutes.delete("/:teamId", verifyAuthorization(["admin"]), teamsController.removeMember);
teamsRoutes.put("/:id", verifyAuthorization(["admin"]), teamsController.updateTeam)
teamsRoutes.get("/my-teams", verifyAuthorization(["member", "admin"]), teamsController.myTeams);


export { teamsRoutes };