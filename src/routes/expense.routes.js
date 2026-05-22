import { Router } from "express";
import expenseController from "../controllers/expense.controller";

const routes = new Router();

routes.post("/expenses", expenseController.add);
routes.get("/expenses", expenseController.get);
routes.get("/expenses/:id", expenseController.find);
routes.patch("/expenses/:id", expenseController.update);
routes.delete("/expenses/:id", expenseController.delete);

export default routes;