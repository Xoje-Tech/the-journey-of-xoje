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
const RETRO_BUTTON_RELATIVE_PATH =
  "src/modules/game/interface/components/atoms/RetroButton.astro";
const START_SCREEN_RELATIVE_PATH =
  "src/modules/game/interface/components/organisms/StartScreen.astro";
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

  it("3. RetroButton.astro declares an optional icon prop", () => {
    const source = readFileSync(
      resolve(PROJECT_ROOT, RETRO_BUTTON_RELATIVE_PATH),
      "utf8",
    );

    expect(source).toMatch(/icon\?\s*:\s*\{\s*src\s*:\s*string\s*;\s*alt\s*:\s*string\s*\}/);
  });

  it("4. RetroButton.astro renders a pixel-art icon at 24x24", () => {
    const source = readFileSync(
      resolve(PROJECT_ROOT, RETRO_BUTTON_RELATIVE_PATH),
      "utf8",
    );

    expect(source).toMatch(/class\s*=\s*"retro-btn-icon"/);
    expect(source).toMatch(/image-rendering\s*:\s*pixelated/);
    expect(source).toMatch(/image-rendering\s*:\s*crisp-edges/);
    expect(source).toMatch(/width\s*:\s*24px/);
    expect(source).toMatch(/height\s*:\s*24px/);
  });

  it("5. StartScreen.astro imports each icon and wires it into the matching RetroButton", () => {
    const source = readFileSync(
      resolve(PROJECT_ROOT, START_SCREEN_RELATIVE_PATH),
      "utf8",
    );

    const iconBindings: Array<{ alias: string; filename: string }> = [
      { alias: "iconPlay", filename: "icon-play.png" },
      { alias: "iconDownload", filename: "icon-download.png" },
      { alias: "iconSettings", filename: "icon-settings.png" },
      { alias: "iconGamepad", filename: "icon-gamepad.png" },
    ];

    for (const binding of iconBindings) {
      const importRegex = new RegExp(
        `import\\s+${binding.alias}\\s+from\\s+["']\\@\\/assets\\/icons\\/${binding.filename}["']`,
      );
      expect(source, `missing import for ${binding.alias}`).toMatch(importRegex);
    }

    const buttonBindings: Array<{ id: string; alias: string }> = [
      { id: "start-game-btn", alias: "iconPlay" },
      { id: "download-cv-btn", alias: "iconDownload" },
      { id: "settings-btn", alias: "iconSettings" },
      { id: "controls-btn", alias: "iconGamepad" },
    ];

    for (const binding of buttonBindings) {
      const blockRegex = new RegExp(
        `<RetroButton[^>]*id="${binding.id}"[\\s\\S]*?<\\/RetroButton>`,
      );
      const block = source.match(blockRegex);
      expect(block, `RetroButton for ${binding.id} not found`).not.toBeNull();
      expect(block![0]).toContain(binding.alias);
      expect(block![0]).toMatch(/alt:\s*""\s*\}/);
    }

    // The label-mutation safety: the resume/swap script must target the
    // [data-retro-label] span so the <img> is not destroyed. The call may
    // span multiple lines, so tolerate whitespace between the selector
    // quotes and the brackets.
    expect(source).toMatch(/querySelector\([\s\S]*?data-retro-label[\s\S]*?\)/);
    expect(source).not.toMatch(/startGameBtn\.textContent\s*=\s*resumeLabel/);
  });
});
