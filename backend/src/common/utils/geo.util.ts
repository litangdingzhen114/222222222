export function haversineDistanceMeters(
  a: { longitude: number; latitude: number },
  b: { longitude: number; latitude: number },
) {
  const earthRadius = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

export function decimalToNumber(value: { toNumber(): number } | number | null | undefined) {
  if (typeof value === 'number') return value;
  if (!value) return null;
  return value.toNumber();
}
