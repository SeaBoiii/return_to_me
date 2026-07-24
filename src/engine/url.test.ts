import { describe, expect, it } from "vitest";

import { normalizeBasePath, withBasePath } from "./url";

describe("base-path utilities", () => {
  it("normalizes root and repository bases", () => {
    expect(normalizeBasePath("")).toBe("/");
    expect(normalizeBasePath("return-to-me")).toBe("/return-to-me/");
    expect(normalizeBasePath("/owner/repo/")).toBe("/owner/repo/");
  });

  it("resolves local assets without changing absolute URLs", () => {
    expect(withBasePath("/assets/scene.webp", "/return-to-me/")).toBe(
      "/return-to-me/assets/scene.webp",
    );
    expect(
      withBasePath("/return-to-me/assets/scene.webp", "/return-to-me/"),
    ).toBe("/return-to-me/assets/scene.webp");
    expect(withBasePath("https://example.com/voice.mp3", "/repo/")).toBe(
      "https://example.com/voice.mp3",
    );
    expect(withBasePath("data:audio/mpeg;base64,AA==", "/repo/")).toBe(
      "data:audio/mpeg;base64,AA==",
    );
  });
});
