/**
 * Debug: raw PostgREST responses for gallery_images (session 91de9d).
 * Reads VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY from .env at repo root.
 * Appends one NDJSON line to debug-91de9d.log (no secrets in payload).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env");
const logPath = path.join(root, "debug-91de9d.log");

function parseEnv(p) {
  const out = {};
  if (!fs.existsSync(p)) return out;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (k === "VITE_SUPABASE_URL") out.url = v;
    if (k === "VITE_SUPABASE_PUBLISHABLE_KEY") out.key = v;
  }
  return out;
}

const { url, key } = parseEnv(envPath);
if (!url || !key) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env");
  process.exit(1);
}

async function getJson(sel) {
  const u = new URL("/rest/v1/gallery_images", url.replace(/\/$/, ""));
  u.searchParams.set("select", sel);
  u.searchParams.set("limit", "1");
  const r = await fetch(u, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
  });
  const text = await r.text();
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    /* leave parsed null */
  }
  return { status: r.status, textLen: text.length, parsed };
}

const star = await getJson("*");
const explicit = await getJson("id,is_visible");

const firstStar = Array.isArray(star.parsed) && star.parsed[0] ? star.parsed[0] : null;
const line =
  JSON.stringify({
    sessionId: "91de9d",
    runId: "node-rest",
    hypothesisId: "H-REST",
    location: "scripts/debug-gallery-rest.mjs",
    message: "Raw PostgREST gallery_images",
    data: {
      host: new URL(url).hostname,
      selectStarStatus: star.status,
      selectStarKeys: firstStar ? Object.keys(firstStar) : null,
      selectStarHasIsVisible: firstStar ? Object.prototype.hasOwnProperty.call(firstStar, "is_visible") : null,
      explicitStatus: explicit.status,
      explicitParsed: explicit.parsed,
      explicitErrorText:
        explicit.status >= 400 && typeof explicit.parsed === "object" && explicit.parsed
          ? explicit.parsed
          : null,
    },
    timestamp: Date.now(),
  }) + "\n";

fs.appendFileSync(logPath, line, "utf8");
console.log("Appended to", logPath);
