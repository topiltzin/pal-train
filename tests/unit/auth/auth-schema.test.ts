import { getTableColumns } from "drizzle-orm";
import { getAuthTables } from "better-auth/db";
import { describe, expect, it } from "vitest";
import { buildAuthOptions } from "@/lib/auth/auth-options";
import * as authSchema from "@/lib/db/auth-schema";

const options = buildAuthOptions({
  baseURL: "https://www.pal-buddy.eu",
  secret: "s".repeat(32),
  resource: "https://www.pal-buddy.eu/mcp",
  database: {} as never,
});

const tables = getAuthTables(options as never);

describe("Better Auth Drizzle schema", () => {
  it("defines a table for every model that Better Auth expects", () => {
    // Arrange, Act
    const modelNames = Object.keys(tables);

    // Assert
    for (const model of modelNames) {
      expect(authSchema, `missing table for model ${model}`).toHaveProperty(model);
    }
  });

  it("defines a column for every field of every Better Auth model", () => {
    // Arrange, Act
    const missing: string[] = [];
    for (const [model, definition] of Object.entries(tables)) {
      const table = (authSchema as Record<string, unknown>)[model];
      if (table === undefined) {
        continue;
      }
      const columns = Object.keys(getTableColumns(table as Parameters<typeof getTableColumns>[0]));
      for (const field of Object.keys(definition.fields)) {
        if (!columns.includes(field)) {
          missing.push(`${model}.${field}`);
        }
      }
    }

    // Assert
    expect(missing).toEqual([]);
  });
});
