import test from "node:test";
import assert from "node:assert/strict";
import { calculateEstimate } from "../src/construction-estimator.mjs";

const baseItems = [
  { id: "A", description: "Pekerjaan contoh A", unit: "m2", quantity: 10, rateComponents: { materials: 50000, labour: 20000 } },
  { id: "B", description: "Pekerjaan contoh B", unit: "m3", quantity: 2.5, rateComponents: { materials: 100000, labour: 40000, equipment: 10000 }, status: "approved" },
];

test("calculates item rates, amounts and subtotal deterministically", () => {
  const result = calculateEstimate(baseItems);
  assert.equal(result.items[0].unitRate, 70000);
  assert.equal(result.items[0].amount, 700000);
  assert.equal(result.directCost, 1_075_000);
  assert.equal(result.grandTotal, 1_075_000);
  assert.equal(result.status, "provisional");
});

test("applies configured percentage build-up in documented order", () => {
  const result = calculateEstimate([baseItems[1]], {
    overheadPercent: 10, profitPercent: 5, contingencyPercent: 2, taxPercent: 11,
  });
  assert.equal(result.directCost, 375000);
  assert.equal(result.overhead.amount, 37500);
  assert.equal(result.profit.base, 412500);
  assert.equal(result.profit.amount, 20625);
  assert.equal(result.contingency.base, 433125);
  assert.equal(result.contingency.amount, 8663);
  assert.equal(result.tax.base, 441788);
  assert.equal(result.tax.amount, 48597);
  assert.equal(result.grandTotal, 490385);
});

test("supports excluding provisional items from an approved estimate", () => {
  const result = calculateEstimate(baseItems, { includeProvisional: false });
  assert.deepEqual(result.excludedProvisionalIds, ["A"]);
  assert.equal(result.items.length, 1);
  assert.equal(result.directCost, 375000);
  assert.equal(result.status, "review-required");
});

test("zero quantity and omitted rate components are valid", () => {
  const result = calculateEstimate([
    { id: "Z", description: "Item nol", unit: "unit", quantity: 0, rateComponents: {} },
  ]);
  assert.equal(result.items[0].amount, 0);
  assert.equal(result.grandTotal, 0);
});

test("rejects missing descriptions, negative quantities, invalid rates and percentages", () => {
  assert.throws(() => calculateEstimate([{ id: "X", unit: "m2", quantity: 1 }]), /description is required/);
  assert.throws(() => calculateEstimate([{ id: "X", description: "X", unit: "m2", quantity: -1 }]), /quantity/);
  assert.throws(() => calculateEstimate([{ id: "X", description: "X", unit: "m2", quantity: 1, rateComponents: { labour: -1 } }]), /invalid labour rate/);
  assert.throws(() => calculateEstimate([], { taxPercent: Number.NaN }), /taxPercent/);
  assert.throws(() => calculateEstimate([], { taxBase: "unknown" }), /taxBase/);
});

test("rejects duplicate item identifiers to avoid accidental duplicate rows", () => {
  const duplicated = [baseItems[0], { ...baseItems[0] }];
  // Duplicates are checked at the boundary so the same ID cannot be double-counted silently.
  assert.throws(() => calculateEstimate(duplicated), /duplicate item id/i);
});
