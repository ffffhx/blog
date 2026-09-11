import fs from "node:fs";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(new URL("../../apps/site/package.json", import.meta.url));
const sharp = require("sharp");

const ROOT = fileURLToPath(new URL("../../", import.meta.url)).replaceAll("\\", "/").replace(/\/$/, "");
const POSTS = `${ROOT}/apps/site/source/_posts`;
const GEN = `${ROOT}/design-demos/cover-gen`;
const TMP = `${ROOT}/tmp/cover-shots`;
fs.mkdirSync(TMP, { recursive: true });

// load covers.js
const body = fs.readFileSync(`${GEN}/covers.js`, "utf8");
const win = {};
new Function("window", body)(win);
const covers = win.COVERS;
new Function("window", fs.readFileSync(`${GEN}/threat-report.js`, "utf8"))(win);

const only = process.argv[2] ? process.argv[2].split(",").map(Number) : null;
const ab = (cmd) => execSync(`agent-browser --cdp 9223 ${cmd}`, { stdio: ["ignore", "pipe", "pipe"] }).toString();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Keep ProfilePilot's fixed control bar below the 1600×900 poster so selector
// screenshots contain only the cover artwork.
let browserReady = false;

let done = 0;
for (let i = 0; i < covers.length; i++) {
  if (only && !only.includes(i)) continue;
  const c = covers[i];
  const outDir = `${POSTS}/${c.dir}`;
  if (c.scene === "threat-report") {
    fs.mkdirSync(outDir, { recursive: true });
    await sharp(Buffer.from(win.renderThreatReport(c))).resize(1672, 940, { fit: "fill" })
      .png({ compressionLevel: 9 }).toFile(`${outDir}/cover-v1.png`);
    done++;
    console.log(`✓ [${i}] ${c.slug} → ${c.dir}/cover-v1.png (local SVG rasterization)`);
    continue;
  }
  if (!browserReady) {
    ab(`set viewport 1600 1100 2`);
    browserReady = true;
  }
  const url = `${pathToFileURL(`${GEN}/template.html`).href}?i=${i}&cb=${Date.now()}`;
  ab(`open "${url}"`);
  try { ab(`eval "document.fonts.ready"`); } catch {}
  await sleep(750);
  const shot = `${TMP}/${i}.png`;
  ab(`screenshot "#poster" "${shot}"`);
  if (!fs.existsSync(outDir)) { console.log(`!! missing dir for ${i}: ${outDir}`); continue; }
  await sharp(shot).resize(1672, 940, { fit: "fill" }).png({ quality: 90, compressionLevel: 9 })
    .toFile(`${outDir}/cover-v1.png`);
  // update frontmatter cover field
  const md = `${outDir}.md`;
  let txt = fs.readFileSync(md, "utf8");
  if (txt.includes('cover: "cover-v1.svg"')) {
    txt = txt.replace('cover: "cover-v1.svg"', 'cover: "cover-v1.png"');
    fs.writeFileSync(md, txt);
  }
  done++;
  console.log(`✓ [${i}] ${c.slug} → ${c.dir}/cover-v1.png`);
}
console.log(`\nDone: ${done} covers.`);
