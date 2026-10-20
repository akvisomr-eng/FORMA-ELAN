/**
 * Deterministic construction estimate calculator — Stage A MVP.
 * Inputs must be manually verified quantities and user-supplied unit-rate components.
 * This module does not read drawings or invent market prices.
 */
const nonNegative = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0;
const money = (v) => {
  if (!Number.isFinite(v) || v < 0) throw new TypeError("Invalid money amount");
  return Math.round(v);
};

export function calculateEstimate(items, options = {}) {
  if (!Array.isArray(items)) throw new TypeError("items must be an array");
  const percentages = {
    overheadPercent: options.overheadPercent ?? 0,
    profitPercent: options.profitPercent ?? 0,
    contingencyPercent: options.contingencyPercent ?? 0,
    taxPercent: options.taxPercent ?? 0
  };
  for (const [key, value] of Object.entries(percentages)) {
    if (!nonNegative(value)) throw new TypeError(key + " must be non-negative");
  }
  const taxBaseRule = options.taxBase ?? "all";
  if (!["all", "direct"].includes(taxBaseRule)) throw new TypeError("taxBase must be all or direct");

  const seen = new Set();
  const normalized = items.map((item, index) => {
    if (!item || typeof item !== "object") throw new TypeError("Item " + (index + 1) + " must be an object");
    for (const key of ["id", "description", "unit"]) {
      if (typeof item[key] !== "string" || !item[key].trim()) throw new TypeError("Item " + (index + 1) + ": " + key + " is required");
    }
    const id = item.id.trim();
    if (seen.has(id)) throw new TypeError("Duplicate item id: " + id);
    seen.add(id);
    if (!nonNegative(item.quantity)) throw new TypeError("Item " + id + ": quantity must be non-negative");
    const c = item.rateComponents ?? {};
    for (const key of ["materials", "labour", "equipment", "other"]) {
      if (c[key] !== undefined && !nonNegative(c[key])) throw new TypeError("Item " + id + ": invalid " + key + " rate");
    }
    const rate = ["materials", "labour", "equipment", "other"].reduce((sum, key) => sum + (c[key] ?? 0), 0);
    if (!Number.isFinite(rate) || !Number.isFinite(item.quantity * rate)) throw new TypeError("Item " + id + ": numeric overflow");
    return {
      id, description: item.description.trim(), unit: item.unit.trim(),
      quantity: item.quantity,
      rateComponents: { materials: c.materials ?? 0, labour: c.labour ?? 0, equipment: c.equipment ?? 0, other: c.other ?? 0 },
      unitRate: money(rate), amount: money(item.quantity * rate),
      sourceReference: typeof item.sourceReference === "string" ? item.sourceReference : "",
      assumptions: typeof item.assumptions === "string" ? item.assumptions : "",
      status: item.status === "approved" ? "approved" : "provisional"
    };
  });

  const included = normalized.filter(x => options.includeProvisional !== false || x.status === "approved");
  const excludedProvisionalIds = normalized.filter(x => options.includeProvisional === false && x.status !== "approved").map(x => x.id);
  const directCost = included.reduce((sum, x) => sum + x.amount, 0);
  const overhead = money(directCost * percentages.overheadPercent / 100);
  const profitBase = directCost + overhead;
  const profit = money(profitBase * percentages.profitPercent / 100);
  const contingencyBase = profitBase + profit;
  const contingency = money(contingencyBase * percentages.contingencyPercent / 100);
  const preTax = contingencyBase + contingency;
  const appliedTaxBase = taxBaseRule === "direct" ? directCost : preTax;
  const tax = money(appliedTaxBase * percentages.taxPercent / 100);

  return {
    currency: options.currency ?? "IDR",
    rounding: "Line amounts and each percentage component rounded to whole currency units using Math.round.",
    status: included.some(x => x.status !== "approved") ? "provisional" : "review-required",
    items: included, excludedProvisionalIds, directCost,
    overhead: { percent: percentages.overheadPercent, amount: overhead },
    profit: { percent: percentages.profitPercent, base: profitBase, amount: profit },
    contingency: { percent: percentages.contingencyPercent, base: contingencyBase, amount: contingency },
    tax: { percent: percentages.taxPercent, base: appliedTaxBase, baseRule: taxBaseRule, amount: tax },
    grandTotal: preTax + tax,
    disclaimer: "Berdasarkan kuantitas dan harga masukan pengguna. Verifikasi volume, harga berlaku, spesifikasi, pajak, dan persetujuan penanggung jawab sebelum digunakan sebagai penawaran resmi."
  };
}
