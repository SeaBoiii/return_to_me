import axe from "axe-core";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("virtual:pwa-register", () => ({
  registerSW: () => () => Promise.resolve(),
}));

import App from "./App";
import { StoryProvider } from "./app/StoryContext";
import {
  DEFAULT_SETTINGS,
  SAVE_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
  type SettingsV1,
} from "./engine";
import { story } from "./story";

const installMatchMedia = () => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    })),
  });
};

const renderApp = () =>
  render(
    <StoryProvider>
      <App />
    </StoryProvider>,
  );

const dismissNotice = async (
  user: ReturnType<typeof userEvent.setup>,
): Promise<void> => {
  const notice = screen.getByRole("dialog", {
    name: "A note before we begin",
  });
  await user.click(
    within(notice).getByRole("button", { name: "Continue to title" }),
  );
};

const persistSettings = (patch: Partial<SettingsV1>): void => {
  localStorage.setItem(
    SETTINGS_STORAGE_KEY,
    JSON.stringify({ ...DEFAULT_SETTINGS, ...patch, version: 1 }),
  );
};

const persistSave = (
  currentNodeId: string,
  seenNodeIds: readonly string[] = [],
): void => {
  localStorage.setItem(
    SAVE_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      storyId: story.id,
      storyRevision: story.revision,
      currentNodeId,
      status: "playing",
      history: [],
      rememberedChoices: {},
      unlockedChapters: ["prologue", "chapter-1"],
      seenNodeIds,
      timestamp: Date.now(),
    }),
  );
};
const storyLine = (id: string): string => {
  const node = story.nodes.find((candidate) => candidate.id === id);
  if (node?.type !== "line") {
    throw new Error(`Expected ${id} to be a line node.`);
  }
  return node.text;
};

beforeEach(() => {
  localStorage.clear();
  Element.prototype.scrollIntoView = vi.fn();
  installMatchMedia();
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: 1280,
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Return to Me application shell", () => {
  it("presents the factual notice before the complete title screen", async () => {
    const user = userEvent.setup();
    renderApp();

    const notice = screen.getByRole("dialog", {
      name: "A note before we begin",
    });
    expect(
      within(notice).getByText("Inspired by real events"),
    ).toBeInTheDocument();
    expect(
      within(notice).getByText(/Names, dialogue, schools/),
    ).toBeInTheDocument();
    expect(within(notice).getByText("Content note")).toBeInTheDocument();
    expect(
      within(notice).getByText(/Exact examination grades are not shown/),
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(notice).toBeInTheDocument();

    await dismissNotice(user);

    expect(
      screen.getByRole("heading", { level: 1, name: "Return to Me" }),
    ).toBeInTheDocument();
    expect(screen.getByText("The School Years")).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Game options" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "New Game" })).toBeEnabled();
  });

  it("traps keyboard focus in dismissible dialogs and restores it on Escape", async () => {
    const user = userEvent.setup();
    renderApp();

    const notice = screen.getByRole("dialog", {
      name: "A note before we begin",
    });
    await waitFor(() => expect(notice).toHaveFocus());

    const continueButton = within(notice).getByRole("button", {
      name: "Continue to title",
    });
    continueButton.focus();
    await user.tab();
    expect(continueButton).toHaveFocus();
    await user.click(continueButton);

    const settingsButton = screen.getByRole("button", { name: "Settings" });
    await user.click(settingsButton);
    const settingsDialog = screen.getByRole("dialog", { name: "Settings" });
    await waitFor(() => expect(settingsDialog).toHaveFocus());

    const close = within(settingsDialog).getByRole("button", {
      name: "Close",
    });
    const reduceMotion = within(settingsDialog).getByRole("checkbox", {
      name: /Reduce motion/,
    });

    close.focus();
    await user.tab({ shift: true });
    expect(reduceMotion).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("dialog", { name: "Settings" }),
    ).not.toBeInTheDocument();
    expect(settingsButton).toHaveFocus();
  });

  it("announces complete subtitle lines independently of the typewriter", async () => {
    persistSettings({ textSpeedMs: 0 });
    const user = userEvent.setup();
    renderApp();
    await dismissNotice(user);
    await user.click(screen.getByRole("button", { name: "New Game" }));

    const dialogue = screen.getByRole("region", { name: "Dialogue" });
    const liveLine = dialogue.querySelector<HTMLElement>("[aria-live='polite']");
    expect(liveLine).not.toBeNull();
    expect(liveLine).toHaveAttribute("aria-atomic", "true");
    expect(liveLine).toHaveTextContent(storyLine("prologue-001"));

    await user.click(
      within(dialogue).getByRole("button", { name: "Advance dialogue" }),
    );
    expect(liveLine).toHaveTextContent(storyLine("prologue-002"));

    await user.click(
      within(dialogue).getByRole("button", { name: "Advance dialogue" }),
    );
    expect(liveLine).toHaveTextContent(
      `Aleem: ${storyLine("prologue-003")}`,
    );

    const visualSubtitle =
      dialogue.querySelector<HTMLElement>("p[aria-hidden='true']");
    expect(visualSubtitle).toHaveTextContent(storyLine("prologue-003"));
  });

  it("persists reduced-motion settings and renders later lines instantly", async () => {
    const user = userEvent.setup();
    const firstRender = renderApp();
    await dismissNotice(user);
    await user.click(screen.getByRole("button", { name: "Settings" }));

    const settingsDialog = screen.getByRole("dialog", { name: "Settings" });
    const reduceMotion = within(settingsDialog).getByRole("checkbox", {
      name: /Reduce motion/,
    });
    await user.click(reduceMotion);
    expect(reduceMotion).toBeChecked();

    const stored = JSON.parse(
      localStorage.getItem(SETTINGS_STORAGE_KEY) ?? "{}",
    ) as Partial<SettingsV1>;
    expect(stored.reducedMotion).toBe(true);

    firstRender.unmount();
    renderApp();
    await dismissNotice(user);
    await user.click(screen.getByRole("button", { name: "Settings" }));
    expect(
      within(screen.getByRole("dialog", { name: "Settings" })).getByRole(
        "checkbox",
        { name: /Reduce motion/ },
      ),
    ).toBeChecked();

    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "New Game" }));

    const dialogue = screen.getByRole("region", { name: "Dialogue" });
    const visualSubtitle =
      dialogue.querySelector<HTMLElement>("p[aria-hidden='true']");
    expect(visualSubtitle).toHaveTextContent(storyLine("prologue-001"));
    expect(
      within(dialogue).getByRole("button", { name: "Advance dialogue" }),
    ).toBeEnabled();
  });

  it("skips a seen line without waiting for its typewriter", async () => {
    persistSettings({ skipSeen: true, textSpeedMs: 100 });
    persistSave("prologue-001", ["prologue-001"]);
    const user = userEvent.setup();
    renderApp();
    await dismissNotice(user);
    await user.click(screen.getByRole("button", { name: "Continue" }));

    const dialogue = screen.getByRole("region", { name: "Dialogue" });
    const liveLine = dialogue.querySelector<HTMLElement>("[aria-live='polite']");
    await waitFor(
      () => expect(liveLine).toHaveTextContent(storyLine("prologue-002")),
      { timeout: 800 },
    );
  });

  it("uses global reading shortcuts but ignores controls and open dialogs", async () => {
    persistSettings({ textSpeedMs: 0 });
    const user = userEvent.setup();
    renderApp();
    await dismissNotice(user);
    await user.click(screen.getByRole("button", { name: "New Game" }));

    const dialogue = screen.getByRole("region", { name: "Dialogue" });
    const liveLine = dialogue.querySelector<HTMLElement>("[aria-live='polite']");
    document.body.focus();
    await user.keyboard("{Enter}");
    expect(liveLine).toHaveTextContent(storyLine("prologue-002"));

    const auto = within(screen.getByLabelText("Reading controls")).getByRole(
      "button",
      { name: /Auto/ },
    );
    auto.focus();
    await user.keyboard("h");
    expect(
      screen.queryByRole("dialog", { name: "Dialogue history" }),
    ).not.toBeInTheDocument();

    auto.blur();
    await user.keyboard("h");
    expect(
      screen.getByRole("dialog", { name: "Dialogue history" }),
    ).toBeInTheDocument();
    await user.keyboard("{Enter}");
    expect(liveLine).toHaveTextContent(storyLine("prologue-002"));
  });

  it("applies scene transitions, focal points, and sprite facing", async () => {
    persistSettings({ textSpeedMs: 0 });
    persistSave("ch1-008");
    const user = userEvent.setup();
    renderApp();
    await dismissNotice(user);
    await user.click(screen.getByRole("button", { name: "Continue" }));

    const stage = screen.getByRole("figure", { name: /Scene:/ });
    expect(stage).toHaveAttribute("data-transition", "none");
    const background = stage.querySelector<HTMLImageElement>(
      "img:not([data-facing])",
    );
    expect(background?.style.objectPosition).toBe("52% 46%");
    const alya = stage.querySelector<HTMLImageElement>(
      "img[data-facing='left']",
    );
    expect(alya).toHaveAttribute("data-mirrored", "true");
    expect(alya?.style.transform).toContain("scaleX(-1)");
  });
  it("keeps mobile controls semantic, labelled, and free of serious axe violations", async () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 390,
    });
    window.dispatchEvent(new Event("resize"));

    const user = userEvent.setup();
    const { container } = renderApp();
    await dismissNotice(user);

    const options = screen.getByRole("navigation", { name: "Game options" });
    expect(
      within(options).getAllByRole("button").every(
        (button) => button.getAttribute("type") === "button",
      ),
    ).toBe(true);

    const titleA11y = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(
      titleA11y.violations.filter(
        (violation) =>
          violation.impact === "critical" || violation.impact === "serious",
      ),
    ).toEqual([]);

    await user.click(screen.getByRole("button", { name: "New Game" }));

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(
      screen.getByRole("figure", { name: /Scene:/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open chapter menu" }),
    ).toBeEnabled();

    const readingControls = screen.getByLabelText("Reading controls");
    const auto = within(readingControls).getByRole("button", { name: /Auto/ });
    const skip = within(readingControls).getByRole("button", { name: /Skip/ });
    expect(auto).toHaveAttribute("aria-pressed", "false");
    expect(skip).toHaveAttribute("aria-pressed", "false");

    const dialogue = screen.getByRole("region", { name: "Dialogue" });
    expect(
      within(dialogue).getByRole("button", {
        name: /Reveal full line|Advance dialogue/,
      }),
    ).toBeEnabled();
    expect(
      within(dialogue).getByRole("button", { name: "Replay voice" }),
    ).toBeDisabled();
  });
});

