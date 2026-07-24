import prisma from "../client";
import { MenuSection } from "../types/menu";

/**
 * Fetches the full menu from the database and shapes it for the API response.
 * Sections are ordered by sortOrder; items by id.
 */
const getMenu = async (): Promise<MenuSection[]> => {
  const sections = await prisma.menuSection.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        include: { sizes: true },
        orderBy: { id: "asc" },
      },
    },
  });

  // Map Prisma rows → MenuSection[] (Decimal fields become plain numbers for JSON)
  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    items: section.items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      image: item.image,
      sizes: item.sizes.map((size) => ({
        id: size.id,
        label: size.label,
        price: Number(size.price),
        ...(size.discountType && {
          discountType: size.discountType as "percentage" | "fixed",
          discountValue: size.discountValue
            ? Number(size.discountValue)
            : undefined,
        }),
      })),
    })),
  }));
};

export default { getMenu };
