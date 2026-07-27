import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const AGENTS_MD_PATH = path.join(REPO_ROOT, "AGENTS.md");

const REQUIRED_SECTIONS = [
  "Project Overview",
  "Workspace Map",
  "Tooling Rules",
  "Memory Protocol",
  "Commit Conventions",
  "References"
];

function validate() {
  console.log("🔍 Running OpenWiki AGENTS.md Drift Validator...");

  if (!fs.existsSync(AGENTS_MD_PATH)) {
    console.error("❌ CRITICAL: AGENTS.md is missing at repo root.");
    process.exit(1);
  }

  const content = fs.readFileSync(AGENTS_MD_PATH, "utf-8");
  let failed = false;

  // 1. Validate mandatory sections
  console.log("\n--- Section Validation ---");
  for (const section of REQUIRED_SECTIONS) {
    // Regex matching ## [optional space] section name
    const regex = new RegExp(`^##\\s+.*${section}`, "mi");
    if (regex.test(content)) {
      console.log(`✅ Passed: Section "${section}" found.`);
    } else {
      console.error(`❌ FAILED: Mandatory section "${section}" is missing in AGENTS.md.`);
      failed = true;
    }
  }

  // 2. Validate path references in the file tree
  console.log("\n--- Path Reference Validation ---");
  // Match things like `./src/foo` or `src/foo` or `/src/foo` (except external URLs or template blocks)
  const pathRegex = /(?:\s|`|'|")((?:\.\/|\/)?src\/[a-zA-Z0-9._/-]+|(?:\.\/|\/)?tests\/[a-zA-Z0-9._/-]+|(?:\.\/|\/)?openspec\/[a-zA-Z0-9._/-]+)(?:\s|`|'|")/g;
  let match;
  const pathsChecked = new Set();

  while ((match = pathRegex.exec(content)) !== null) {
    let referencedPath = match[1];
    // Strip leading / or ./
    let cleanedPath = referencedPath.replace(/^\.?\//, "");
    
    if (pathsChecked.has(cleanedPath)) continue;
    pathsChecked.add(cleanedPath);

    const absolutePath = path.join(REPO_ROOT, cleanedPath);
    if (fs.existsSync(absolutePath)) {
      console.log(`✅ Passed: Path "${referencedPath}" exists.`);
    } else {
      console.error(`❌ FAILED: Path "${referencedPath}" is documented in AGENTS.md but does not exist on disk!`);
      failed = true;
    }
  }

  if (failed) {
    console.error("\n❌ OpenWiki: Drift detected! Please fix the errors in AGENTS.md before committing.");
    process.exit(1);
  } else {
    console.log("\n🎉 OpenWiki: AGENTS.md is 100% synchronized with the physical filesystem!");
    process.exit(0);
  }
}

validate();
