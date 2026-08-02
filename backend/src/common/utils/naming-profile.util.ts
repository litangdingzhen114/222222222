export type NamingProfileMode = 'hailin';

export interface NamingProfileValues {
  id: NamingProfileMode;
  label: string;
  appTitle: string;
  placeName: string;
  villageName: string;
  regionName: string;
  creekName: string;
  cafeName: string;
}

export interface NamingProfileState {
  mode: NamingProfileMode;
  profiles: Record<NamingProfileMode, NamingProfileValues>;
  activeProfile: NamingProfileValues;
  updatedAt?: string;
  updatedBy?: string;
}

export const NAMING_PROFILE_CONFIG_SERVICE = 'content';
export const NAMING_PROFILE_CONFIG_KEY = 'CONTENT_NAMING_PROFILE';

export const NAMING_PROFILE_DEFAULTS: Record<NamingProfileMode, NamingProfileValues> = {
  hailin: {
    id: 'hailin',
    label: '海林村 / 寻野村咖',
    appTitle: '一部手机游海林村',
    placeName: '海林村',
    villageName: '海林村',
    regionName: '海林村',
    creekName: '海林·溪谷',
    cafeName: '寻野村咖',
  },
};
export const DEFAULT_NAMING_PROFILE_MODE: NamingProfileMode = 'hailin';

function cleanText(value: unknown, maxLength = 80) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function cleanMode(value: unknown): NamingProfileMode {
  if (value === 'hailin') return value;
  return DEFAULT_NAMING_PROFILE_MODE;
}

function cleanProfile(mode: NamingProfileMode, value: unknown): NamingProfileValues {
  const defaults = NAMING_PROFILE_DEFAULTS[mode];
  const item = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const input = item as Partial<Record<keyof NamingProfileValues, unknown>>;
  return {
    ...defaults,
    label: cleanText(input.label, 40) || defaults.label,
    appTitle: cleanText(input.appTitle, 40) || defaults.appTitle,
    placeName: cleanText(input.placeName, 40) || defaults.placeName,
    villageName: cleanText(input.villageName, 40) || defaults.villageName,
    regionName: cleanText(input.regionName, 40) || defaults.regionName,
    creekName: cleanText(input.creekName, 40) || defaults.creekName,
    cafeName: cleanText(input.cafeName, 40) || defaults.cafeName,
  };
}

export function normalizeNamingProfile(value: unknown): NamingProfileState {
  const item = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const input = item as {
    mode?: unknown;
    profiles?: Partial<Record<NamingProfileMode, unknown>>;
    updatedAt?: unknown;
    updatedBy?: unknown;
  };
  const mode = cleanMode(input.mode);
  const profiles = {
    hailin: cleanProfile('hailin', input.profiles?.hailin),
  };
  return {
    mode,
    profiles,
    activeProfile: profiles[mode],
    updatedAt: cleanText(input.updatedAt, 40) || undefined,
    updatedBy: cleanText(input.updatedBy, 80) || undefined,
  };
}

export function parseNamingProfileJson(value: string | null | undefined) {
  if (!value) return normalizeNamingProfile(undefined);
  try {
    return normalizeNamingProfile(JSON.parse(value));
  } catch {
    return normalizeNamingProfile({ mode: value });
  }
}

export function namingReplacementPairs(values: NamingProfileValues): Array<[string, string]> {
  return [
    ['一部手机游黄湖林场', values.appTitle],
    ['一部手机游青田海林', values.appTitle],
    ['一部手机游海林村', values.appTitle],
    ['黄湖溪谷', values.creekName],
    ['黄湖林场慢直播', '海林慢直播'],
    ['黄湖林场农品', '海林农品'],
    ['黄湖林场长廊', '海林长廊'],
    ['黄湖林场', values.placeName],
    ['浙江省丽水市青田县海口镇海林村', values.placeName],
    ['丽水市青田县海口镇海林村', values.placeName],
    ['青田县海口镇海林村', values.placeName],
    ['青田海口镇海林村', values.placeName],
    ['青田海口镇', values.placeName],
    ['海口镇海林村', values.placeName],
    ['青田·海林', values.placeName],
    ['青田海林', values.placeName],
    ['土狗咖啡', values.cafeName],
    ['寻野 cafe', values.cafeName],
    ['寻野 Cafe', values.cafeName],
    ['寻野 café', values.cafeName],
    ['寻野 Café', values.cafeName],
    ['寻野咖啡', values.cafeName],
    ['寻野cafe', values.cafeName],
    ['寻野', values.cafeName],
    ['海林·溪谷', values.creekName],
    ['海林溪谷', values.creekName],
    ['海林慢直播', `${values.placeName}慢直播`],
    ['海林农品', `${values.placeName}农品`],
    ['海林长廊', `${values.placeName}长廊`],
    ['稻田田鱼', '海林田鱼'],
    ['青田田鱼', '海林田鱼'],
    ['青田石韵', '陈嵘栲古树'],
    ['青田石纹手作', '陈嵘栲古树拓印'],
    ['青田石纹', '陈嵘栲古树'],
    ['青田石手作', '陈嵘栲古树手作'],
    ['古树年轮拓印', '陈嵘栲古树拓印'],
    ['古树年轮手作', '陈嵘栲古树手作'],
    ['古树年轮', '陈嵘栲古树'],
  ];
}

export function replaceNamingText(text: string, values: NamingProfileValues) {
  const replaced = namingReplacementPairs(values).reduce((next, [from, to]) => {
    if (!from || !to || !next.includes(from)) return next;
    return next.split(from).join(to);
  }, text);
  return collapseDuplicateNamingText(replaced, values);
}

function collapseDuplicateNamingText(text: string, values: NamingProfileValues) {
  const place = values.placeName;
  return [
    `${place} · ${place}`,
    `${place}·${place}`,
    `${place}、${place}`,
    `${place}，${place}`,
    `${place},${place}`,
    `${place} / ${place}`,
    `${place}/${place}`,
    `${place} ${place}`,
    `${place}${place}`,
  ].reduce((next, pattern) => next.split(pattern).join(place), text);
}

export function transformNamingValue(value: unknown, values: NamingProfileValues): unknown {
  if (typeof value === 'string') return replaceNamingText(value, values);
  if (Array.isArray(value)) return value.map((item) => transformNamingValue(item, values));
  if (value && typeof value === 'object') {
    if (value instanceof Date) return value;
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, transformNamingValue(item, values)]),
    );
  }
  return value;
}
