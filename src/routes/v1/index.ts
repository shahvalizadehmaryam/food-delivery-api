import express from "express";
import authRoute from "./auth.route.js";
import userRoute from "./user.route.js";
import adminUserRoute from "./admin.user.route.js";
import docsRoute from "./docs.route.js";
import config from "../../config/config.js";
import menuRoute from "./menu.route.js";
import flashDealRoute from "./flashDeal.route.js";
import adminFlashDealRoute from "./admin.flashDeal.route.js";

const router = express.Router();

const defaultRoutes = [
  {
    path: "/auth",
    route: authRoute,
  },
  {
    path: "/users",
    route: userRoute,
  },
  {
    path: "/admin/users",
    route: adminUserRoute,
  },
  {
    path: "/menu",
    route: menuRoute,
  },
  {
    path: "/flash-deals",
    route: flashDealRoute,
  },
  {
    path: "/admin/flash-deals",
    route: adminFlashDealRoute,
  },
];

const devRoutes = [
  {
    path: "/docs",
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

if (config.env === "development") {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

export default router;
