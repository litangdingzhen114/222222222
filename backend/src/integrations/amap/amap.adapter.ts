import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IntegrationConfigService } from '../../modules/integration-config/integration-config.service';

type AmapTravelMode = 'walking' | 'driving';

type GeoPoint = {
  longitude: number;
  latitude: number;
};

type AmapDirectionInput = {
  origin: GeoPoint;
  destination: GeoPoint;
  mode: AmapTravelMode;
};

export type DirectionPoint = GeoPoint;

export type DirectionStep = {
  instruction: string;
  road?: string;
  distanceMeters: number;
  durationSeconds?: number;
};

export type AmapDirectionsResult = {
  provider: 'amap';
  mode: AmapTravelMode;
  distanceMeters: number;
  durationSeconds: number;
  polyline: DirectionPoint[];
  steps: DirectionStep[];
};

type AmapStep = {
  instruction?: string;
  road?: string;
  distance?: string;
  duration?: string;
  polyline?: string;
};

type AmapPath = {
  distance?: string;
  duration?: string;
  steps?: AmapStep[];
};

type AmapDirectionResponse = {
  status?: string;
  info?: string;
  route?: {
    paths?: AmapPath[];
  };
};

@Injectable()
export class AmapAdapter {
  constructor(
    private readonly config: ConfigService,
    private readonly integrationConfig: IntegrationConfigService,
  ) {}

  async directions(input: AmapDirectionInput): Promise<AmapDirectionsResult | null> {
    const key = await this.integrationConfig.getValue('AMAP_KEY');
    if (!key) return null;

    const baseUrl = await this.integrationConfig.getValue(
      'AMAP_API_BASE_URL',
      this.config.get<string>('AMAP_API_BASE_URL', 'https://restapi.amap.com'),
    );
    const endpoint = input.mode === 'driving' ? '/v3/direction/driving' : '/v3/direction/walking';
    const url = new URL(endpoint, baseUrl);
    url.searchParams.set('origin', this.locationText(input.origin));
    url.searchParams.set('destination', this.locationText(input.destination));
    url.searchParams.set('key', key);

    const response = await this.fetchJson<AmapDirectionResponse>(url);
    const path = response.route?.paths?.[0];
    if (response.status !== '1' || !path) return null;

    return {
      provider: 'amap',
      mode: input.mode,
      distanceMeters: this.numberValue(path.distance),
      durationSeconds: this.numberValue(path.duration),
      polyline: this.polyline(path.steps ?? [], input.origin, input.destination),
      steps: (path.steps ?? []).map((step) => ({
        instruction: step.instruction ?? '',
        road: step.road,
        distanceMeters: this.numberValue(step.distance),
        durationSeconds: step.duration ? this.numberValue(step.duration) : undefined,
      })),
    };
  }

  private async fetchJson<T>(url: URL): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      return (await response.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  private locationText(point: GeoPoint) {
    return `${point.longitude},${point.latitude}`;
  }

  private numberValue(value: string | undefined) {
    const number = Number(value ?? 0);
    return Number.isFinite(number) ? number : 0;
  }

  private polyline(steps: AmapStep[], origin: GeoPoint, destination: GeoPoint) {
    const points = steps.flatMap((step) => this.parsePolyline(step.polyline));
    if (!points.length) return [origin, destination];
    return [origin, ...points, destination];
  }

  private parsePolyline(value: string | undefined) {
    if (!value) return [];
    return value
      .split(';')
      .map((pair) => {
        const [longitude, latitude] = pair.split(',').map(Number);
        if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
        return { longitude, latitude };
      })
      .filter((point): point is DirectionPoint => Boolean(point));
  }
}
