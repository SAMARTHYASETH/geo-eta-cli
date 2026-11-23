const EARTH_RADIUS_KM = 6371;
const KM_TO_MILES = 0.621371;

const MODE_SPEEDS_KMH = Object.freeze({
  walk: 5,
  bike: 18,
  car: 35,
  drone: 60
});

export const PRESETS = Object.freeze({
  "connaught place": [28.6315, 77.2167],
  "india gate": [28.6129, 77.2295],
  "gurugram": [28.4595, 77.0266],
  "noida": [28.5355, 77.3910],
  "sonipat": [28.9931, 77.0151],
  "igi airport": [28.5562, 77.1000]
});

function validateCoordinates(lat, lng, rawInput) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error(`Invalid coordinates in "${String(rawInput)}": latitude and longitude must be finite numbers.`);
  }
  if (lat < -90 || lat > 90) {
    throw new Error(`Invalid latitude ${lat}: must be between -90 and 90.`);
  }
  if (lng < -180 || lng > 180) {
    throw new Error(`Invalid longitude ${lng}: must be between -180 and 180.`);
  }
  return [lat, lng];
}

export function resolvePoint(input) {
  if (Array.isArray(input)) {
    if (input.length !== 2) {
      throw new Error(`Invalid coordinate array: expected [lat, lng], received length ${input.length}.`);
    }
    return validateCoordinates(Number(input[0]), Number(input[1]), input);
  }

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) {
      throw new Error("Location input cannot be an empty string.");
    }

    const presetKey = trimmed.toLowerCase();
    if (Object.hasOwn(PRESETS, presetKey)) {
      return [...PRESETS[presetKey]];
    }

    const parts = trimmed.split(",");
    if (parts.length === 2 && parts[0].trim() !== "" && parts[1].trim() !== "") {
      return validateCoordinates(Number(parts[0].trim()), Number(parts[1].trim()), input);
    }
  }

  throw new Error(
    `Unknown location "${String(input)}". Provide [lat, lng], "lat,lng", or one of: ${Object.keys(PRESETS).join(", ")}.`
  );
}

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

export function getDistance(pointA, pointB, unit = "km") {
  if (unit !== "km" && unit !== "mi") {
    throw new Error(`Unsupported distance unit "${unit}". Use "km" or "mi".`);
  }

  const [lat1, lon1] = resolvePoint(pointA);
  const [lat2, lon2] = resolvePoint(pointB);

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = EARTH_RADIUS_KM * c;
  const converted = unit === "mi" ? distanceKm * KM_TO_MILES : distanceKm;

  return Math.round(converted * 100) / 100;
}

export function estimateETA(pointA, pointB, mode = "car") {
  const normalizedMode = String(mode).trim().toLowerCase();
  if (!Object.hasOwn(MODE_SPEEDS_KMH, normalizedMode)) {
    throw new Error(
      `Unsupported transport mode "${mode}". Supported modes: ${Object.keys(MODE_SPEEDS_KMH).join(", ")}.`
    );
  }

  const distanceKm = getDistance(pointA, pointB, "km");
  const speedKmh = MODE_SPEEDS_KMH[normalizedMode];
  const minutes = Math.max(1, Math.round((distanceKm / speedKmh) * 60));

  return {
    distanceKm,
    minutes,
    mode: normalizedMode
  };
}

export function sortByNearest(origin, locations, { maxRadiusKm = Infinity, mode = "car" } = {}) {
  const resolvedOrigin = resolvePoint(origin);

  if (!Array.isArray(locations)) {
    throw new Error("Expected locations to be an array.");
  }
  if (typeof maxRadiusKm !== "number" || Number.isNaN(maxRadiusKm) || maxRadiusKm < 0) {
    throw new Error(`Invalid maxRadiusKm "${maxRadiusKm}": must be a non-negative number.`);
  }

  return locations
    .map((item) => {
      if (!item || typeof item !== "object") {
        throw new Error("Each location entry must be an object with coords or { lat, lng }.");
      }

      const targetPoint = item.coords !== undefined && item.coords !== null
        ? item.coords
        : typeof item.lat === "number" && typeof item.lng === "number"
          ? [item.lat, item.lng]
          : null;

      if (!targetPoint) {
        throw new Error("Location object must contain either coords: [lat, lng] or numeric { lat, lng }.");
      }

      const { distanceKm, minutes } = estimateETA(resolvedOrigin, targetPoint, mode);
      return {
        ...item,
        distanceKm,
        etaMinutes: minutes
      };
    })
    .filter((entry) => entry.distanceKm <= maxRadiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
