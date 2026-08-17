import { Role } from "../src/generated/prisma";
import prisma from "../src/client";
import tokenService from "../src/services/token.service";
import basketService from "../src/services/basket.service";
import orderService from "../src/services/order.service";

const USER = {
  phone: "4155552671",
  name: "Mary-Jane",
  lastname: "O'Brien",
  state: "CA",
  city: "Los Angeles",
  address: "123 Main Street",
  dob: new Date("2000-01-15"),
  role: Role.USER,
};

const ADMIN = {
  phone: "4155559999",
  name: "Alex",
  lastname: "Admin",
  state: "CA",
  city: "San Francisco",
  address: "1 Market Street",
  dob: new Date("1990-06-01"),
  role: Role.ADMIN,
};

const upsertUser = async (data: typeof USER) => {
  return prisma.user.upsert({
    where: { phone: data.phone },
    update: {
      name: data.name,
      lastname: data.lastname,
      state: data.state,
      city: data.city,
      address: data.address,
      dob: data.dob,
      role: data.role,
      isBlocked: false,
    },
    create: data,
  });
};

const pickSizeId = (sizes: Array<{ id: string }>) =>
  sizes.find((size) => size.id === "medium")?.id ?? sizes[0]?.id;

async function main() {
  const menuItems = await prisma.menuItem.findMany({
    include: { sizes: true },
    orderBy: { id: "asc" },
    take: 3,
  });

  if (menuItems.length === 0) {
    throw new Error(
      'Menu is empty. Run first: npx tsx scripts/seed-menu.ts',
    );
  }

  const user = await upsertUser(USER);
  const admin = await upsertUser(ADMIN);

  const [userTokens, adminTokens] = await Promise.all([
    tokenService.generateAuthTokens(user),
    tokenService.generateAuthTokens(admin),
  ]);

  const basket = await basketService.getOrCreateUserBasket(user.id);

  const orderLines = menuItems.map((item, index) => ({
    productId: item.id,
    sizeId: pickSizeId(item.sizes),
    quantity: index + 1,
  }));

  if (orderLines.some((line) => !line.sizeId)) {
    throw new Error("A menu item is missing sizes");
  }

  for (const line of orderLines) {
    await basketService.addItemToBasket(basket.basketId, {
      productId: line.productId,
      sizeId: line.sizeId as string,
      quantity: line.quantity,
    });
  }

  const order = await orderService.placeOrder(user.id, {
    note: "Seeded demo order",
    deliveryAddress: user.address ?? "123 Main Street",
  });

  const remainingBasket = await basketService.getOrCreateUserBasket(user.id);

  console.log(
    JSON.stringify(
      {
        user: { id: user.id, phone: user.phone, role: user.role, tokens: userTokens },
        admin: { id: admin.id, phone: admin.phone, role: admin.role, tokens: adminTokens },
        order,
        basketAfterOrder: remainingBasket,
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
