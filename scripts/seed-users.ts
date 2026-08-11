import prisma from "../src/client";
import tokenService from "../src/services/token.service";

/**
 * Seeds two accounts matching the API user shape:
 * - USER  → sample profile from Swagger (Mary-Jane)
 * - ADMIN → similar profile with ADMIN role
 *
 * Run: npx tsx scripts/seed-users.ts
 */
const USERS = [
  {
    phone: "4155552671",
    name: "Mary-Jane",
    lastname: "O'Brien",
    state: "CA",
    city: "Los Angeles",
    address: "123 Main Street",
    dob: new Date("2000-01-15"),
    role: "USER" as const,
  },
  {
    phone: "4155559999",
    name: "Alex",
    lastname: "Admin",
    state: "CA",
    city: "San Francisco",
    address: "1 Market Street",
    dob: new Date("1990-06-01"),
    role: "ADMIN" as const,
  },
];

async function main() {
  const results = [];

  for (const userData of USERS) {
    const user = await prisma.user.upsert({
      where: { phone: userData.phone },
      update: {
        name: userData.name,
        lastname: userData.lastname,
        state: userData.state,
        city: userData.city,
        address: userData.address,
        dob: userData.dob,
        role: userData.role,
        isBlocked: false,
      },
      create: {
        phone: userData.phone,
        name: userData.name,
        lastname: userData.lastname,
        state: userData.state,
        city: userData.city,
        address: userData.address,
        dob: userData.dob,
        role: userData.role,
        isBlocked: false,
      },
    });

    const tokens = await tokenService.generateAuthTokens(user);

    results.push({
      isRegistered: true,
      user,
      tokens,
    });
  }

  console.log(JSON.stringify(results, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
