import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync";
import basketService from "../services/basket.service";

const createBasket = catchAsync(async (_req, res) => {
  const basket = await basketService.createGuestBasket();
  res.status(httpStatus.CREATED).send(basket);
});

const getBasket = catchAsync(async (req, res) => {
  const basket = await basketService.getBasketById(req.params.basketId);
  res.send(basket);
});

// user-basket
const getMyBasket = catchAsync(async (req, res) => {
  const userId = (req.user as { id: number }).id;
  const basket = await basketService.getOrCreateUserBasket(userId);
  res.send(basket);
});

const addItem = catchAsync(async (req, res) => {
  const basket = await basketService.addItemToBasket(req.params.basketId, {
    productId: req.body.productId,
    sizeId: req.body.sizeId,
    quantity: req.body.quantity,
  });
  res.status(httpStatus.CREATED).send(basket);
});

const addItemMe = catchAsync(async (req, res) => {
  const userId = (req.user as { id: number }).id;
  const current = await basketService.getOrCreateUserBasket(userId);
  const basket = await basketService.addItemToBasket(current.basketId, {
    productId: req.body.productId,
    sizeId: req.body.sizeId,
    quantity: req.body.quantity,
  });
  res.status(httpStatus.CREATED).send(basket);
});

const updateItem = catchAsync(async (req, res) => {
  const basket = await basketService.updateItemQuantity(
    req.params.basketId,
    Number(req.params.itemId),
    req.body.quantity,
  );
  res.send(basket);
});

const updateItemMe = catchAsync(async (req, res) => {
  const userId = (req.user as { id: number }).id;
  const current = await basketService.getOrCreateUserBasket(userId);
  const basket = await basketService.updateItemQuantity(
    current.basketId,
    Number(req.params.itemId),
    req.body.quantity,
  );
  res.send(basket);
});

const removeItem = catchAsync(async (req, res) => {
  const basket = await basketService.removeItem(
    req.params.basketId,
    Number(req.params.itemId),
  );
  res.send(basket);
});

const removeItemMe = catchAsync(async (req, res) => {
  const userId = (req.user as { id: number }).id;
  const current = await basketService.getOrCreateUserBasket(userId);
  const basket = await basketService.removeItem(
    current.basketId,
    Number(req.params.itemId),
  );
  res.send(basket);
});

const merge = catchAsync(async (req, res) => {
  const userId = (req.user as { id: number }).id;
  const basket = await basketService.mergeGuestBasket(
    userId,
    req.body.guestBasketId,
  );
  res.send(basket);
});

export default {
  createBasket,
  getBasket,
  getMyBasket,
  addItem,
  addItemMe,
  updateItem,
  updateItemMe,
  removeItem,
  removeItemMe,
  merge,
};