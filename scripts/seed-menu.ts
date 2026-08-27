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
  { id: 'fries', title: 'Fries & Sides', sortOrder: 1 },
  { id: 'cold-drinks', title: 'Cold Drinks', sortOrder: 2 },
] as const;

const burgers: SeedMenuItem[] = [
  {
    id: 1,
    title: 'Classic American Cheeseburger',
    description:
      'Grilled beef patty, American cheese, lettuce, tomato, pickles, and house sauce on a toasted brioche bun.',
    image:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    mediumPrice: 9.99,
    discount: { discountType: 'percentage', discountValue: 10 },
  },
  {
    id: 2,
    title: 'Bacon Cheeseburger',
    description:
      'Angus beef, smoked bacon, cheddar, caramelized onions, and BBQ mayo on a potato roll.',
    image:
      'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=800&q=80',
    mediumPrice: 11.49,
    discount: { discountType: 'fixed', discountValue: 1.5 },
  },
  {
    id: 3,
    title: 'Double Smash Burger',
    description:
      'Two thin smash patties, American cheese, pickles, diced onion, and smash sauce on a soft bun.',
    image:
      'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80',
    mediumPrice: 12.99,
    discount: { discountType: 'percentage', discountValue: 15 },
  },
  {
    id: 4,
    title: 'Mushroom Swiss Burger',
    description:
      'Beef patty topped with sautéed mushrooms, melted Swiss cheese, and garlic aioli.',
    image:
      'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=800&q=80',
    mediumPrice: 11.99,
    discount: { discountType: 'fixed', discountValue: 1 },
  },
  {
    id: 5,
    title: 'BBQ Ranch Burger',
    description:
      'Flame-grilled beef, cheddar, crispy onion strings, ranch, and smoky BBQ sauce.',
    image:
      'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
    mediumPrice: 10.99,
    discount: { discountType: 'percentage', discountValue: 10 },
  },
  {
    id: 6,
    title: 'Turkey Avocado Burger',
    description:
      'Lean turkey patty, sliced avocado, tomato, spinach, and chipotle mayo on a whole-wheat bun.',
    image:
      'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=800&q=80',
    mediumPrice: 10.49,
    discount: { discountType: 'fixed', discountValue: 0.75 },
  },
];

const fries: SeedMenuItem[] = [
  {
    id: 7,
    title: 'Classic French Fries',
    description: 'Crispy golden fries seasoned with sea salt. Served hot and fresh.',
    image:
      'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80',
    mediumPrice: 3.99,
    discount: { discountType: 'percentage', discountValue: 10 },
  },
  {
    id: 8,
    title: 'Cheese Fries',
    description: 'Crispy fries smothered in melted cheddar cheese sauce.',
    image:
      'https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?auto=format&fit=crop&w=800&q=80',
    mediumPrice: 5.49,
    discount: { discountType: 'fixed', discountValue: 0.5 },
  },
  {
    id: 9,
    title: 'Chili Cheese Fries',
    description: 'Fries topped with hearty beef chili, cheddar, and green onions.',
    image:
      'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=800&q=80',
    mediumPrice: 6.99,
    discount: { discountType: 'percentage', discountValue: 15 },
  },
  {
    id: 10,
    title: 'Sweet Potato Fries',
    description: 'Crispy sweet potato fries with a light cinnamon-salt seasoning. Served with ranch.',
    image:
      'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80',
    mediumPrice: 4.99,
    discount: { discountType: 'fixed', discountValue: 0.5 },
  },
  {
    id: 11,
    title: 'Loaded Bacon Fries',
    description: 'Fries loaded with bacon bits, cheddar, sour cream, and chives.',
    image:
      'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
    mediumPrice: 7.49,
    discount: { discountType: 'percentage', discountValue: 10 },
  },
  {
    id: 12,
    title: 'Crispy Onion Rings',
    description: 'Beer-battered onion rings fried golden brown. Served with zesty dipping sauce.',
    image:
      'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?auto=format&fit=crop&w=800&q=80',
    mediumPrice: 4.79,
    discount: { discountType: 'fixed', discountValue: 0.4 },
  },
];

const coldDrinks: SeedMenuItem[] = [
  {
    id: 13,
    title: 'Coca-Cola',
    description: 'Ice-cold Coca-Cola classic. The all-American fountain favorite.',
    image:
      'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=800&q=80',
    mediumPrice: 2.79,
    discount: { discountType: 'percentage', discountValue: 10 },
  },
  {
    id: 14,
    title: 'Fresh Lemonade',
    description: 'House-made lemonade with fresh lemons and a touch of cane sugar.',
    image:
      'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=800&q=80',
    mediumPrice: 3.49,
    discount: { discountType: 'fixed', discountValue: 0.4 },
  },
  {
    id: 15,
    title: 'Southern Sweet Tea',
    description: 'Classic iced sweet tea, brewed fresh and served over ice.',
    image:
      'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80',
    mediumPrice: 2.99,
    discount: { discountType: 'percentage', discountValue: 15 },
  },
  {
    id: 16,
    title: 'Chocolate Milkshake',
    description: 'Thick hand-spun chocolate milkshake topped with whipped cream.',
    image:
      'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80',
    mediumPrice: 5.49,
    discount: { discountType: 'fixed', discountValue: 0.5 },
  },
  {
    id: 17,
    title: 'Vanilla Milkshake',
    description: 'Creamy vanilla milkshake made with real ice cream.',
    image:
      'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=800&q=80',
    mediumPrice: 5.29,
    discount: { discountType: 'percentage', discountValue: 10 },
  },
  {
    id: 18,
    title: 'Root Beer Float',
    description: 'Chilled root beer poured over a scoop of vanilla ice cream.',
    image:
      'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=800&q=80',
    mediumPrice: 4.99,
    discount: { discountType: 'fixed', discountValue: 0.5 },
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
  // FlashDeal FKs menu items — clear deals before wiping the menu
  await prisma.flashDeal.deleteMany();
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
