import { describe, expect, it } from "vitest";

import {
  loadSave,
  loadSettings,
  parseSave,
  saveEngineState,
  saveSettings,
  type StorageLike,
} from "./persistence";
import { createInitialEngineState, reduceStory } from "./reducer";
import { DEFAULT_SETTINGS } from "./types";
import { testStory } from "./testFixtures";

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe("save persistence", () => {
  it("round-trips a versioned state", () => {
    const storage = new MemoryStorage();
    let state = reduceStory(
      testStory,
      createInitialEngineState(testStory),
      { type: "START_NEW" },
    );
    state = reduceStory(testStory, state, { type: "ADVANCE" });

    expect(
      saveEngineState(testStory, state, {
        storage,
        now: () => 1234,
      }),
    ).toEqual({ ok: true });

    const loaded = loadSave(testStory, { storage });
    expect(loaded.status).toBe("ok");
    if (loaded.status === "ok") {
      expect(loaded.save.currentNodeId).toBe("choice-1");
      expect(loaded.save.timestamp).toBe(1234);
      expect(loaded.migrated).toBe(false);
    }
  });

  it("rejects malformed and incompatible saves without throwing", () => {
    expect(parseSave("{broken", testStory).status).toBe("corrupt");
    expect(
      parseSave(
        JSON.stringify({
          version: 1,
          storyId: testStory.id,
          storyRevision: "another-revision",
          currentNodeId: "line-1",
          status: "playing",
          history: [],
          rememberedChoices: {},
          unlockedChapters: ["chapter-1"],
          seenNodeIds: [],
          timestamp: 1,
        }),
        testStory,
      ).status,
    ).toBe("incompatible");
  });

  it("migrates the narrow prototype save format", () => {
    const result = parseSave(
      JSON.stringify({
        version: 0,
        storyId: testStory.id,
        storyRevision: testStory.revision,
        currentNodeId: "choice-1",
        status: "playing",
        history: ["line-1"],
        choices: {},
        unlockedChapters: ["chapter-1"],
        seenNodeIds: ["line-1"],
        timestamp: 42,
      }),
      testStory,
    );

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.migrated).toBe(true);
      expect(result.save.history).toEqual([{ kind: "line", nodeId: "line-1" }]);
    }
  });
});

describe("settings persistence", () => {
  it("uses defaults for corrupt data and round-trips valid settings", () => {
    const storage = new MemoryStorage();
    storage.setItem("settings", "{no");
    expect(loadSettings({ storage, key: "settings" })).toMatchObject({
      settings: DEFAULT_SETTINGS,
      status: "corrupt",
    });

    const settings = {
      ...DEFAULT_SETTINGS,
      volume: 0.25,
      textSpeedMs: 0,
    };
    expect(saveSettings(settings, { storage, key: "settings" })).toEqual({
      ok: true,
    });
    expect(loadSettings({ storage, key: "settings" })).toMatchObject({
      settings,
      status: "ok",
    });
  });
});
