/**
 * Build contract for the deterministic start-screen icon pipeline.
 *
 * Commit A owns the asset files and generation hook. Component wiring cases
 * are added in the second work unit after the asset pipeline is green.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const PROJECT_ROOT = resolve(__dirname, "..");
const ICON_RELATIVE_PATHS = [
  "src/assets/icons/icon-play.png",
  "src/assets/icons/icon-download.png",
  "src/assets/icons/icon-settings.png",
  "src/assets/icons/icon-gamepad.png",
] as const;
const PACKAGE_JSON_PATH = resolve(PROJECT_ROOT, "package.json");

function readPngDimensions(filePath: string): { width: number; height: number } | null {
  let buffer: Buffer;
  try {
    buffer = readFileSync(filePath);
  } catch {
    return null;
  }

  if (
    buffer.length < 24 ||
    buffer[0] !== 0x89 ||
    buffer[1] !== 0x50 ||
    buffer[2] !== 0x4e ||
    buffer[3] !== 0x47
  ) {
    return null;
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

describe("StartScreen icon build contract", () => {
  it("1. all four start icon PNGs exist", () => {
    for (const relativePath of ICON_RELATIVE_PATHS) {
      expect(existsSync(resolve(PROJECT_ROOT, relativePath))).toBe(true);
    }
  });

  it("2. each start icon is a valid 24x24 PNG", () => {
    for (const relativePath of ICON_RELATIVE_PATHS) {
      const dimensions = readPngDimensions(resolve(PROJECT_ROOT, relativePath));
      expect(dimensions).not.toBeNull();
      expect(dimensions!.width).toBe(24);
      expect(dimensions!.height).toBe(24);
    }
  });

  it("6. package.json exposes the generate-start-icons hook", () => {
    const packageJson = JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf8"));
    const hook = packageJson.scripts?.["generate-start-icons"];

    expect(typeof hook).toBe("string");
    expect(hook).toMatch(/generate-start-icons\.js/);
    expect(hook).not.toMatch(/;\s*rm\s+-rf/);
  });
});
