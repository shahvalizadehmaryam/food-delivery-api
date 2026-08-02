/**
 * Seeds 6 active flash deals from the existing menu list.
 * Run after seed-menu.ts so menu items 1–18 exist.
 *
 * Usage: npx tsx scripts/seed-flash-deals.ts
 */
import prisma from "../src/client";

const DURATION_HOURS = 4;

/** 6 deals: 2 burgers, 2 fries, 2 cold drinks — medium size only */
const FLASH_DEALS = [
  {
    menuItemId: 1,
    sizeId: "medium",
    discountType: "percentage",
    discountValue: 25,
  },
  {
    menuItemId: 2,
    sizeId: "medium",
    discountType: "fixed",
    discountValue: 4,
  },
  {
    menuItemId: 7,
    sizeId: "medium",
    discountType: "percentage",
    discountValue: 20,
  },
  {
    menuItemId: 8,
    sizeId: "medium",
    discountType: "fixed",
    discountValue: 3,
  },
  {
    menuItemId: 13,
    sizeId: "medium",
    discountType: "percentage",
    discountValue: 30,
  },
  {
    menuItemId: 14,
    sizeId: "medium",
    discountType: "fixed",
    discountValue: 5,
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
      menuItem: { select: { id: true, title: true } },
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
