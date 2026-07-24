import express from "express";
import menuController from "../../controllers/menu.controller";

const router = express.Router();

// Public route — anyone can browse the menu without logging in
router.get("/", menuController.getMenu);

export default router;
