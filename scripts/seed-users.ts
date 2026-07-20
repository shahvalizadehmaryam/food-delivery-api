import prisma from '../src/client';

const USERS = [
  {
    phone: '4155550001',
    name: 'Admin User',
    role: 'ADMIN' as const,
  },
  {
    phone: '4155550002',
    name: 'Test User',
    role: 'USER' as const,
  },
];

async function main() {
  const results = [];

  for (const userData of USERS) {
    const user = await prisma.user.upsert({
      where: { phone: userData.phone },
      update: {
        name: userData.name,
        role: userData.role,
      },
      create: userData,
    });
    results.push(user);
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
