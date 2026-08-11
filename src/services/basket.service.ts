import httpStatus from "http-status";
import { Prisma } from "../generated/prisma";
import prisma from "../client";
import ApiError from "../utils/ApiError";
import flashDealService, { computeFinalPrice } from "./flashDeal.service";
import { DiscountType } from "../types/flashDeal";
import {
  AddBasketItemInput,
  BasketItemResponse,
  BasketResponse,
} from "../types/basket";

type BasketItemRow = {
  basketId: string;
  productId: number;
  title: string;
  sizeLabel: string;
  price: Prisma.Decimal | number;
  originalPrice: Prisma.Decimal | number;
  discountType: string | null;
  discountValue: Prisma.Decimal | number | null;
  quantity: number;
};

const toNumber = (value: Prisma.Decimal | number) => Number(value);

const createBasketId = () =>
  `basket-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const mapItem = (row: BasketItemRow): BasketItemResponse => {
  const item: BasketItemResponse = {
    basketId: row.basketId,
    productId: row.productId,
    title: row.title,
    sizeLabel: row.sizeLabel,
    price: toNumber(row.price),
    originalPrice: toNumber(row.originalPrice),
    quantity: row.quantity,
    customizations: undefined,
  };

  if (row.discountType) {
    item.discountType = row.discountType as DiscountType;
    item.discountValue = row.discountValue != null ? toNumber(row.discountValue) : 0;
  }

  return item;
};

const toBasketResponse = (
  basketId: string,
  items: BasketItemRow[],
): BasketResponse => ({
  basketId,
  items: items.map(mapItem),
});

/** Resolve final price from menu size + active flash deal */
const resolvePricing = async (productId: number, sizeId: string) => {
  const menuItem = await prisma.menuItem.findUnique({
    where: { id: productId },
    include: { sizes: true },
  });

  if (!menuItem) {
    throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
  }

  const size = menuItem.sizes.find((s) => s.id === sizeId);
  if (!size) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid size for this product");
  }

  const dealsByItem = await flashDealService.getActiveDealsByMenuItemId();
  const deals = dealsByItem.get(menuItem.id) ?? [];
  const deal =
    deals.find((d) => d.sizeId === size.id) ??
    deals.find((d) => d.sizeId == null);

  const originalPrice = toNumber(size.price);
  let discountType: DiscountType | null = size.discountType as DiscountType | null;
  let discountValue: number | null = size.discountValue
    ? toNumber(size.discountValue)
    : null;

  // Flash deal overrides static size discount (same rule as menu.service)
  if (deal) {
    discountType = deal.discountType as DiscountType;
    discountValue = toNumber(deal.discountValue);
  }

  const price =
    discountType && discountValue != null
      ? computeFinalPrice(originalPrice, discountType, discountValue)
      : originalPrice;

  return {
    menuItem,
    size,
    title: menuItem.title,
    sizeLabel: size.label,
    originalPrice,
    price,
    discountType,
    discountValue,
  };
};

const createGuestBasket = async (): Promise<BasketResponse> => {
  const basket = await prisma.basket.create({
    data: { id: createBasketId() },
  });
  return toBasketResponse(basket.id, []);
};

const getBasketById = async (basketId: string): Promise<BasketResponse> => {
  const basket = await prisma.basket.findUnique({
    where: { id: basketId },
    include: { items: true },
  });

  if (!basket) {
    throw new ApiError(httpStatus.NOT_FOUND, "Basket not found");
  }

  return toBasketResponse(basket.id, basket.items);
};

const getOrCreateUserBasket = async (userId: number): Promise<BasketResponse> => {
  let basket = await prisma.basket.findUnique({
    where: { userId },
    include: { items: true },
  });

  if (!basket) {
    basket = await prisma.basket.create({
      data: { id: createBasketId(), userId },
      include: { items: true },
    });
  }

  return toBasketResponse(basket.id, basket.items);
};

const addItemToBasket = async (
  basketId: string,
  input: AddBasketItemInput,
): Promise<BasketResponse> => {
  const quantity = input.quantity ?? 1;
  if (quantity < 1) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Quantity must be at least 1");
  }

  const basket = await prisma.basket.findUnique({ where: { id: basketId } });
  if (!basket) {
    throw new ApiError(httpStatus.NOT_FOUND, "Basket not found");
  }

  const pricing = await resolvePricing(input.productId, input.sizeId);

  const existing = await prisma.basketItem.findUnique({
    where: {
      basketId_productId_sizeId: {
        basketId,
        productId: input.productId,
        sizeId: input.sizeId,
      },
    },
  });

  if (existing) {
    await prisma.basketItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    });
  } else {
    await prisma.basketItem.create({
      data: {
        basketId,
        productId: input.productId,
        sizeId: input.sizeId,
        sizeLabel: pricing.sizeLabel,
        title: pricing.title,
        price: pricing.price,
        originalPrice: pricing.originalPrice,
        discountType: pricing.discountType,
        discountValue: pricing.discountValue,
        quantity,
      },
    });
  }

  return getBasketById(basketId);
};

const updateItemQuantity = async (
  basketId: string,
  itemId: number,
  quantity: number,
): Promise<BasketResponse> => {
  if (quantity < 1) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Quantity must be at least 1");
  }

  const item = await prisma.basketItem.findFirst({
    where: { id: itemId, basketId },
  });
  if (!item) {
    throw new ApiError(httpStatus.NOT_FOUND, "Basket item not found");
  }

  await prisma.basketItem.update({
    where: { id: item.id },
    data: { quantity },
  });

  return getBasketById(basketId);
};

const removeItem = async (
  basketId: string,
  itemId: number,
): Promise<BasketResponse> => {
  const item = await prisma.basketItem.findFirst({
    where: { id: itemId, basketId },
  });
  if (!item) {
    throw new ApiError(httpStatus.NOT_FOUND, "Basket item not found");
  }

  await prisma.basketItem.delete({ where: { id: item.id } });
  return getBasketById(basketId);
};

/**
 * Merge guest basket into the logged-in user's basket.
 * Call this right after verify-otp / register.
 */
const mergeGuestBasket = async (
  userId: number,
  guestBasketId: string,
): Promise<BasketResponse> => {
  const guest = await prisma.basket.findUnique({
    where: { id: guestBasketId },
    include: { items: true },
  });

  // No guest basket → just return/create user basket
  if (!guest) {
    return getOrCreateUserBasket(userId);
  }

  if (guest.userId != null) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Not a guest basket");
  }

  const existingUserBasket = await prisma.basket.findUnique({
    where: { userId },
    include: { items: true },
  });

  // User has no basket yet → claim the guest basket
  if (!existingUserBasket) {
    const claimed = await prisma.basket.update({
      where: { id: guest.id },
      data: { userId },
      include: { items: true },
    });
    return toBasketResponse(claimed.id, claimed.items);
  }

  // Both exist → merge quantities, then delete guest
  await prisma.$transaction(async (tx) => {
    for (const item of guest.items) {
      const existing = await tx.basketItem.findUnique({
        where: {
          basketId_productId_sizeId: {
            basketId: existingUserBasket.id,
            productId: item.productId,
            sizeId: item.sizeId,
          },
        },
      });

      if (existing) {
        await tx.basketItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + item.quantity },
        });
      } else {
        await tx.basketItem.create({
          data: {
            basketId: existingUserBasket.id,
            productId: item.productId,
            sizeId: item.sizeId,
            sizeLabel: item.sizeLabel,
            title: item.title,
            price: item.price,
            originalPrice: item.originalPrice,
            discountType: item.discountType,
            discountValue: item.discountValue,
            quantity: item.quantity,
          },
        });
      }
    }

    await tx.basket.delete({ where: { id: guest.id } });
  });

  return getOrCreateUserBasket(userId);
};

export default {
  createGuestBasket,
  getBasketById,
  getOrCreateUserBasket,
  addItemToBasket,
  updateItemQuantity,
  removeItem,
  mergeGuestBasket,
};