import { Injectable } from '@nestjs/common';
import { toInputJson } from '../../common/utils/json.util';
import {
  NAMING_PROFILE_CONFIG_KEY,
  NAMING_PROFILE_CONFIG_SERVICE,
  NamingProfileMode,
  NamingProfileState,
  NamingProfileValues,
  normalizeNamingProfile,
  parseNamingProfileJson,
  transformNamingValue,
} from '../../common/utils/naming-profile.util';
import { PrismaService } from '../../database/prisma.service';
import { AuthPrincipal } from '../auth/auth.types';

const CACHE_TTL_MS = 5000;

@Injectable()
export class NamingProfileService {
  private cached?: NamingProfileState;
  private cachedAt = 0;

  constructor(private readonly prisma: PrismaService) {}

  async getProfile(force = false): Promise<NamingProfileState> {
    const now = Date.now();
    if (!force && this.cached && now - this.cachedAt < CACHE_TTL_MS) {
      return this.cached;
    }

    const record = await this.prisma.integrationConfig.findUnique({
      where: {
        service_key: {
          service: NAMING_PROFILE_CONFIG_SERVICE,
          key: NAMING_PROFILE_CONFIG_KEY,
        },
      },
      include: {
        updatedBy: {
          select: { username: true, displayName: true },
        },
      },
    });
    const profile = parseNamingProfileJson(record?.value);
    const updatedBy =
      record?.updatedBy?.displayName || record?.updatedBy?.username || profile.updatedBy;
    const state = {
      ...profile,
      updatedAt: record?.updatedAt.toISOString() || profile.updatedAt,
      updatedBy,
    };
    this.cached = state;
    this.cachedAt = now;
    return state;
  }

  async updateProfile(
    mode: NamingProfileMode,
    principal: AuthPrincipal,
    requestId?: string,
  ): Promise<NamingProfileState> {
    const before = await this.getProfile(true);
    const next = normalizeNamingProfile({
      ...before,
      mode,
      updatedAt: new Date().toISOString(),
    });
    await this.prisma.$transaction(async (tx) => {
      await tx.integrationConfig.upsert({
        where: {
          service_key: {
            service: NAMING_PROFILE_CONFIG_SERVICE,
            key: NAMING_PROFILE_CONFIG_KEY,
          },
        },
        create: {
          service: NAMING_PROFILE_CONFIG_SERVICE,
          key: NAMING_PROFILE_CONFIG_KEY,
          value: JSON.stringify(next),
          isSecret: false,
          valuePreview: `${next.activeProfile.placeName} / ${next.activeProfile.cafeName}`,
          updatedById: principal.id,
        },
        update: {
          value: JSON.stringify(next),
          isSecret: false,
          valuePreview: `${next.activeProfile.placeName} / ${next.activeProfile.cafeName}`,
          updatedById: principal.id,
        },
      });
      await tx.auditLog.create({
        data: {
          adminId: principal.id,
          action: 'naming-profile.updated',
          resource: 'system',
          resourceId: NAMING_PROFILE_CONFIG_KEY,
          before: toInputJson({
            mode: before.mode,
            placeName: before.activeProfile.placeName,
            cafeName: before.activeProfile.cafeName,
          }),
          after: toInputJson({
            mode: next.mode,
            placeName: next.activeProfile.placeName,
            cafeName: next.activeProfile.cafeName,
          }),
          requestId,
        },
      });
    });
    this.cached = undefined;
    return this.getProfile(true);
  }

  async getActiveValues(): Promise<NamingProfileValues> {
    return (await this.getProfile()).activeProfile;
  }

  async transformResponse<T>(value: T): Promise<T> {
    const values = await this.getActiveValues();
    return transformNamingValue(value, values) as T;
  }

  shouldTransformPath(path: string): boolean {
    const normalized = this.normalizeApiPath(path);
    if (!normalized.startsWith('/api/')) return false;
    const excludedPrefixes = [
      '/api/admin/auth',
      '/api/admin/me',
      '/api/admin/session',
      '/api/admin/config-status',
      '/api/admin/integration-configs',
      '/api/admin/naming-profile',
      '/api/auth',
      '/api/health',
    ];
    return !excludedPrefixes.some((prefix) => normalized.startsWith(prefix));
  }

  private normalizeApiPath(path: string) {
    const pathname = path.split('?')[0] || '/';
    return pathname.replace(/^\/api\/v\d+(?=\/|$)/, '/api');
  }
}
