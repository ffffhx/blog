import { join } from "node:path";

import { getPrivatePosts } from "../lib/content/posts";
import { exportPrivatePosts } from "../lib/content/private-post-export";

// JSON is the only article artifact. /private-post/ owns all page rendering.
const outputDir = join(process.cwd(), "..", "garden-api", "data", "private-blog");
const slugs = exportPrivatePosts(getPrivatePosts(), {
  slug: process.argv[2] || "all",
  siteRoot: process.cwd(),
  outputDir,
});
console.log(`Exported ${slugs.length} private post(s) to ${outputDir}`);
for (const slug of slugs) console.log(`  ${slug}.json`);
