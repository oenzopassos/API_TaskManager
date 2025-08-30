import express from "express";
import "express-async-errors";
import { ErrorHandling } from "./middlewares/errorHandling";
import { routes } from "./routes";

const app = express();

app.use(express.json());
app.use(routes)
app.use(ErrorHandling);

export { app };
