export type LatLng = [number, number];

export type PointInput = LatLng | string;

export type TransportMode = "walk" | "bike" | "car" | "drone";

export type DistanceUnit = "km" | "mi";

export interface ETAResult {
  distanceKm: number;
  minutes: number;
  mode: TransportMode;
}

export type LocationWithCoords =
  | { coords: PointInput; [key: string]: unknown }
  | { lat: number; lng: number; [key: string]: unknown };

export type LocationWithETA<T> = T & {
  distanceKm: number;
  etaMinutes: number;
};

export interface SortByNearestOptions {
  maxRadiusKm?: number;
  mode?: TransportMode;
}

export declare const PRESETS: Readonly<Record<string, LatLng>>;

export declare function resolvePoint(input: PointInput): LatLng;

export declare function getDistance(
  pointA: PointInput,
  pointB: PointInput,
  unit?: DistanceUnit
): number;

export declare function estimateETA(
  pointA: PointInput,
  pointB: PointInput,
  mode?: TransportMode
): ETAResult;

export declare function sortByNearest<T extends LocationWithCoords>(
  origin: PointInput,
  locations: T[],
  options?: SortByNearestOptions
): Array<LocationWithETA<T>>;
