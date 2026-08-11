import httpStatus from "http-status";
import { Prisma } from "../generated/prisma";
import prisma from "../client";
import ApiError from "../utils/ApiError";
import { DiscountType, FlashDeal } from "../types/flashDeal";

type CreateFlashDealInput = {
  menuItemId: number;
  sizeId?: string | null;
  discountType: DiscountType;
  discountValue: number;
  startsAt?: Date | string;
  endsAt?: Date | string;
  durationHours?: number;
};

type UpdateFlashDealInput = {
  sizeId?: string | null;
  discountType?: DiscountType;
  discountValue?: number;
  startsAt?: Date | string;
  endsAt?: Date | string;
  isActive?: boolean;
};

/** Convert Prisma FlashDeal (Decimal) → plain JSON-friendly object */
const toFlashDeal = (
  deal: {
    id: number;
    menuItemId: number;
    sizeId: string | null;
    discountType: string;
    discountValue: Prisma.Decimal;
    startsAt: Date;
    endsAt: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    menuItem?: { id: number; title: string; image: string };
  },
): FlashDeal => ({
  id: deal.id,
  menuItemId: deal.menuItemId,
  sizeId: deal.sizeId,
  discountType: deal.discountType as DiscountType,
  discountValue: Number(deal.discountValue),
  startsAt: deal.startsAt,
  endsAt: deal.endsAt,
  isActive: deal.isActive,
  createdAt: deal.createdAt,
  updatedAt: deal.updatedAt,
  ...(deal.menuItem && { menuItem: deal.menuItem }),
});

/** Apply discount to a base price; never go below 0 */
export const computeFinalPrice = (
  price: number,
  discountType: DiscountType,
  discountValue: number,
): number => {
  if (discountType === "percentage") {
    return Math.max(0, Math.round(price * (1 - discountValue / 100) * 100) / 100);
  }
  return Math.max(0, Math.round((price - discountValue) * 100) / 100);
};

/** Prisma filter for deals that are live right now */
export const activeDealWhere = (now = new Date()): Prisma.FlashDealWhereInput => ({
  isActive: true,
  startsAt: { lte: now },
  endsAt: { gt: now },
});

const includeMenuItem = {
  menuItem: { select: { id: true, title: true, image: true } },
} as const;

/**
 * Resolve startsAt / endsAt from either explicit dates or durationHours.
 * Example: durationHours: 4 → ends 4 hours after startsAt (default: now).
 */
const resolveWindow = (input: CreateFlashDealInput) => {
  const startsAt = input.startsAt ? new Date(input.startsAt) : new Date();
  let endsAt: Date;

  if (input.durationHours != null) {
    endsAt = new Date(startsAt.getTime() + input.durationHours * 60 * 60 * 1000);
  } else if (input.endsAt) {
    endsAt = new Date(input.endsAt);
  } else {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Provide either durationHours or endsAt",
    );
  }

  if (endsAt <= startsAt) {
    throw new ApiError(httpStatus.BAD_REQUEST, "endsAt must be after startsAt");
  }

  return { startsAt, endsAt };
};

/** Ensure the menu item (and optional size) exist before creating a deal */
const assertMenuTargetExists = async (
  menuItemId: number,
  sizeId?: string | null,
) => {
  const item = await prisma.menuItem.findUnique({
    where: { id: menuItemId },
    include: { sizes: true },
  });

  if (!item) {
    throw new ApiError(httpStatus.NOT_FOUND, "Menu item not found");
  }

  if (sizeId) {
    const sizeExists = item.sizes.some((s) => s.id === sizeId);
    if (!sizeExists) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Size "${sizeId}" does not exist on this menu item`,
      );
    }
  }

  return item;
};

/**
 * Block overlapping active deals for the same item + size scope.
 * Keeps pricing unambiguous for the customer.
 */
const assertNoOverlap = async (
  menuItemId: number,
  sizeId: string | null,
  startsAt: Date,
  endsAt: Date,
  excludeId?: number,
) => {
  const overlapping = await prisma.flashDeal.findFirst({
    where: {
      menuItemId,
      isActive: true,
      ...(excludeId ? { id: { not: excludeId } } : {}),
      // Same scope: both null (all sizes) or same sizeId
      sizeId: sizeId ?? null,
      // Time ranges overlap if A.starts < B.ends AND A.ends > B.starts
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
  });

  if (overlapping) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "An active flash deal already overlaps this time window for the same item/size",
    );
  }
};

const createFlashDeal = async (input: CreateFlashDealInput): Promise<FlashDeal> => {
  const sizeId = input.sizeId ?? null;
  await assertMenuTargetExists(input.menuItemId, sizeId);
  const { startsAt, endsAt } = resolveWindow(input);
  await assertNoOverlap(input.menuItemId, sizeId, startsAt, endsAt);

  const deal = await prisma.flashDeal.create({
    data: {
      menuItemId: input.menuItemId,
      sizeId,
      discountType: input.discountType,
      discountValue: input.discountValue,
      startsAt,
      endsAt,
    },
    include: includeMenuItem,
  });

  return toFlashDeal(deal);
};

/** Public: only deals that are live right now */
const getActiveFlashDeals = async (): Promise<FlashDeal[]> => {
  const deals = await prisma.flashDeal.findMany({
    where: activeDealWhere(),
    include: includeMenuItem,
    orderBy: { endsAt: "asc" },
  });
  return deals.map(toFlashDeal);
};

/** Admin: all deals (active, upcoming, expired) */
const getAllFlashDeals = async (): Promise<FlashDeal[]> => {
  const deals = await prisma.flashDeal.findMany({
    include: includeMenuItem,
    orderBy: { startsAt: "desc" },
  });
  return deals.map(toFlashDeal);
};

const getFlashDealById = async (id: number): Promise<FlashDeal> => {
  const deal = await prisma.flashDeal.findUnique({
    where: { id },
    include: includeMenuItem,
  });
  if (!deal) {
    throw new ApiError(httpStatus.NOT_FOUND, "Flash deal not found");
  }
  return toFlashDeal(deal);
};

const updateFlashDealById = async (
  id: number,
  input: UpdateFlashDealInput,
): Promise<FlashDeal> => {
  const existing = await prisma.flashDeal.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Flash deal not found");
  }

  const sizeId =
    input.sizeId !== undefined ? input.sizeId : existing.sizeId;
  const startsAt = input.startsAt
    ? new Date(input.startsAt)
    : existing.startsAt;
  const endsAt = input.endsAt ? new Date(input.endsAt) : existing.endsAt;

  if (endsAt <= startsAt) {
    throw new ApiError(httpStatus.BAD_REQUEST, "endsAt must be after startsAt");
  }

  if (sizeId !== existing.sizeId) {
    await assertMenuTargetExists(existing.menuItemId, sizeId);
  }

  const willBeActive = input.isActive ?? existing.isActive;
  if (willBeActive) {
    await assertNoOverlap(existing.menuItemId, sizeId, startsAt, endsAt, id);
  }

  const deal = await prisma.flashDeal.update({
    where: { id },
    data: {
      ...(input.sizeId !== undefined && { sizeId }),
      ...(input.discountType !== undefined && {
        discountType: input.discountType,
      }),
      ...(input.discountValue !== undefined && {
        discountValue: input.discountValue,
      }),
      ...(input.startsAt !== undefined && { startsAt }),
      ...(input.endsAt !== undefined && { endsAt }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
    include: includeMenuItem,
  });

  return toFlashDeal(deal);
};

const deleteFlashDealById = async (id: number): Promise<void> => {
  const existing = await prisma.flashDeal.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Flash deal not found");
  }
  await prisma.flashDeal.delete({ where: { id } });
};

/**
 * Load all currently active deals keyed by menuItemId.
 * Used by menu.service to merge deals into size prices in one query.
 */
const getActiveDealsByMenuItemId = async () => {
  const deals = await prisma.flashDeal.findMany({
    where: activeDealWhere(),
  });

  const map = new Map<number, typeof deals>();
  for (const deal of deals) {
    const list = map.get(deal.menuItemId) ?? [];
    list.push(deal);
    map.set(deal.menuItemId, list);
  }
  return map;
};

export default {
  createFlashDeal,
  getActiveFlashDeals,
  getAllFlashDeals,
  getFlashDealById,
  updateFlashDealById,
  deleteFlashDealById,
  getActiveDealsByMenuItemId,
  computeFinalPrice,
};
