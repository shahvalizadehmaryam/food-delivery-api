import prisma from '../src/client';

type Discount = {
  discountType: 'percentage' | 'fixed';
  discountValue: number;
};

type SeedMenuItem = {
  id: number;
  title: string;
  description: string;
  image: string;
  mediumPrice: number;
  discount?: Discount;
};

const SECTIONS = [
  { id: 'burgers', title: 'Burgers', sortOrder: 0 },
  { id: 'fries', title: 'Fries', sortOrder: 1 },
  { id: 'cold-drinks', title: 'Cold Drinks', sortOrder: 2 },
] as const;

const DESCRIPTION =
  '1 McChicken™, 1 Big Mac™, 1 Royal Cheeseburger, 3 medium sized French Fries, 3 cold drinks';

const burgers: SeedMenuItem[] = [
  {
    id: 1,
    title: 'Royal Cheese Burger with extra Fries',
    description: DESCRIPTION,
    image: '/images/menu/burger/burger-1.svg',
    mediumPrice: 23.1,
    discount: { discountType: 'percentage', discountValue: 10 },
  },
  {
    id: 2,
    title: 'The classics for 3',
    description: DESCRIPTION,
    image: '/images/menu/burger/burger-2.svg',
    mediumPrice: 26.6,
    discount: { discountType: 'fixed', discountValue: 5 },
  },
  {
    id: 3,
    title: 'Royal Cheese Burger with extra Fries',
    description: DESCRIPTION,
    image: '/images/menu/burger/burger-3.svg',
    mediumPrice: 25.12,
    discount: { discountType: 'percentage', discountValue: 15 },
  },
  {
    id: 4,
    title: 'The classics for 2',
    description: DESCRIPTION,
    image: '/images/menu/burger/burger-4.svg',
    mediumPrice: 27.6,
    discount: { discountType: 'fixed', discountValue: 3 },
  },
  {
    id: 5,
    title: 'Royal Cheese Burger with extra Fries',
    description: DESCRIPTION,
    image: '/images/menu/burger/burger-5.svg',
    mediumPrice: 21.12,
    discount: { discountType: 'percentage', discountValue: 10 },
  },
  {
    id: 6,
    title: 'Royal Cheese Burger with extra Fries',
    description: DESCRIPTION,
    image: '/images/menu/burger/burger-6.svg',
    mediumPrice: 17.4,
    discount: { discountType: 'fixed', discountValue: 2 },
  },
];

const fries: SeedMenuItem[] = [
  {
    id: 7,
    title: 'Royal Cheese Burger with extra Fries',
    description: DESCRIPTION,
    image: '/images/menu/fries/fries-1.svg',
    mediumPrice: 23.1,
    discount: { discountType: 'percentage', discountValue: 10 },
  },
  {
    id: 8,
    title: 'The classics for 3',
    description: DESCRIPTION,
    image: '/images/menu/fries/fries-2.svg',
    mediumPrice: 26.6,
    discount: { discountType: 'fixed', discountValue: 5 },
  },
  {
    id: 9,
    title: 'Royal Cheese Burger with extra Fries',
    description: DESCRIPTION,
    image: '/images/menu/fries/fries-3.svg',
    mediumPrice: 25.12,
    discount: { discountType: 'percentage', discountValue: 15 },
  },
  {
    id: 10,
    title: 'The classics for 2',
    description: DESCRIPTION,
    image: '/images/menu/fries/fries-4.svg',
    mediumPrice: 27.6,
    discount: { discountType: 'fixed', discountValue: 3 },
  },
  {
    id: 11,
    title: 'Royal Cheese Burger with extra Fries',
    description: DESCRIPTION,
    image: '/images/menu/fries/fries-5.svg',
    mediumPrice: 21.12,
    discount: { discountType: 'percentage', discountValue: 10 },
  },
  {
    id: 12,
    title: 'Royal Cheese Burger with extra Fries',
    description: DESCRIPTION,
    image: '/images/menu/fries/fries-6.svg',
    mediumPrice: 17.4,
    discount: { discountType: 'fixed', discountValue: 2 },
  },
];

const coldDrinks: SeedMenuItem[] = [
  {
    id: 13,
    title: 'Royal Cheese Burger with extra Fries',
    description: DESCRIPTION,
    image: '/images/menu/cold-drinks/cold-drink-1.svg',
    mediumPrice: 23.1,
    discount: { discountType: 'percentage', discountValue: 10 },
  },
  {
    id: 14,
    title: 'The classics for 3',
    description: DESCRIPTION,
    image: '/images/menu/cold-drinks/cold-drink-2.svg',
    mediumPrice: 26.6,
    discount: { discountType: 'fixed', discountValue: 5 },
  },
  {
    id: 15,
    title: 'Royal Cheese Burger with extra Fries',
    description: DESCRIPTION,
    image: '/images/menu/cold-drinks/cold-drink-3.svg',
    mediumPrice: 25.12,
    discount: { discountType: 'percentage', discountValue: 15 },
  },
  {
    id: 16,
    title: 'The classics for 2',
    description: DESCRIPTION,
    image: '/images/menu/cold-drinks/cold-drink-4.svg',
    mediumPrice: 27.6,
    discount: { discountType: 'fixed', discountValue: 3 },
  },
  {
    id: 17,
    title: 'Royal Cheese Burger with extra Fries',
    description: DESCRIPTION,
    image: '/images/menu/cold-drinks/cold-drink-5.svg',
    mediumPrice: 21.12,
    discount: { discountType: 'percentage', discountValue: 10 },
  },
  {
    id: 18,
    title: 'Royal Cheese Burger with extra Fries',
    description: DESCRIPTION,
    image: '/images/menu/cold-drinks/cold-drink-6.svg',
    mediumPrice: 17.4,
    discount: { discountType: 'fixed', discountValue: 2 },
  },
];

const MENU_BY_SECTION = {
  burgers,
  fries,
  'cold-drinks': coldDrinks,
} as const;

// Mirrors frontend createMenuItem(): medium is the base price; small/large are derived.
const SIZE_MULTIPLIERS = {
  small: 0.85,
  medium: 1,
  large: 1.15,
} as const;

const roundPrice = (value: number) => Math.round(value * 100) / 100;

const buildSizes = (mediumPrice: number, discount?: Discount) =>
  (['small', 'medium', 'large'] as const).map((size) => ({
    id: size,
    label: size.charAt(0).toUpperCase() + size.slice(1),
    price: roundPrice(mediumPrice * SIZE_MULTIPLIERS[size]),
    ...(size === 'medium' && discount
      ? {
          discountType: discount.discountType,
          discountValue: discount.discountValue,
        }
      : {}),
  }));

async function main() {
  await prisma.menuItemSize.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuSection.deleteMany();

  const results = [];

  for (const section of SECTIONS) {
    const createdSection = await prisma.menuSection.create({
      data: {
        id: section.id,
        title: section.title,
        sortOrder: section.sortOrder,
        items: {
          create: MENU_BY_SECTION[section.id].map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            image: item.image,
            sizes: {
              create: buildSizes(item.mediumPrice, item.discount),
            },
          })),
        },
      },
      include: {
        items: {
          include: { sizes: true },
          orderBy: { id: 'asc' },
        },
      },
    });

    results.push(createdSection);
  }

  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"MenuItem"', 'id'), (SELECT COALESCE(MAX(id), 1) FROM "MenuItem"))`,
  );

  console.log(
    JSON.stringify(
      {
        sections: results.length,
        items: results.reduce((count, section) => count + section.items.length, 0),
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
