import { describe, expect, it } from "vitest";

import {
  assertValidTransition,
  isValidTransition,
} from "../../src/domain/order/order-transitions.js";

describe("order-transitions", () => {
  it("allows every step of the core happy-path flow", () => {
    const happyPath: Array<[string, string]> = [
      ["CREATED", "STOCK_RESERVED"],
      ["STOCK_RESERVED", "PICKING"],
      ["PICKING", "PICKED"],
      ["PICKED", "PACKING"],
      ["PACKING", "PACKED"],
      ["PACKED", "OUT_FOR_DELIVERY"],
      ["OUT_FOR_DELIVERY", "DELIVERED"],
    ];

    for (const [from, to] of happyPath) {
      expect(isValidTransition(from as never, to as never)).toBe(true);
    }
  });

  it("allows the exception paths", () => {
    expect(isValidTransition("CREATED" as never, "OUT_OF_STOCK" as never)).toBe(true);
    expect(isValidTransition("CREATED" as never, "CANCELLED" as never)).toBe(true);
    expect(isValidTransition("OUT_FOR_DELIVERY" as never, "FAILED" as never)).toBe(true);
    expect(isValidTransition("FAILED" as never, "RETURNED" as never)).toBe(true);
    expect(isValidTransition("OUT_OF_STOCK" as never, "STOCK_RESERVED" as never)).toBe(true);
  });

  it("rejects the invalid transitions listed in the P0 spec", () => {
    const illegal: Array<[string, string]> = [
      ["DELIVERED", "PICKING"],
      ["DELIVERED", "PACKING"],
      ["CREATED", "DELIVERED"],
      ["PACKED", "PICKING"],
      ["RETURNED", "OUT_FOR_DELIVERY"],
    ];

    for (const [from, to] of illegal) {
      expect(isValidTransition(from as never, to as never)).toBe(false);
      expect(() => assertValidTransition(from as never, to as never)).toThrow();
    }
  });

  it("treats terminal statuses as dead ends (except OUT_OF_STOCK's manual retry path)", () => {
    expect(isValidTransition("DELIVERED" as never, "DELIVERED" as never)).toBe(false);
    expect(isValidTransition("CANCELLED" as never, "CREATED" as never)).toBe(false);
    expect(isValidTransition("RETURNED" as never, "CREATED" as never)).toBe(false);
  });
});
