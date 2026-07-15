import prisma from '../src/client';
import tokenService from '../src/services/token.service';

const SAMPLE_PHONE = '4155552671';
const SAMPLE_NAME = 'John Doe';

async function main() {
  const user = await prisma.user.upsert({
    where: { phone: SAMPLE_PHONE },
    update: { name: SAMPLE_NAME },
    create: {
      phone: SAMPLE_PHONE,
      name: SAMPLE_NAME,
    },
  });

  const tokens = await tokenService.generateAuthTokens(user);

  console.log(
    JSON.stringify(
      {
        isRegistered: true,
        user,
        tokens,
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
