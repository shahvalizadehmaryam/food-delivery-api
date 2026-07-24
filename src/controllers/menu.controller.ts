import catchAsync from "../utils/catchAsync";
import menuService from "../services/menu.service";

/** GET /v1/menu — returns MenuSection[] for the menu page */
const getMenu = catchAsync(async (_req, res) => {
  const menu = await menuService.getMenu();
  res.send(menu);
});

export default { getMenu };
