import prisma from "../client";
import { User, Prisma } from "@prisma/client";

const buildSelect = <K extends keyof User>(
  keys: K[],
): Pick<Prisma.UserSelect, K> =>
  keys.reduce(
    (obj, key) => ({ ...obj, [key]: true }),
    {} as Pick<Prisma.UserSelect, K>,
  );

const defaultUserKeys = [
  "id",
  "phone",
  "name",
  "role",
  "isBlocked",
  "createdAt",
  "updatedAt",
] as const;

const getUserByPhone = async <K extends keyof User>(
  phone: string,
  keys: K[] = [...defaultUserKeys] as K[],
) => {
  return prisma.user.findUnique({
    where: { phone },
    select: buildSelect(keys),
  });
};

const getUserById = async <K extends keyof User>(
  id: number,
  keys: K[] = [...defaultUserKeys] as K[],
) => {
  return prisma.user.findUnique({
    where: { id },
    select: buildSelect(keys),
  });
};

const updateUserById = async (id: number, data: Prisma.UserUpdateInput) => {
  return prisma.user.update({
    where: { id },
    data,
    select: buildSelect([...defaultUserKeys]),
  });
};
// only accessible for admin
const getAllUsers = async <K extends keyof User>(
  keys: K[] = [...defaultUserKeys] as K[],
) => {
  return prisma.user.findMany({
    select: buildSelect(keys),
  });
};

const blockUserById = async (id: number) => {
  return prisma.$transaction(async (tx) => {
    await tx.token.deleteMany({ where: { userId: id } });

    return tx.user.update({
      where: { id },
      data: { isBlocked: true },
      select: buildSelect([...defaultUserKeys]),
    });
  });
};

// Kept for compatibility with token.service — users are identified by phone in this schema
const getUserByEmail = getUserByPhone;

export default {
  getAllUsers,
  getUserByPhone,
  getUserById,
  getUserByEmail,
  updateUserById,
  blockUserById,
};
