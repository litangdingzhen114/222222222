import { SetMetadata } from '@nestjs/common';
import { AdminRole } from '@prisma/client';
import { ROLES_KEY } from '../constants/metadata.constants';

export const Roles = (...roles: AdminRole[]) => SetMetadata(ROLES_KEY, roles);
