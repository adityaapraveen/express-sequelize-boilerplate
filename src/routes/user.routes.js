import { Router } from "express";
import userController from "../controllers/user.controller";
import authMiddleware from "../middlewares/auth.middleware";

const userRoutes = Router();

userRoutes.post("/users", userController.add);
userRoutes.get("/users", userController.get);
userRoutes.get("/users/:id", userController.find);
userRoutes.patch("/users/:id", userController.update);
userRoutes.delete("/users/:id", userController.delete);

export { userRoutes };
