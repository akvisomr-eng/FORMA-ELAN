import { readFileSync, existsSync } from "node:fs";
import assert from "node:assert/strict";

const html = readFileSync("index.html", "utf8");
const prototype = readFileSync("management-prototype.html", "utf8");
const estimator = readFileSync("construction-estimator.html", "utf8");
assert.ok(existsSync("src/construction-estimator.mjs"), "Construction estimator engine missing");
assert.ok(existsSync("tests/construction-estimator.test.mjs"), "Construction estimator tests missing");

assert.match(html, /<html lang="id">/i, "Public site must declare Indonesian language");
for (const id of ["layanan", "portofolio", "proses", "konsultasi", "leadForm", "aiPanel", "aiLaunch", "aiMessages", "aiForm", "aiMic", "aiStop"]) {
  assert.ok(html.includes('id="' + id + '"'), "Missing required site/companion element: " + id);
}
assert.match(html, /SpeechRecognition|webkitSpeechRecognition/, "Voice input capability must be present");
assert.match(html, /speechSynthesis/, "Voice output capability must be present");
assert.match(html, /belum terhubung ke AI/i, "Companion must disclose it is not yet connected to a generative AI backend");
assert.match(html, /Periksa pesan lalu kirim secara manual/i, "WhatsApp form must disclose manual-send behavior");
assert.match(prototype, /Prototype|prototipe/i, "Management dashboard must clearly identify itself as a prototype");
assert.match(prototype, /mock|contoh|dummy/i, "Management dashboard must identify mock/demo data");
assert.match(estimator, /name="robots" content="noindex,nofollow"/i, "Estimator preview must not be indexed as a finished product");
assert.match(estimator, /Pratinjau — bukan dokumen penawaran resmi/i, "Estimator must disclose its preview status");
assert.match(estimator, /tidak menyediakan harga pasar/i, "Estimator must disclose it does not provide market prices");
assert.match(estimator, /calculateEstimate/, "Estimator page must call the deterministic calculation module");
assert.doesNotMatch(html + prototype, /postgres(?:ql)?:\/\/[^\s"'<>]+/i, "Public files must not contain a database connection URL");
assert.doesNotMatch(html + prototype, /(?:sk-[A-Za-z0-9]{20,}|gsk_[A-Za-z0-9]{20,}|NEON_API_KEY\s*=)/, "Public files must not contain common provider/API secret patterns");
assert.ok(existsSync(".github/workflows/deploy-pages.yml"), "Pages deployment workflow missing");
console.log("FORMA ELAN static-site checks passed.");
console.log("Verified: Indonesian metadata, required sections, text/voice companion, honest demo notices, and no obvious database/API secrets.");
