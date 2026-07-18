/**
 * tests/asset-build-contract.test.ts
 *
 * Build contract for the StartScreen backdrop:
 *   - src/assets/start-bg.png exists and is a valid PNG of 1920x1080.
 *   - StartScreen.astro imports it from "@/assets/start-bg.png" (NOT /public/).
 *   - StartScreen.astro uses background-image (composited backdrop).
 *   - package.json exposes a "generate-start-bg" script.
 *
 * The dimension check parses PNG magic bytes directly with Node stdlib
 * (Buffer) so we don't have to add a new dependency (no sharp, no
 * image-size). PNG IHDR is at offset 16, width = bytes 16..19 (big-endian
 * uint32), height = bytes 20..23.
 *
 * Why this test exists: the start-screen change is open-ended and the
 * existing tests/start-screen.test.ts is frozen (regression suite for
 * the core engine). This file is the contract that the *asset build
 * pipeline* keeps the backdrop wired correctly.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const PROJECT_ROOT = resolve(__dirname, "..");
const BACKDROP_REL = "src/assets/start-bg.png";
const BACKDROP_ABS = resolve(PROJECT_ROOT, BACKDROP_REL);
const START_SCREEN_REL =
  "src/modules/game/interface/components/organisms/StartScreen.astro";
const START_SCREEN_ABS = resolve(PROJECT_ROOT, START_SCREEN_REL);
const PACKAGE_JSON_ABS = resolve(PROJECT_ROOT, "package.json");

function readPngDimensions(filePath: string): { w: number; h: number } | null {
    let buf: Buffer;
    try {
        buf = readFileSync(filePath);
    } catch {
        return null;
    }
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    if (
        buf.length < 24 ||
        buf[0] !== 0x89 ||
        buf[1] !== 0x50 ||
        buf[2] !== 0x4e ||
        buf[3] !== 0x47
    ) {
        return null;
    }
    // IHDR begins at offset 8; width and height start at offset 16.
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    if (!Number.isFinite(w) || !Number.isFinite(h)) return null;
    return { w, h };
}

describe("StartScreen backdrop build contract", () => {
    it("1. src/assets/start-bg.png exists", () => {
        expect(existsSync(BACKDROP_ABS)).toBe(true);
    });

    it("2. backdrop is a valid 1920x1080 PNG (parsed from magic bytes)", () => {
        const dims = readPngDimensions(BACKDROP_ABS);
        expect(dims).not.toBeNull();
        expect(dims!.w).toBe(1920);
        expect(dims!.h).toBe(1080);
    });

    it("3. StartScreen.astro contains a background-image url() declaration", () => {
        const src = readFileSync(START_SCREEN_ABS, "utf8");
        expect(src).toMatch(/background-image\s*:\s*url\(/);
    });

    it('4. StartScreen.astro imports the backdrop from "@/assets/start-bg.png" (not /public/)', () => {
        const src = readFileSync(START_SCREEN_ABS, "utf8");
        expect(src).toMatch(/import\s+startBg\s+from\s+["']\@\/assets\/start-bg\.png["']/);
        // Make sure no /public/ fallback slipped in.
        expect(src).not.toMatch(/["']\/public\/.*start-bg/);
    });

    it('5. package.json exposes a "generate-start-bg" npm script', () => {
        const pkg = JSON.parse(readFileSync(PACKAGE_JSON_ABS, "utf8"));
        expect(pkg.scripts).toBeTypeOf("object");
        expect(pkg.scripts).toHaveProperty("generate-start-bg");
        expect(typeof pkg.scripts["generate-start-bg"]).toBe("string");
        // Either it shells out to libresprite with --script ... generate-start-bg.js
        // OR it runs `node scripts/generate-start-bg.js`. Both are valid hook
        // shapes as long as the underlying JS file is the LibreSprite script.
        const hook = pkg.scripts["generate-start-bg"];
        expect(hook).toMatch(/generate-start-bg\.js/);
        // Sanity: free from forbidden subshell-injection shenanigans.
        expect(hook).not.toMatch(/;\s*rm\s+-rf/);
    });
});
