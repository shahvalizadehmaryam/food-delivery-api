import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync";
import flashDealService from "../services/flashDeal.service";
import { DiscountType } from "../types/flashDeal";

/** GET /v1/flash-deals — public list of deals live right now */
const getActiveFlashDeals = catchAsync(async (_req, res) => {
  const deals = await flashDealService.getActiveFlashDeals();
  res.send(deals);
});

/** GET /v1/admin/flash-deals — all deals (admin) */
const getAllFlashDeals = catchAsync(async (_req, res) => {
  const deals = await flashDealService.getAllFlashDeals();
  res.send(deals);
});

/** GET /v1/admin/flash-deals/:id */
const getFlashDeal = catchAsync(async (req, res) => {
  const deal = await flashDealService.getFlashDealById(Number(req.params.id));
  res.send(deal);
});

/** POST /v1/admin/flash-deals */
const createFlashDeal = catchAsync(async (req, res) => {
  const deal = await flashDealService.createFlashDeal({
    menuItemId: req.body.menuItemId,
    sizeId: req.body.sizeId,
    discountType: req.body.discountType as DiscountType,
    discountValue: req.body.discountValue,
    startsAt: req.body.startsAt,
    endsAt: req.body.endsAt,
    durationHours: req.body.durationHours,
  });
  res.status(httpStatus.CREATED).send(deal);
});

/** PATCH /v1/admin/flash-deals/:id */
const updateFlashDeal = catchAsync(async (req, res) => {
  const deal = await flashDealService.updateFlashDealById(
    Number(req.params.id),
    req.body,
  );
  res.send(deal);
});

/** DELETE /v1/admin/flash-deals/:id */
const deleteFlashDeal = catchAsync(async (req, res) => {
  await flashDealService.deleteFlashDealById(Number(req.params.id));
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  getActiveFlashDeals,
  getAllFlashDeals,
  getFlashDeal,
  createFlashDeal,
  updateFlashDeal,
  deleteFlashDeal,
};
