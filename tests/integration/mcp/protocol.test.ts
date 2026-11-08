import { describe, expect, it } from "vitest";
import { loadExerciseLibrary } from "@/features/sessions/exercise-library";
import { createPaltrainHandler } from "@/features/mcp/server";

const handler = createPaltrainHandler(loadExerciseLibrary().list());

async function rpc(method: string, params: Record<string, unknown>): Promise<string> {
  const response = await handler.fetch(
    new Request("https://pal-train.vercel.app/mcp", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    }),
  );
  expect(response.status).toBe(200);
  return response.text();
}

describe("MCP protocol handler", () => {
  it("lists the three read-only tools", async () => {
    // Arrange, Act
    const text = await rpc("tools/list", {});

    // Assert
    expect(text).toContain('"name":"list_focus_areas"');
    expect(text).toContain('"name":"list_exercises"');
    expect(text).toContain('"name":"plan_session"');
  });

  it("marks every tool read-only, non-destructive, and closed-world with explicit annotations", async () => {
    // Arrange, Act
    const text = await rpc("tools/list", {});

    // Assert: each tool carries the three hints as explicit booleans (OpenAI guidelines)
    expect((text.match(/"readOnlyHint":true/g) ?? []).length).toBe(3);
    expect((text.match(/"destructiveHint":false/g) ?? []).length).toBe(3);
    expect((text.match(/"openWorldHint":false/g) ?? []).length).toBe(3);
  });

  it("answers plan_session with an exercise plan and the medical notice", async () => {
    // Arrange, Act
    const text = await rpc("tools/call", {
      name: "plan_session",
      arguments: { focus: "legs", minutes: 30 },
    });

    // Assert
    expect(text).toContain("medicalNotice");
    expect(text).toContain("not medical advice");
    expect(text).not.toContain('isError":true');
  });

  it("returns a tool error with its code for an invalid length", async () => {
    // Arrange, Act
    const text = await rpc("tools/call", {
      name: "plan_session",
      arguments: { focus: "legs", minutes: 32 },
    });

    // Assert
    expect(text).toContain("invalid_minutes");
  });
});
