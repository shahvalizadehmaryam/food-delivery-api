import httpStatus from "http-status";
import { OrderStatus } from "../generated/prisma";
import catchAsync from "../utils/catchAsync";
import orderService from "../services/order.service";

const placeOrder = catchAsync(async (req, res) => {
  const userId = (req.user as { id: number }).id;
  const order = await orderService.placeOrder(userId, {
    note: req.body.note,
    deliveryAddress: req.body.deliveryAddress,
  });
  res.status(httpStatus.CREATED).send(order);
});

const listMyOrders = catchAsync(async (req, res) => {
  const userId = (req.user as { id: number }).id;
  const status = req.query.status as OrderStatus | undefined;
  const orders = await orderService.listMyOrders(userId, status);
  res.send(orders);
});

const getMyOrder = catchAsync(async (req, res) => {
  const userId = (req.user as { id: number }).id;
  const order = await orderService.getMyOrder(userId, Number(req.params.orderId));
  res.send(order);
});

const cancelMyOrder = catchAsync(async (req, res) => {
  const userId = (req.user as { id: number }).id;
  const order = await orderService.cancelMyOrder(
    userId,
    Number(req.params.orderId),
  );
  res.send(order);
});

const listAllOrders = catchAsync(async (req, res) => {
  const status = req.query.status as OrderStatus | undefined;
  const orders = await orderService.listAllOrders(status);
  res.send(orders);
});

const updateStatus = catchAsync(async (req, res) => {
  const order = await orderService.updateOrderStatus(
    Number(req.params.orderId),
    req.body.status as OrderStatus,
  );
  res.send(order);
});

export default {
  placeOrder,
  listMyOrders,
  getMyOrder,
  cancelMyOrder,
  listAllOrders,
  updateStatus,
};
