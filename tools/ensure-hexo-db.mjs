#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const dbPath = path.join(process.cwd(), "db.json");

if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, "", "utf8");
}
