import { describe, expect, it } from "vitest";
import { haversineDistanceMeters } from "./geo";

describe("haversineDistanceMeters", () => {
  it("returns 0 for identical points", () => {
    expect(haversineDistanceMeters(14.881, 103.493, 14.881, 103.493)).toBe(0);
  });

  it("matches a known reference distance (Bangkok to Chiang Mai, ~580km)", () => {
    // Bangkok (13.7563, 100.5018) to Chiang Mai (18.7883, 98.9853)
    const distance = haversineDistanceMeters(13.7563, 100.5018, 18.7883, 98.9853);
    expect(distance).toBeGreaterThan(570_000);
    expect(distance).toBeLessThan(590_000);
  });

  it("is symmetric", () => {
    const a = haversineDistanceMeters(14.881, 103.493, 14.885, 103.5);
    const b = haversineDistanceMeters(14.885, 103.5, 14.881, 103.493);
    expect(a).toBeCloseTo(b, 6);
  });

  it("gives a small distance for two points ~100m apart", () => {
    // ~0.0009 degrees latitude is roughly 100m
    const distance = haversineDistanceMeters(14.881, 103.493, 14.8819, 103.493);
    expect(distance).toBeGreaterThan(90);
    expect(distance).toBeLessThan(110);
  });
});
