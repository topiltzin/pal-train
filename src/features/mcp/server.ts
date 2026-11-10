import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import type { Exercise } from "@/features/sessions/exercise.schema";
import {
  ToolInputError,
  listExercisesTool,
  listFocusAreasTool,
  planSessionTool,
} from "@/features/mcp/tools";

const SERVER_INFO = { name: "paltrain", version: "1.0.0" } as const;

/** Every tool is a read-only lookup inside Paltrain's own library (OpenAI plugin guidelines). */
const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: false,
} as const;

type ToolOutcome = { content: { type: "text"; text: string }[]; isError?: boolean };

/** Runs one tool and turns a refusal into a readable tool error with its code (contract). */
function runTool(run: () => unknown): ToolOutcome {
  try {
    return { content: [{ type: "text", text: JSON.stringify(run()) }] };
  } catch (error) {
    if (!(error instanceof ToolInputError)) {
      throw error;
    }
    const body = { code: error.code, message: error.message, detail: error.detail ?? [] };
    return { content: [{ type: "text", text: JSON.stringify(body) }], isError: true };
  }
}

/** Builds one MCP server with the three read-only tools (spec US2). */
export function buildPaltrainServer(exercises: readonly Exercise[]): McpServer {
  const server = new McpServer(SERVER_INFO, { capabilities: { tools: {} } });
  server.registerTool(
    "list_focus_areas",
    {
      description:
        "List the muscle-group focus areas (for example legs, chest, core) that a workout can target. Use first when the user has not named a focus area. Read-only.",
      inputSchema: z.object({}),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async () => runTool(() => listFocusAreasTool()),
  );
  server.registerTool(
    "list_exercises",
    {
      description:
        "List the exercises in one focus area, with minutes, equipment, and caution notes. Use when the user wants to browse a muscle group. Needs a focus id from list_focus_areas. Read-only.",
      inputSchema: z.object({ focus: z.string() }),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ focus }) => runTool(() => listExercisesTool(exercises, { focus })),
  );
  server.registerTool(
    "plan_session",
    {
      description:
        "Plan a workout for a mood, one or more focus areas (up to three), or both, for a length from 10 to 90 minutes in steps of 5. Use when the user asks for a workout. Gentle moods (tired, stressed, unmotivated) are capped at 45 minutes. Returns exercises and a safety notice. Read-only.",
      inputSchema: z.object({
        mood: z.string().optional(),
        focus: z.string().optional(),
        minutes: z.number(),
      }),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ mood, focus, minutes }) =>
      runTool(() => planSessionTool(exercises, { mood, focus, minutes })),
  );
  return server;
}

/** The Streamable HTTP handler: a fresh server per request, serving the tools above. */
export function createPaltrainHandler(exercises: readonly Exercise[]) {
  return createMcpHandler(() => buildPaltrainServer(exercises));
}
