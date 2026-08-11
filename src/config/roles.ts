import { Role } from '../generated/prisma';

const allRoles = {
  [Role.USER]: [],
  [Role.ADMIN]: ['getUsers', 'manageUsers', 'manageFlashDeals']
};

export const roles = Object.keys(allRoles);
export const roleRights = new Map(Object.entries(allRoles));
