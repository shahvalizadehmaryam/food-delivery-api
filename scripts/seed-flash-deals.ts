/**
 * Seeds 6 active "Today's Exclusive Deals" from the US menu.
 * Run after seed-menu.ts so menu items 1–18 exist.
 *
 * Usage: npx tsx scripts/seed-flash-deals.ts
 */
import prisma from "../src/client";

const DURATION_HOURS = 8;

/**
 * Exclusive deals mix — popular US items with promo-style discounts.
 * Titles/images/descriptions come from MenuItem (seed-menu.ts).
 */
const FLASH_DEALS = [
  {
    menuItemId: 1, // Classic American Cheeseburger
    sizeId: "medium",
    discountType: "percentage",
    discountValue: 20,
  },
  {
    menuItemId: 3, // Double Smash Burger
    sizeId: "medium",
    discountType: "percentage",
    discountValue: 25,
  },
  {
    menuItemId: 5, // BBQ Ranch Burger
    sizeId: "medium",
    discountType: "fixed",
    discountValue: 2,
  },
  {
    menuItemId: 9, // Chili Cheese Fries
    sizeId: "medium",
    discountType: "percentage",
    discountValue: 30,
  },
  {
    menuItemId: 12, // Crispy Onion Rings
    sizeId: "medium",
    discountType: "fixed",
    discountValue: 1,
  },
  {
    menuItemId: 16, // Chocolate Milkshake
    sizeId: "medium",
    discountType: "percentage",
    discountValue: 20,
  },
] as const;

async function main() {
  const itemIds = FLASH_DEALS.map((d) => d.menuItemId);
  const existing = await prisma.menuItem.findMany({
    where: { id: { in: [...itemIds] } },
    select: { id: true, title: true },
  });

  if (existing.length !== itemIds.length) {
    const found = new Set(existing.map((i) => i.id));
    const missing = itemIds.filter((id) => !found.has(id));
    throw new Error(
      `Missing menu items: ${missing.join(", ")}. Run: npx tsx scripts/seed-menu.ts`,
    );
  }

  // Replace any previous flash deals so re-running is safe
  await prisma.flashDeal.deleteMany();

  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + DURATION_HOURS * 60 * 60 * 1000);

  const created = await prisma.flashDeal.createMany({
    data: FLASH_DEALS.map((deal) => ({
      menuItemId: deal.menuItemId,
      sizeId: deal.sizeId,
      discountType: deal.discountType,
      discountValue: deal.discountValue,
      startsAt,
      endsAt,
      isActive: true,
    })),
  });

  const deals = await prisma.flashDeal.findMany({
    include: {
      menuItem: { select: { id: true, title: true, description: true, image: true } },
    },
    orderBy: { menuItemId: "asc" },
  });

  console.log(
    JSON.stringify(
      {
        created: created.count,
        durationHours: DURATION_HOURS,
        startsAt,
        endsAt,
        deals: deals.map((d) => ({
          id: d.id,
          menuItemId: d.menuItemId,
          title: d.menuItem.title,
          description: d.menuItem.description,
          image: d.menuItem.image,
          sizeId: d.sizeId,
          discountType: d.discountType,
          discountValue: Number(d.discountValue),
        })),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
