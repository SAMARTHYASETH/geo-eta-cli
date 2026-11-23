import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PRESETS,
  resolvePoint,
  getDistance,
  estimateETA,
  sortByNearest
} from "./index.js";

describe("resolvePoint & PRESETS", () => {
  it("resolves built-in presets case-insensitively", () => {
    assert.deepEqual(resolvePoint("Sonipat"), PRESETS["sonipat"]);
    assert.deepEqual(resolvePoint("  IGI AIRPORT "), PRESETS["igi airport"]);
  });

  it("parses lat,lng strings and coordinate arrays", () => {
    assert.deepEqual(resolvePoint("28.6315, 77.2167"), [28.6315, 77.2167]);
    assert.deepEqual(resolvePoint([28.6129, 77.2295]), [28.6129, 77.2295]);
  });

  it("throws descriptive errors on invalid inputs", () => {
    assert.throws(() => resolvePoint("unknown-city"), /Unknown location/);
    assert.throws(() => resolvePoint([95, 77]), /Invalid latitude/);
    assert.throws(() => resolvePoint([28, 190]), /Invalid longitude/);
  });
});

describe("getDistance", () => {
  it("computes accurate Haversine distances in km and miles", () => {
    const km = getDistance("connaught place", "india gate", "km");
    const mi = getDistance("connaught place", "india gate", "mi");

    assert.ok(km > 2.2 && km < 2.6, `Expected ~2.42 km, got ${km}`);
    assert.ok(mi > 1.3 && mi < 1.7, `Expected ~1.50 mi, got ${mi}`);
  });

  it("returns 0 for identical coordinates and rejects invalid units", () => {
    assert.equal(getDistance("sonipat", "sonipat"), 0);
    assert.throws(() => getDistance("sonipat", "noida", "meters"), /Unsupported distance unit/);
  });
});

describe("estimateETA", () => {
  it("ranks transport mode speeds accurately (drone faster than car, bike, and walk)", () => {
    const walk = estimateETA("sonipat", "connaught place", "walk");
    const bike = estimateETA("sonipat", "connaught place", "bike");
    const car = estimateETA("sonipat", "connaught place", "car");
    const drone = estimateETA("sonipat", "connaught place", "drone");

    assert.ok(drone.minutes < car.minutes);
    assert.ok(car.minutes < bike.minutes);
    assert.ok(bike.minutes < walk.minutes);
  });

  it("enforces a minimum 1 minute ETA and throws on unsupported modes", () => {
    const sameSpot = estimateETA("noida", "noida", "car");
    assert.equal(sameSpot.minutes, 1);
    assert.throws(() => estimateETA("noida", "gurugram", "teleport"), /Unsupported transport mode/);
  });
});

describe("sortByNearest", () => {
  it("attaches distanceKm and etaMinutes, filters by maxRadiusKm, and sorts ascending", () => {
    const candidates = [
      { name: "Sonipat", coords: PRESETS["sonipat"] },
      { name: "India Gate", lat: 28.6129, lng: 77.2295 },
      { name: "Gurugram", coords: "gurugram" }
    ];

    const results = sortByNearest("connaught place", candidates, {
      maxRadiusKm: 35,
      mode: "bike"
    });

    assert.equal(results.length, 2);
    assert.equal(results[0].name, "India Gate");
    assert.equal(results[1].name, "Gurugram");
    assert.ok(results[0].distanceKm < results[1].distanceKm);
    assert.equal(typeof results[0].etaMinutes, "number");
  });
});
