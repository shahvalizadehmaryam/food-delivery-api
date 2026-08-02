import prisma from "../client";
import { MenuSection, MenuItemSize } from "../types/menu";
import flashDealService, {
  computeFinalPrice,
} from "./flashDeal.service";
import { DiscountType } from "../types/flashDeal";

type DealRow = {
  id: number;
  sizeId: string | null;
  discountType: string;
  discountValue: { toString(): string } | number;
  endsAt: Date;
};

/**
 * Pick the best matching active deal for a size:
 * 1) size-specific deal (sizeId === size.id)
 * 2) else item-wide deal (sizeId === null)
 */
const pickDealForSize = (deals: DealRow[] | undefined, sizeId: string) => {
  if (!deals?.length) return undefined;
  const specific = deals.find((d) => d.sizeId === sizeId);
  if (specific) return specific;
  return deals.find((d) => d.sizeId == null);
};

const mapSize = (
  size: {
    id: string;
    label: string;
    price: { toString(): string } | number;
    discountType: string | null;
    discountValue: { toString(): string } | number | null;
  },
  itemDeals: DealRow[] | undefined,
): MenuItemSize => {
  const price = Number(size.price);
  const deal = pickDealForSize(itemDeals, size.id);

  // Flash deal wins over the static size discount while it is live
  if (deal) {
    const discountType = deal.discountType as DiscountType;
    const discountValue = Number(deal.discountValue);
    return {
      id: size.id,
      label: size.label,
      price,
      discountType,
      discountValue,
      finalPrice: computeFinalPrice(price, discountType, discountValue),
      flashDeal: {
        id: deal.id,
        endsAt: deal.endsAt,
      },
    };
  }

  // Fall back to permanent discount on MenuItemSize (if any)
  const base: MenuItemSize = {
    id: size.id,
    label: size.label,
    price,
  };

  if (size.discountType) {
    const discountType = size.discountType as DiscountType;
    const discountValue = size.discountValue ? Number(size.discountValue) : 0;
    base.discountType = discountType;
    base.discountValue = discountValue;
    base.finalPrice = computeFinalPrice(price, discountType, discountValue);
  }

  return base;
};

/**
 * Fetches the full menu and merges any active flash deals into size prices.
 * Sections are ordered by sortOrder; items by id.
 */
const getMenu = async (): Promise<MenuSection[]> => {
  const [sections, dealsByItem] = await Promise.all([
    prisma.menuSection.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        items: {
          include: { sizes: true },
          orderBy: { id: "asc" },
        },
      },
    }),
    flashDealService.getActiveDealsByMenuItemId(),
  ]);

  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    items: section.items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      image: item.image,
      sizes: item.sizes.map((size) =>
        mapSize(size, dealsByItem.get(item.id)),
      ),
    })),
  }));
};

export default { getMenu };
