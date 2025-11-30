import { clearMocks, mockIPC } from "@tauri-apps/api/mocks";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import App from "./app";

// Top-level regex patterns for better performance
const WELCOME_REGEX = /Welcome to Tauri \+ React/i;
const ENTER_NAME_REGEX = /Enter a name/i;
const GREET_REGEX = /Greet/i;
const HELLO_WORLD_REGEX = /Hello, World!/i;
const HELLO_ALICE_REGEX = /Hello, Alice!/i;
const ERROR_REGEX = /Error:/i;

/**
 * Example tests demonstrating how to test React components that use Tauri commands.
 *
 * Key concepts:
 * - Use `mockIPC` from `@tauri-apps/api/mocks` to intercept Tauri command calls
 * - The mock receives the command name and arguments, returning the mocked response
 * - Use `clearMocks` to reset mocks between tests
 * - tauri-specta wraps results: return raw value for success, throw for errors
 *
 * @see https://v2.tauri.app/develop/tests/mocking/
 */
describe("App", () => {
  beforeEach(() => {
    // Mock the greet command to simulate Rust backend responses
    // Note: tauri-specta's generated bindings wrap responses in Result<T, E>
    // - Return the raw value for success (bindings wrap it as { status: "ok", data: value })
    // - Throw an error for failures (bindings catch and return { status: "error", error: e })
    mockIPC((cmd, args) => {
      // Handle logging plugin commands (used by logger.ts)
      if (cmd === "plugin:log|log") {
        return; // silently accept log calls
      }

      if (cmd === "greet") {
        const name = (args as { name: string }).name;

        // Simulate the same validation as the Rust command
        if (!name?.trim()) {
          // biome-ignore lint/style/useThrowOnlyError: Tauri IPC requires throwing strings
          throw "Name cannot be empty";
        }

        if (name.length > 100) {
          // biome-ignore lint/style/useThrowOnlyError: Tauri IPC requires throwing strings
          throw "Name is too long (max 100 characters)";
        }

        // Return raw success value - tauri-specta wraps it
        return `Hello, ${name.trim()}! You've been greeted from Rust!`;
      }
      // biome-ignore lint/style/useThrowOnlyError: Tauri IPC requires throwing strings
      throw `Unknown command: ${cmd}`;
    });
  });

  afterEach(() => {
    clearMocks();
  });

  it("renders the welcome heading", () => {
    render(<App />);
    expect(screen.getByText(WELCOME_REGEX)).toBeInTheDocument();
  });

  it("renders the logo links", () => {
    render(<App />);
    expect(screen.getByAltText("Vite logo")).toBeInTheDocument();
    expect(screen.getByAltText("Tauri logo")).toBeInTheDocument();
    expect(screen.getByAltText("React logo")).toBeInTheDocument();
  });

  it("greets the user when form is submitted with a valid name", async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByPlaceholderText(ENTER_NAME_REGEX);
    const button = screen.getByRole("button", { name: GREET_REGEX });

    await user.type(input, "World");
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(HELLO_WORLD_REGEX)).toBeInTheDocument();
    });
  });

  it("shows error when submitting empty name", async () => {
    const user = userEvent.setup();
    render(<App />);

    const button = screen.getByRole("button", { name: GREET_REGEX });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(ERROR_REGEX)).toBeInTheDocument();
    });
  });

  it("trims whitespace from name input", async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByPlaceholderText(ENTER_NAME_REGEX);
    const button = screen.getByRole("button", { name: GREET_REGEX });

    await user.type(input, "  Alice  ");
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(HELLO_ALICE_REGEX)).toBeInTheDocument();
    });
  });
});
