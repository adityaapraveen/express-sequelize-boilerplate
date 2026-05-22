import { Router } from "express";
import balanceController from "../controllers/balance.controller";

const routes = new Router();

routes.get("/balances", balanceController.get);

export default routes;