import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

// str_replace_editor — create
test("shows 'Creating <filename>' for str_replace_editor create command", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "src/components/Button.tsx" }}
      isPending={false}
    />
  );
  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});

// str_replace_editor — str_replace
test("shows 'Editing <filename>' for str_replace_editor str_replace command", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "str_replace", path: "src/App.tsx" }}
      isPending={false}
    />
  );
  expect(screen.getByText("Editing App.tsx")).toBeDefined();
});

// str_replace_editor — insert
test("shows 'Editing <filename>' for str_replace_editor insert command", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "insert", path: "src/index.tsx" }}
      isPending={false}
    />
  );
  expect(screen.getByText("Editing index.tsx")).toBeDefined();
});

// str_replace_editor — view
test("shows 'Reading <filename>' for str_replace_editor view command", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "view", path: "src/utils.ts" }}
      isPending={false}
    />
  );
  expect(screen.getByText("Reading utils.ts")).toBeDefined();
});

// str_replace_editor — unknown command falls back to Editing
test("falls back to 'Editing <filename>' for unknown str_replace_editor command", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "undo_edit", path: "src/App.tsx" }}
      isPending={false}
    />
  );
  expect(screen.getByText("Editing App.tsx")).toBeDefined();
});

// file_manager — rename
test("shows 'Renaming <old> to <new>' for file_manager rename command", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "rename", path: "src/Old.tsx", new_path: "src/New.tsx" }}
      isPending={false}
    />
  );
  expect(screen.getByText("Renaming Old.tsx to New.tsx")).toBeDefined();
});

// file_manager — delete
test("shows 'Deleting <filename>' for file_manager delete command", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "delete", path: "src/Unused.tsx" }}
      isPending={false}
    />
  );
  expect(screen.getByText("Deleting Unused.tsx")).toBeDefined();
});

// Unknown tool falls back to tool name
test("falls back to tool name for unknown tools", () => {
  render(
    <ToolCallBadge
      toolName="some_unknown_tool"
      args={{}}
      isPending={false}
    />
  );
  expect(screen.getByText("some_unknown_tool")).toBeDefined();
});

// Pending state shows spinner (no green dot)
test("shows spinner when isPending is true", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "src/Button.tsx" }}
      isPending={true}
    />
  );
  // Green dot should not be present when pending
  const greenDot = container.querySelector(".bg-emerald-500");
  expect(greenDot).toBeNull();
});

// Completed state shows green dot
test("shows green dot when isPending is false", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "src/Button.tsx" }}
      isPending={false}
    />
  );
  const greenDot = container.querySelector(".bg-emerald-500");
  expect(greenDot).not.toBeNull();
});

// Handles missing path gracefully
test("shows generic label when path is missing", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create" }}
      isPending={false}
    />
  );
  expect(screen.getByText("Creating file")).toBeDefined();
});

// Nested path extracts only filename
test("extracts only the filename from a nested path", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "str_replace", path: "src/components/ui/Card.tsx" }}
      isPending={false}
    />
  );
  expect(screen.getByText("Editing Card.tsx")).toBeDefined();
});
