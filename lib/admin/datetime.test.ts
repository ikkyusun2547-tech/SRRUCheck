import { describe, expect, it } from "vitest";
import { parseThaiLocalDateTime, toThaiDatetimeLocalValue } from "./datetime";

describe("parseThaiLocalDateTime", () => {
  it("interprets a datetime-local string as Thailand time (UTC+7), not server-local", () => {
    const date = parseThaiLocalDateTime("2026-07-19T14:00");
    // 14:00 Thailand time = 07:00 UTC
    expect(date.toISOString()).toBe("2026-07-19T07:00:00.000Z");
  });

  it("handles midnight correctly across the day boundary", () => {
    const date = parseThaiLocalDateTime("2026-07-19T05:00");
    // 05:00 Thailand time = 22:00 UTC the previous day
    expect(date.toISOString()).toBe("2026-07-18T22:00:00.000Z");
  });
});

describe("toThaiDatetimeLocalValue", () => {
  it("round-trips with parseThaiLocalDateTime", () => {
    const original = "2026-07-19T14:30";
    const date = parseThaiLocalDateTime(original);
    expect(toThaiDatetimeLocalValue(date)).toBe(original);
  });

  it("formats a known UTC instant as the correct Thailand wall-clock time", () => {
    const date = new Date("2026-07-19T07:00:00.000Z");
    expect(toThaiDatetimeLocalValue(date)).toBe("2026-07-19T14:00");
  });
});
