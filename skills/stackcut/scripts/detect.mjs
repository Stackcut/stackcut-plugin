#!/usr/bin/env node
// Stackcut stack detector. Scans a codebase LOCALLY and prints which paid services it uses and which features of each.
// Output is a summary only: vendor ids, evidence labels (package names, env var NAMES, config file names, API hosts),
// feature names and counts. It never prints source code, file contents, or environment variable values, and it never
// reads .env / .env.local (only .env.example-style templates, for variable names).
//
// Usage: node detect.mjs [dir=.] [--rules detect.json | --latest] [--pretty]
//   --latest  fetch current rules from https://stackcut.io/data/detect.json (falls back to the bundled copy)
// Node 18+. No dependencies.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const root = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--rules") || ".";
const here = dirname(fileURLToPath(import.meta.url));

async function loadRules() {
  if (flag("--latest")) {
    try { const r = await fetch("https://stackcut.io/data/detect.json", { signal: AbortSignal.timeout(8000) }); if (r.ok) return await r.json(); } catch { /* fall back */ }
  }
  const p = opt("--rules") || [join(here, "detect.json"), join(here, "..", "detect.json")].find(existsSync);
  if (!p) throw new Error("detect.json not found; pass --rules <file> or --latest");
  return JSON.parse(readFileSync(p, "utf8"));
}

const rules = await loadRules();
const SKIP = new Set(rules.scan.skip_dirs);
const EXT = new Set(rules.scan.source_extensions);
const MAX = rules.scan.max_file_bytes || 1e6;
const ENV_TEMPLATES = /^\.env\.(example|sample|template|dist|defaults)$|^env\.example$/i;

// ---------- walk ----------
const files = [];
(function walk(d, depth) {
  if (depth > 12 || files.length > 30000) return;
  let ents = [];
  try { ents = readdirSync(d, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    if (e.isSymbolicLink()) continue;
    const p = join(d, e.name);
    if (e.isDirectory()) { if (!SKIP.has(e.name) && (!e.name.startsWith(".") || e.name === ".do" || e.name === ".github")) walk(p, depth + 1); }
    else if (e.isFile()) files.push(p);
  }
})(root, 0);
for (const extra of [".vercel/project.json"]) if (existsSync(join(root, extra))) files.push(join(root, extra)); // signal only; build output is skipped
const rel = (p) => relative(root, p).split("\\").join("/");
const read = (p) => { try { return statSync(p).size <= MAX ? readFileSync(p, "utf8") : ""; } catch { return ""; } };

// ---------- packages ----------
const pkgs = { npm: new Set(), pypi: new Set(), gem: new Set(), go: new Set() };
for (const f of files) {
  const b = basename(f);
  if (b === "package.json" && !rel(f).includes("node_modules/")) {
    try { const j = JSON.parse(read(f)); for (const k of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) Object.keys(j[k] || {}).forEach((n) => pkgs.npm.add(n.toLowerCase())); } catch { /* ignore */ }
  } else if (/^requirements.*\.txt$|^Pipfile$/i.test(b)) {
    for (const line of read(f).split("\n")) { const m = line.trim().match(/^([A-Za-z0-9_.\-]+)/); if (m && !line.trim().startsWith("#")) pkgs.pypi.add(m[1].toLowerCase().replace(/_/g, "-")); }
  } else if (b === "pyproject.toml") {
    for (const m of read(f).matchAll(/["']([A-Za-z0-9_.\-]+)\s*(?:[<>=~!\[;]|["'])/g)) pkgs.pypi.add(m[1].toLowerCase().replace(/_/g, "-"));
  } else if (b === "Gemfile") {
    for (const m of read(f).matchAll(/gem\s+["']([^"']+)["']/g)) pkgs.gem.add(m[1].toLowerCase());
  } else if (b === "go.mod") {
    for (const m of read(f).matchAll(/^\s*(?:require\s+)?([a-z0-9.\-]+\.[a-z]+\/[^\s]+)\s+v/gm)) pkgs.go.add(m[1].toLowerCase());
  }
}
const pkgHit = (eco, names) => names.flatMap((n) => {
  const nn = n.toLowerCase().replace(eco === "pypi" ? /_/g : /$^/, "-");
  return nn.endsWith("*") ? [...pkgs[eco]].filter((p) => p.startsWith(nn.slice(0, -1))) : pkgs[eco].has(nn) ? [nn] : [];
});

// ---------- env var names + source text ----------
const envNames = new Set();
const ENV_RE = [/process\.env\.([A-Z][A-Z0-9_]{2,})/g, /process\.env\[['"]([A-Z][A-Z0-9_]{2,})['"]\]/g, /import\.meta\.env\.([A-Z][A-Z0-9_]{2,})/g,
  /Deno\.env\.get\(['"]([A-Z][A-Z0-9_]{2,})['"]\)/g, /os\.environ(?:\.get)?[\[(]['"]([A-Z][A-Z0-9_]{2,})['"]/g, /os\.getenv\(['"]([A-Z][A-Z0-9_]{2,})['"]/g,
  /ENV\[['"]([A-Z][A-Z0-9_]{2,})['"]\]/g, /env\(['"]([A-Z][A-Z0-9_]{2,})['"]\)/g];
const sources = [];
for (const f of files) {
  const b = basename(f);
  if (/^\.env(\.local|\.development|\.production|\.test)?$/i.test(b)) continue; // never read real env files
  if (ENV_TEMPLATES.test(b)) { for (const line of read(f).split("\n")) { const m = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]{2,})\s*=/); if (m) envNames.add(m[1]); } continue; }
  const ext = b.includes(".") ? b.split(".").pop().toLowerCase() : "";
  if (!EXT.has(ext) || b === "package-lock.json" || b.endsWith(".min.js")) continue;
  const text = read(f);
  if (!text) continue;
  if (/\.(json|ya?ml|toml)$/.test(b) && text.length > 100000) continue; // data files, lockfiles
  for (const re of ENV_RE) for (const m of text.matchAll(re)) envNames.add(m[1]);
  // HTML: only script/iframe/link sources count (a plain link to a vendor's website is not usage)
  const code = ext === "html" ? [...text.matchAll(/<(?:script|iframe)[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]).join("\n") +
    [...text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).join("\n") : text;
  sources.push({ path: rel(f), text: code, config: /^(json|ya?ml|toml)$/.test(ext) });
}
const relFiles = new Set(files.map(rel));
const hasFile = (name) => [...relFiles].some((p) => p === name || p.endsWith("/" + name) || p.startsWith(name + "/"));

// ---------- match vendors ----------
const out = [];
for (const v of rules.vendors) {
  const ev = [];
  for (const eco of ["npm", "pypi", "gem", "go"]) pkgHit(eco, v[eco] || []).forEach((n) => ev.push(`${eco}:${n}`));
  const envRes = (v.env || []).map((r) => new RegExp(r, "i"));
  [...envNames].filter((n) => envRes.some((r) => r.test(n))).slice(0, 6).forEach((n) => ev.push(`env:${n}`));
  (v.files || []).filter(hasFile).forEach((n) => ev.push(`file:${n}`));
  const hostRes = (v.hosts || []).map((r) => new RegExp(r, "i"));
  const hostFiles = sources.filter((s) => !s.config && hostRes.some((r) => r.test(s.text)));
  if (hostFiles.length) ev.push(`host:${v.hosts.map((h) => h.replace(/\\b/g, "").replace(/\(\?:/g, "(").replace(/\\/g, "")).join("|").slice(0, 60)} (${hostFiles.length} file${hostFiles.length === 1 ? "" : "s"})`);
  const strong = ev.some((e) => /^(npm|pypi|gem|go|env|host):/.test(e));
  if (!ev.length || (v.weak && !strong && ev.length < 2)) continue;
  // features: count matches only in files that reference this vendor (package import, host, or env name), else all files
  const refRe = new RegExp([...(v.npm || []), ...(v.pypi || []), ...(v.gem || [])].map((n) => n.replace(/\*$/, "").replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")).concat(v.hosts || [], (v.env || []).map((e) => e.replace(/^\^/, ""))).join("|") || "$^", "i");
  const scope = sources.filter((s) => refRe.test(s.text));
  const pool = scope.length ? scope : sources.filter((s) => /\.(json|toml|ya?ml)$/.test(s.path));
  const feats = [];
  for (const f of v.features || []) {
    const re = new RegExp(f.re, "gi");
    let hits = 0, nfiles = 0;
    for (const s of pool) { const n = (s.text.match(re) || []).length; if (n) { hits += n; nfiles++; } }
    if (hits) feats.push({ name: f.name, hits, files: nfiles });
  }
  out.push({ vendor: v.id, name: v.name, category: v.category, in_catalog: !!v.product_id, confidence: strong ? (ev.length > 1 ? "high" : "medium") : "low",
    evidence: ev, features_used: feats.map((f) => f.name), feature_counts: feats, files_referencing: scope.length });
}
out.sort((a, b) => (b.confidence === "high") - (a.confidence === "high") || b.files_referencing - a.files_referencing);
const summary = { tool: "stackcut-detect", rules_version: rules.version, scanned_files: sources.length, services: out,
  note: "Summary only: no source code, file contents or secret values. Review it, then pass `services` to the Stackcut MCP tool audit_stack." };
process.stdout.write(JSON.stringify(summary, null, flag("--pretty") ? 2 : 0) + "\n");
